package com.sevengears.motors.controller;

import com.sevengears.motors.dto.FeedbackDTO;
import com.sevengears.motors.model.ServiceFeedback;
import com.sevengears.motors.service.FeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    public FeedbackController(FeedbackService feedbackService) { this.feedbackService = feedbackService; }

    @GetMapping
    public ResponseEntity<List<FeedbackDTO>> findAll() { return ResponseEntity.ok(feedbackService.findAll()); }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() { return ResponseEntity.ok(feedbackService.stats()); }

    @PostMapping
    public ResponseEntity<ServiceFeedback> submit(@RequestBody Map<String, Object> body) {
        Long jobId   = Long.valueOf(body.get("jobId").toString());
        int rating   = Integer.parseInt(body.get("rating").toString());
        String comment = body.get("comment") != null ? body.get("comment").toString() : null;
        return ResponseEntity.ok(feedbackService.submit(jobId, rating, comment));
    }

    @PostMapping("/request/{jobId}")
    public ResponseEntity<Void> request(@PathVariable Long jobId) {
        feedbackService.requestFeedback(jobId);
        return ResponseEntity.ok().build();
    }
}
