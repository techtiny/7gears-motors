package com.sevengears.motors.scheduler;

import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.*;
import com.sevengears.motors.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class EngagementScheduler {

    private static final Logger log = LoggerFactory.getLogger(EngagementScheduler.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final CustomerRepository customerRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceJobRepository jobRepository;
    private final WhatsAppService whatsAppService;
    private final FeedbackService feedbackService;
    private final CampaignService campaignService;

    public EngagementScheduler(CustomerRepository customerRepository,
                                AppointmentRepository appointmentRepository,
                                ServiceJobRepository jobRepository,
                                WhatsAppService whatsAppService,
                                FeedbackService feedbackService,
                                CampaignService campaignService) {
        this.customerRepository = customerRepository;
        this.appointmentRepository = appointmentRepository;
        this.jobRepository = jobRepository;
        this.whatsAppService = whatsAppService;
        this.feedbackService = feedbackService;
        this.campaignService = campaignService;
    }

    /** Every day at 9:00 AM — Birthday wishes */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendBirthdayWishes() {
        List<Customer> birthdays = customerRepository.findBirthdaysToday(LocalDate.now());
        log.info("Birthday scheduler: {} customers today", birthdays.size());
        for (Customer c : birthdays) {
            try {
                String msg = "🎂 *Happy Birthday " + c.getName() + "!*\n\n" +
                        "Wishing you a wonderful day from all of us at *7Gears Motors*! 🎉\n\n" +
                        "As our gift to you: *10% OFF* on your next service this month.\n\n" +
                        "📞 +91 78260 47847 | Selaiyur, Chennai 🎁";
                whatsAppService.send(c.getPhone(), msg);
                Thread.sleep(600);
            } catch (Exception e) {
                log.warn("Birthday wish failed for {}: {}", c.getPhone(), e.getMessage());
            }
        }
    }

    /** Every day at 9:30 AM — Appointment reminders (day before) */
    @Scheduled(cron = "0 30 9 * * *")
    public void sendAppointmentReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Appointment> appts = appointmentRepository.findUnsentRemindersForDate(tomorrow);
        log.info("Appointment reminders: {} for {}", appts.size(), tomorrow);
        for (Appointment a : appts) {
            try {
                String msg = "📅 *Appointment Reminder — 7Gears Motors*\n\n" +
                        "Hello " + a.getCustomer().getName() + ",\n\n" +
                        "Reminder: Your service appointment is *tomorrow*!\n" +
                        "📅 " + a.getAppointmentDate().format(DATE_FMT) + " at " + a.getAppointmentTime() + "\n" +
                        "🔧 " + (a.getServiceType() != null ? a.getServiceType() : "General Service") + "\n\n" +
                        "📍 7Gears Motors, Selaiyur, Tambaram, Chennai\n" +
                        "📞 +91 78260 47847\n\n_Reply CANCEL to cancel._";
                whatsAppService.send(a.getCustomer().getPhone(), msg);
                a.setReminderSent(true);
                appointmentRepository.save(a);
                Thread.sleep(600);
            } catch (Exception e) {
                log.warn("Reminder failed for appointment {}: {}", a.getId(), e.getMessage());
            }
        }
    }

    /** Every day at 10:00 AM — Insurance expiry alerts (30 days before) */
    @Scheduled(cron = "0 0 10 * * *")
    public void sendInsuranceReminders() {
        LocalDate in30 = LocalDate.now().plusDays(30);
        List<Customer> customers = customerRepository.findInsuranceExpiringBetween(LocalDate.now(), in30);
        log.info("Insurance reminders: {} customers", customers.size());
        for (Customer c : customers) {
            try {
                String msg = "⚠️ *Insurance Renewal Reminder — 7Gears Motors*\n\n" +
                        "Dear " + c.getName() + ",\n\n" +
                        "Your vehicle insurance is expiring on *" + c.getInsuranceExpiry().format(DATE_FMT) + "*.\n\n" +
                        "Don't drive uninsured! We can help you renew at our center.\n" +
                        "📞 +91 78260 47847 | 7Gears Motors, Chennai";
                whatsAppService.send(c.getPhone(), msg);
                Thread.sleep(600);
            } catch (Exception e) {
                log.warn("Insurance reminder failed for {}: {}", c.getPhone(), e.getMessage());
            }
        }
    }

    /** Every day at 10:30 AM — PUC expiry alerts */
    @Scheduled(cron = "0 30 10 * * *")
    public void sendPucReminders() {
        LocalDate in15 = LocalDate.now().plusDays(15);
        List<Customer> customers = customerRepository.findPucExpiringBetween(LocalDate.now(), in15);
        log.info("PUC reminders: {} customers", customers.size());
        for (Customer c : customers) {
            try {
                String msg = "📋 *PUC Certificate Expiring Soon!*\n\n" +
                        "Dear " + c.getName() + ",\n\n" +
                        "Your vehicle's PUC certificate expires on *" + c.getPucExpiry().format(DATE_FMT) + "*.\n\n" +
                        "Avoid traffic fines! PUC testing available at our center.\n" +
                        "📞 +91 78260 47847 | 7Gears Motors, Selaiyur";
                whatsAppService.send(c.getPhone(), msg);
                Thread.sleep(600);
            } catch (Exception e) {
                log.warn("PUC reminder failed for {}: {}", c.getPhone(), e.getMessage());
            }
        }
    }

    /** Every day at 11:00 AM — Post-service feedback (3 days after delivery) */
    @Scheduled(cron = "0 0 11 * * *")
    public void sendFeedbackRequests() {
        LocalDate threeDaysAgo = LocalDate.now().minusDays(3);
        jobRepository.findByStatusOrderByCreatedAtDesc(ServiceStatus.DELIVERED).stream()
                .filter(j -> j.getDeliveredAt() != null
                        && j.getDeliveredAt().toLocalDate().equals(threeDaysAgo))
                .forEach(j -> {
                    try {
                        feedbackService.requestFeedback(j.getId());
                        Thread.sleep(600);
                    } catch (Exception e) {
                        log.warn("Feedback request failed for job {}: {}", j.getId(), e.getMessage());
                    }
                });
    }
}
