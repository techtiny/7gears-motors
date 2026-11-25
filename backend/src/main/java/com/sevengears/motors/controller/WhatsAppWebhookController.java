package com.sevengears.motors.controller;

import com.sevengears.motors.service.MaterialApprovalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/**
 * Called by the WhatsApp gateway (not by browsers) when a customer votes on an
 * approval poll. Protected by a shared secret header instead of a user login.
 */
@RestController
@RequestMapping("/api/public/whatsapp")
public class WhatsAppWebhookController {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppWebhookController.class);

    private final MaterialApprovalService approvalService;
    private final com.sevengears.motors.service.TermsService termsService;

    @Value("${whatsapp.webhook-secret}")
    private String webhookSecret;

    public WhatsAppWebhookController(MaterialApprovalService approvalService,
                                     com.sevengears.motors.service.TermsService termsService) {
        this.approvalService = approvalService;
        this.termsService = termsService;
    }

    @PostMapping("/poll-vote")
    public ResponseEntity<Map<String, String>> pollVote(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @RequestBody Map<String, Object> body) {
        if (secret == null || !MessageDigest.isEqual(
                secret.getBytes(StandardCharsets.UTF_8), webhookSecret.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Forbidden"));
        }
        String ref = (String) body.get("ref");
        int optionIndex = body.get("optionIndex") instanceof Number n ? n.intValue() : -1;
        log.info("🗳️ WhatsApp poll vote: option {} for approval {}", optionIndex,
                ref != null && ref.length() > 6 ? ref.substring(0, 6) + "…" : ref);
        // "T-…" refs are Terms & Conditions polls; everything else is a material estimate approval
        String reply = ref != null && ref.startsWith("T-")
                ? termsService.respondFromPoll(ref, optionIndex)
                : approvalService.respondFromPoll(ref, optionIndex);
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
