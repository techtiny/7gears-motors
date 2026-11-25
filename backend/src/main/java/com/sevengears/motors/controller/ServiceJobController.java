package com.sevengears.motors.controller;

import com.sevengears.motors.dto.DashboardDTO;
import com.sevengears.motors.dto.ServiceJobDTO;
import com.sevengears.motors.dto.ServiceUpdateDTO;
import com.sevengears.motors.model.ServiceStatus;
import com.sevengears.motors.service.ServiceJobService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
public class ServiceJobController {

    private final ServiceJobService jobService;
    @org.springframework.beans.factory.annotation.Autowired
    private com.sevengears.motors.service.TermsService termsService;

    public ServiceJobController(ServiceJobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard() {
        return ResponseEntity.ok(jobService.getDashboard());
    }

    @GetMapping
    public ResponseEntity<List<ServiceJobDTO>> findAll(@RequestParam(required = false) String q,
                                                        @RequestParam(required = false) String status) {
        if (q != null && !q.isBlank()) return ResponseEntity.ok(jobService.search(q));
        if (status != null) return ResponseEntity.ok(jobService.findByStatus(ServiceStatus.valueOf(status)));
        return ResponseEntity.ok(jobService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceJobDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.findById(id));
    }

    @GetMapping("/track/{jobNumber}")
    public ResponseEntity<ServiceJobDTO> track(@PathVariable String jobNumber) {
        return ResponseEntity.ok(jobService.findByJobNumber(jobNumber));
    }

    @PostMapping
    public ResponseEntity<ServiceJobDTO> create(@Valid @RequestBody ServiceJobDTO dto,
                                                @org.springframework.security.core.annotation.AuthenticationPrincipal
                                                com.sevengears.motors.model.AppUser user) {
        ServiceJobDTO created = jobService.create(dto);
        // One WhatsApp to the customer: vehicle received + Job ID + Terms & Conditions (text, PDF, Accept poll).
        // A WhatsApp failure must not undo the job — staff can resend from the job page.
        String by = user == null ? null : (user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
        try {
            termsService.sendOnJobCreated(created.getId(), by);
            created = jobService.findById(created.getId());
            created.setTermsSent(true);
        } catch (Exception e) {
            created.setTermsSent(false);
            created.setTermsError(e.getMessage());
        }
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceJobDTO> update(@PathVariable Long id, @RequestBody ServiceJobDTO dto) {
        return ResponseEntity.ok(jobService.update(id, dto));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ServiceJobDTO> updateStatus(@PathVariable Long id,
                                                       @RequestBody Map<String, String> body) {
        ServiceStatus status = ServiceStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(jobService.updateStatus(id, status, body.get("message"), body.get("sentBy")));
    }

    @PostMapping("/{id}/updates")
    public ResponseEntity<ServiceUpdateDTO> addUpdate(@PathVariable Long id,
                                                       @Valid @RequestBody ServiceUpdateDTO dto) {
        return ResponseEntity.ok(jobService.addUpdate(id, dto));
    }

    @PostMapping("/{id}/updates/{updateId}/send-whatsapp")
    public ResponseEntity<?> sendWhatsApp(@PathVariable Long id,
                                          @PathVariable Long updateId) {
        try {
            return ResponseEntity.ok(jobService.sendWhatsApp(id, updateId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(503)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        jobService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/whatsapp-status")
    public ResponseEntity<java.util.Map<String, Object>> whatsAppStatus() {
        return ResponseEntity.ok(java.util.Map.of("enabled", jobService.isWhatsAppEnabled()));
    }
}
