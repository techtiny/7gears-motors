package com.sevengears.motors.service;

import com.sevengears.motors.dto.FeedbackDTO;
import com.sevengears.motors.model.*;
import com.sevengears.motors.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ServiceJobRepository jobRepository;
    private final WhatsAppService whatsAppService;

    public FeedbackService(FeedbackRepository feedbackRepository,
                           ServiceJobRepository jobRepository,
                           WhatsAppService whatsAppService) {
        this.feedbackRepository = feedbackRepository;
        this.jobRepository = jobRepository;
        this.whatsAppService = whatsAppService;
    }

    public List<FeedbackDTO> findAll() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(f -> new FeedbackDTO(
                        f.getId(),
                        f.getRating(),
                        f.getComment(),
                        f.getCreatedAt(),
                        f.getServiceJob() != null ? f.getServiceJob().getId() : null,
                        f.getServiceJob() != null ? f.getServiceJob().getJobNumber() : null
                ))
                .toList();
    }

    public Map<String, Object> stats() {
        Double avg = feedbackRepository.averageRating();
        long positive = feedbackRepository.countPositive();
        long total = feedbackRepository.count();
        return Map.of(
                "averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
                "totalFeedback", total,
                "positiveCount", positive,
                "satisfactionRate", total > 0 ? Math.round((positive * 100.0) / total) : 0
        );
    }

    @Transactional
    public ServiceFeedback submit(Long jobId, int rating, String comment) {
        ServiceJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        if (feedbackRepository.findByServiceJobId(jobId).isPresent())
            throw new RuntimeException("Feedback already submitted for this job");

        ServiceFeedback fb = new ServiceFeedback();
        fb.setServiceJob(job);
        fb.setRating(rating);
        fb.setComment(comment);
        fb = feedbackRepository.save(fb);

        // Thank-you WhatsApp
        try {
            String star = "⭐".repeat(rating);
            String customer = job.getVehicle().getCustomer().getName();
            String phone = job.getVehicle().getCustomer().getPhone();
            String msg = star + " *Thank you for your feedback, " + customer + "!*\n\n" +
                    "We truly appreciate your " + rating + "/5 rating.\n" +
                    (comment != null && !comment.isBlank() ? "\"" + comment + "\"\n\n" : "\n") +
                    (rating >= 4 ? "😊 We're delighted you had a great experience!\n" : "🙏 We'll work hard to improve your next visit.\n") +
                    "\n_7Gears Motors — Your Premier Auto Care Partner_";
            whatsAppService.send(phone, msg);
        } catch (Exception ignored) {}

        return fb;
    }

    /** Send feedback request via WhatsApp */
    public void requestFeedback(Long jobId) {
        ServiceJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        String customer = job.getVehicle().getCustomer().getName();
        String phone = job.getVehicle().getCustomer().getPhone();
        String msg = "⭐ *Rate Your Experience — 7Gears Motors*\n\n" +
                "Dear " + customer + ",\n\n" +
                "Thank you for choosing 7Gears Motors for your vehicle *" +
                job.getVehicle().getRegistrationNumber() + "*.\n\n" +
                "How was your service experience? Please rate us:\n" +
                "⭐ 1 — Poor\n⭐⭐ 2 — Fair\n⭐⭐⭐ 3 — Good\n⭐⭐⭐⭐ 4 — Very Good\n⭐⭐⭐⭐⭐ 5 — Excellent\n\n" +
                "Reply with your rating number. Your feedback matters! 🙏";
        whatsAppService.send(phone, msg);
    }
}
