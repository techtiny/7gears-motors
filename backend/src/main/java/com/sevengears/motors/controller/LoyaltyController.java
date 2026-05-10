package com.sevengears.motors.controller;

import com.sevengears.motors.model.LoyaltyAccount;
import com.sevengears.motors.service.LoyaltyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/loyalty")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;
    public LoyaltyController(LoyaltyService loyaltyService) { this.loyaltyService = loyaltyService; }

    @GetMapping("/{customerId}")
    public ResponseEntity<LoyaltyAccount> get(@PathVariable Long customerId) {
        return ResponseEntity.ok(loyaltyService.getOrCreate(customerId));
    }

    @PostMapping("/{customerId}/award")
    public ResponseEntity<LoyaltyAccount> award(@PathVariable Long customerId, @RequestBody Map<String, Object> body) {
        BigDecimal amount = body.get("amount") != null ? new BigDecimal(body.get("amount").toString()) : null;
        return ResponseEntity.ok(loyaltyService.awardForService(customerId, amount));
    }

    @PostMapping("/{customerId}/redeem")
    public ResponseEntity<LoyaltyAccount> redeem(@PathVariable Long customerId, @RequestBody Map<String, Object> body) {
        int points = Integer.parseInt(body.get("points").toString());
        return ResponseEntity.ok(loyaltyService.redeem(customerId, points));
    }
}
