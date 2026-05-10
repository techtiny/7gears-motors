package com.sevengears.motors.model;

public enum CampaignType {
    SERVICE_DUE,        // Customers overdue for service (>90 days)
    BIRTHDAY,           // Birthday wishes with offer
    FESTIVAL,           // Diwali, Pongal, New Year greetings
    PROMOTIONAL,        // Custom promo / seasonal offer
    INSURANCE_RENEWAL,  // Insurance expiring in ≤30 days
    PUC_RENEWAL,        // PUC expiring in ≤30 days
    FOLLOW_UP,          // Post-service feedback request (3 days after delivery)
    REENGAGEMENT        // Customers not visited in 6+ months
}
