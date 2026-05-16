package com.sevengears.motors.service;

import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CampaignService {

    private static final Logger log = LoggerFactory.getLogger(CampaignService.class);

    private final CampaignRepository campaignRepository;
    private final CustomerRepository customerRepository;
    private final ServiceJobRepository jobRepository;
    private final WhatsAppService whatsAppService;

    public CampaignService(CampaignRepository campaignRepository,
                           CustomerRepository customerRepository,
                           ServiceJobRepository jobRepository,
                           WhatsAppService whatsAppService) {
        this.campaignRepository = campaignRepository;
        this.customerRepository = customerRepository;
        this.jobRepository = jobRepository;
        this.whatsAppService = whatsAppService;
    }

    @Transactional(readOnly = true)
    public List<Campaign> findAll() { return campaignRepository.findAllByOrderByCreatedAtDesc(); }

    @Transactional(readOnly = true)
    public Campaign findById(Long id) {
        return campaignRepository.findById(id).orElseThrow(() -> new RuntimeException("Campaign not found: " + id));
    }

    @Transactional
    public Campaign create(Campaign campaign) { return campaignRepository.save(campaign); }

    @Transactional
    public Map<String, Object> execute(Long campaignId) {
        Campaign campaign = findById(campaignId);
        campaign.setStatus(CampaignStatus.RUNNING);
        campaign.setExecutedAt(LocalDateTime.now());
        campaignRepository.save(campaign);

        List<Customer> targets = resolveTargets(campaign);
        campaign.setTotalTargeted(targets.size());

        int sent = 0, failed = 0;
        for (Customer customer : targets) {
            try {
                String msg = personalise(campaign.getMessageTemplate(), customer);
                whatsAppService.send(customer.getPhone(), msg);
                sent++;
                Thread.sleep(600); // avoid spam detection
            } catch (Exception e) {
                log.warn("Campaign {} failed for {}: {}", campaignId, customer.getPhone(), e.getMessage());
                failed++;
            }
        }

        campaign.setTotalSent(sent);
        campaign.setTotalFailed(failed);
        campaign.setStatus(CampaignStatus.COMPLETED);
        campaignRepository.save(campaign);

        return Map.of("targeted", targets.size(), "sent", sent, "failed", failed);
    }

    // ── Template messages for each campaign type ──────────────────
    public static String templateFor(CampaignType type, String customMessage) {
        if (customMessage != null && !customMessage.isBlank()) return customMessage;
        return switch (type) {
            case SERVICE_DUE ->
                "🚗 *7Gears Motors* — Service Reminder\n\nHello {{name}},\n\nYour vehicle *{{vehicle}}* is due for periodic service. Regular servicing keeps your car running smoothly and safely.\n\n📅 Book your appointment now!\n📞 +91 78260 47847\n\n_7Gears Motors, Selaiyur, Chennai_";
            case BIRTHDAY ->
                "🎂 *Happy Birthday {{name}}!*\n\nWishing you a wonderful day from all of us at *7Gears Motors*! 🎉\n\nAs our special gift, enjoy *10% OFF* on your next service this month.\n\nBook now: +91 78260 47847\n_Valid this month only_ 🎁";
            case FESTIVAL ->
                "🪔 *Warm Festival Wishes!*\n\nDear {{name}},\n\nThe team at *7Gears Motors* wishes you and your family a joyful celebration! 🎊\n\nEnjoy *Free Car Wash* with any service this festive season.\n\n📞 +91 78260 47847 | Selaiyur, Chennai";
            case PROMOTIONAL ->
                "🔧 *Special Offer — 7Gears Motors*\n\nHello {{name}},\n\nThis month only: *₹499 All-Inclusive Basic Service* for your vehicle {{vehicle}}!\n\nIncludes oil change + filter + 20-point inspection.\n\n📞 Book: +91 78260 47847";
            case INSURANCE_RENEWAL ->
                "⚠️ *Insurance Renewal Reminder*\n\nDear {{name}},\n\nYour vehicle *{{vehicle}}* insurance is expiring soon. Drive safe and stay protected!\n\nWe help with insurance renewals at our service center.\n\n📞 +91 78260 47847 | 7Gears Motors";
            case PUC_RENEWAL ->
                "📋 *PUC Certificate Reminder*\n\nDear {{name}},\n\nThe PUC certificate for *{{vehicle}}* is expiring soon. Avoid penalties — get it renewed!\n\nPUC testing available at our center.\n📞 +91 78260 47847 | 7Gears Motors";
            case FOLLOW_UP ->
                "⭐ *How was your service experience?*\n\nDear {{name}},\n\nThank you for choosing *7Gears Motors*! We hope your vehicle *{{vehicle}}* is running great.\n\nPlease rate your experience (1–5): Reply with a number.\nYour feedback helps us serve you better! 🙏\n\n_7Gears Motors Team_";
            case REENGAGEMENT ->
                "👋 *We Miss You, {{name}}!*\n\nIt's been a while since we serviced your vehicle *{{vehicle}}*. We'd love to see you back!\n\n🎁 Special returning customer offer: *15% OFF* on next service.\n\n📞 +91 78260 47847 | 7Gears Motors, Chennai";
        };
    }

    private List<Customer> resolveTargets(Campaign campaign) {
        return switch (campaign.getType()) {
            case SERVICE_DUE   -> getServiceDueCustomers(90);
            case BIRTHDAY      -> customerRepository.findBirthdaysToday(LocalDate.now());
            case INSURANCE_RENEWAL -> customerRepository.findInsuranceExpiringBetween(LocalDate.now(), LocalDate.now().plusDays(30));
            case PUC_RENEWAL   -> customerRepository.findPucExpiringBetween(LocalDate.now(), LocalDate.now().plusDays(30));
            case REENGAGEMENT  -> getServiceDueCustomers(180);
            default            -> customerRepository.findAll();
        };
    }

    public List<Customer> getServiceDueCustomers(int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        List<Long> activeCustomerIds = jobRepository.findAllOrderByCreatedAtDesc().stream()
                .collect(Collectors.toMap(
                        j -> j.getVehicle().getCustomer().getId(),
                        j -> j.getCreatedAt(),
                        (existing, replacement) -> existing.compareTo(replacement) > 0 ? existing : replacement
                ))
                .entrySet().stream()
                .filter(e -> e.getValue() != null && e.getValue().isBefore(cutoff))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        return customerRepository.findAll().stream()
                .filter(c -> activeCustomerIds.contains(c.getId()))
                .collect(Collectors.toList());
    }

    private String personalise(String template, Customer customer) {
        String vehicle = customer.getVehicles() != null && !customer.getVehicles().isEmpty()
                ? customer.getVehicles().get(0).getRegistrationNumber() : "your vehicle";
        return template
                .replace("{{name}}", customer.getName())
                .replace("{{phone}}", customer.getPhone())
                .replace("{{vehicle}}", vehicle);
    }
}
