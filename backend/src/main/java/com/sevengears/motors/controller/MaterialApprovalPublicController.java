package com.sevengears.motors.controller;

import com.sevengears.motors.service.MaterialApprovalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Public (no login) endpoints used by the customer's WhatsApp approval link. */
@RestController
@RequestMapping("/api/public/material-approval")
public class MaterialApprovalPublicController {

    private final MaterialApprovalService service;

    public MaterialApprovalPublicController(MaterialApprovalService service) {
        this.service = service;
    }

    @GetMapping("/{token}")
    public ResponseEntity<Map<String, Object>> view(@PathVariable String token) {
        return ResponseEntity.ok(service.publicView(token));
    }

    @PostMapping("/{token}")
    public ResponseEntity<Map<String, Object>> respond(@PathVariable String token,
                                                       @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.respond(token, body.get("decision"), body.get("comment")));
    }
}
