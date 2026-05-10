package com.sevengears.motors.service;

import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class LoyaltyService {

    private final LoyaltyRepository loyaltyRepository;
    private final CustomerRepository customerRepository;

    public LoyaltyService(LoyaltyRepository loyaltyRepository, CustomerRepository customerRepository) {
        this.loyaltyRepository = loyaltyRepository;
        this.customerRepository = customerRepository;
    }

    public LoyaltyAccount getOrCreate(Long customerId) {
        return loyaltyRepository.findByCustomerId(customerId).orElseGet(() -> {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found: " + customerId));
            LoyaltyAccount acc = new LoyaltyAccount();
            acc.setCustomer(customer);
            return loyaltyRepository.save(acc);
        });
    }

    /** Award points for a completed service: ₹100 = 10 pts + 50 bonus per visit */
    @Transactional
    public LoyaltyAccount awardForService(Long customerId, BigDecimal amount) {
        LoyaltyAccount acc = getOrCreate(customerId);
        int pts = 50; // visit bonus
        if (amount != null) pts += (amount.intValue() / 100) * 10; // spend-based
        acc.addPoints(pts);
        return loyaltyRepository.save(acc);
    }

    @Transactional
    public LoyaltyAccount redeem(Long customerId, int points) {
        LoyaltyAccount acc = getOrCreate(customerId);
        if (acc.getPoints() < points) throw new RuntimeException("Insufficient points");
        acc.setPoints(acc.getPoints() - points);
        acc.setTotalRedeemed(acc.getTotalRedeemed() + points);
        return loyaltyRepository.save(acc);
    }

    public int pointsToRupees(int points) { return points / 10; } // 10 points = ₹1
}
