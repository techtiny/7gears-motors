package com.sevengears.motors.controller;

import com.sevengears.motors.model.*;
import com.sevengears.motors.service.CampaignService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService campaignService;
    public CampaignController(CampaignService campaignService) { this.campaignService = campaignService; }

    @GetMapping
    public ResponseEntity<List<Campaign>> findAll() { return ResponseEntity.ok(campaignService.findAll()); }

    @GetMapping("/{id}")
    public ResponseEntity<Campaign> findById(@PathVariable Long id) { return ResponseEntity.ok(campaignService.findById(id)); }

    @PostMapping
    public ResponseEntity<Campaign> create(@RequestBody Map<String, String> body) {
        Campaign c = new Campaign();
        c.setName(body.get("name"));
        c.setType(CampaignType.valueOf(body.get("type")));
        String custom = body.get("messageTemplate");
        c.setMessageTemplate(CampaignService.templateFor(c.getType(), custom));
        c.setTargetSegment(body.getOrDefault("targetSegment", "AUTO"));
        return ResponseEntity.ok(campaignService.create(c));
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<Map<String, Object>> execute(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.execute(id));
    }

    @GetMapping("/template/{type}")
    public ResponseEntity<Map<String, String>> template(@PathVariable String type) {
        String tpl = CampaignService.templateFor(CampaignType.valueOf(type), null);
        return ResponseEntity.ok(Map.of("template", tpl));
    }

    @GetMapping("/service-due-count")
    public ResponseEntity<Map<String, Integer>> serviceDueCount() {
        int count = campaignService.getServiceDueCustomers(90).size();
        return ResponseEntity.ok(Map.of("count", count));
    }
}
