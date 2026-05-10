package com.sevengears.motors.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_accounts")
public class LoyaltyAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Column(nullable = false)
    private int points = 0;

    @Column(nullable = false)
    private String tier = "BRONZE"; // BRONZE / SILVER / GOLD / PLATINUM

    @Column(name = "total_earned")
    private int totalEarned = 0;

    @Column(name = "total_redeemed")
    private int totalRedeemed = 0;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); updateTier(); }

    public void addPoints(int pts) {
        this.points += pts;
        this.totalEarned += pts;
        updateTier();
    }

    private void updateTier() {
        if (totalEarned >= 10000) tier = "PLATINUM";
        else if (totalEarned >= 5000) tier = "GOLD";
        else if (totalEarned >= 1000) tier = "SILVER";
        else tier = "BRONZE";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }
    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }
    public int getTotalEarned() { return totalEarned; }
    public void setTotalEarned(int totalEarned) { this.totalEarned = totalEarned; }
    public int getTotalRedeemed() { return totalRedeemed; }
    public void setTotalRedeemed(int totalRedeemed) { this.totalRedeemed = totalRedeemed; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
