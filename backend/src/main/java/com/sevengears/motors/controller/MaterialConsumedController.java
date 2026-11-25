package com.sevengears.motors.controller;

import com.sevengears.motors.dto.MaterialConsumedDTO;
import com.sevengears.motors.model.MaterialConsumed;
import com.sevengears.motors.model.ServiceJob;
import com.sevengears.motors.repository.MaterialConsumedRepository;
import com.sevengears.motors.repository.ServiceJobRepository;
import com.sevengears.motors.model.AppUser;
import com.sevengears.motors.model.MaterialApproval;
import com.sevengears.motors.service.MaterialApprovalService;
import com.sevengears.motors.service.MaterialPdfService;
import com.sevengears.motors.service.WhatsAppService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jobs/{jobId}/materials")
public class MaterialConsumedController {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final MaterialConsumedRepository repo;
    private final ServiceJobRepository jobRepo;
    private final MaterialPdfService pdfService;
    private final WhatsAppService whatsAppService;
    private final MaterialApprovalService approvalService;

    public MaterialConsumedController(MaterialConsumedRepository repo, ServiceJobRepository jobRepo,
                                      MaterialPdfService pdfService, WhatsAppService whatsAppService,
                                      MaterialApprovalService approvalService) {
        this.repo = repo;
        this.jobRepo = jobRepo;
        this.pdfService = pdfService;
        this.whatsAppService = whatsAppService;
        this.approvalService = approvalService;
    }

    /** Latest customer approval for this job's estimate (204 if never sent). */
    @GetMapping("/approval")
    public ResponseEntity<Map<String, Object>> latestApproval(@PathVariable Long jobId) {
        Map<String, Object> a = approvalService.latestForJob(jobId);
        return a == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(a);
    }

    /** Every estimate sent to the customer for this job, newest first. */
    @GetMapping("/approval/history")
    public ResponseEntity<List<Map<String, Object>>> approvalHistory(@PathVariable Long jobId) {
        return ResponseEntity.ok(approvalService.historyForJob(jobId));
    }

    @GetMapping
    public ResponseEntity<List<MaterialConsumedDTO>> getAll(@PathVariable Long jobId) {
        return ResponseEntity.ok(repo.findByJobIdOrderByCreatedAtAsc(jobId)
                .stream().map(this::toDTO).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<MaterialConsumedDTO> create(@PathVariable Long jobId,
                                                       @Valid @RequestBody MaterialConsumedDTO dto) {
        ServiceJob job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        MaterialConsumed m = new MaterialConsumed();
        m.setJob(job);
        m.setDescription(dto.getDescription());
        m.setRemarks(dto.getRemarks());
        m.setQuantity(dto.getQuantity());
        m.setAmount(dto.getAmount());
        m.setLabour(dto.getLabour());
        return ResponseEntity.ok(toDTO(repo.save(m)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaterialConsumedDTO> update(@PathVariable Long jobId,
                                                       @PathVariable Long id,
                                                       @Valid @RequestBody MaterialConsumedDTO dto) {
        MaterialConsumed m = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Material not found: " + id));
        m.setDescription(dto.getDescription());
        m.setRemarks(dto.getRemarks());
        m.setQuantity(dto.getQuantity());
        m.setAmount(dto.getAmount());
        m.setLabour(dto.getLabour());
        return ResponseEntity.ok(toDTO(repo.save(m)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long jobId, @PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long jobId) throws Exception {
        ServiceJob job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        List<MaterialConsumed> items = repo.findByJobIdOrderByCreatedAtAsc(jobId);
        if (items.isEmpty()) return ResponseEntity.badRequest().build();
        byte[] pdf = pdfService.generate(job, items);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"Material_Estimate_" + job.getJobNumber() + ".pdf\"")
                .body(pdf);
    }

    @Transactional
    @PostMapping("/send-approval")
    public ResponseEntity<Map<String, String>> sendApproval(@PathVariable Long jobId,
                                                            @AuthenticationPrincipal AppUser user) throws Exception {
        ServiceJob job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        List<MaterialConsumed> items = repo.findByJobIdOrderByCreatedAtAsc(jobId);
        if (items.isEmpty()) return ResponseEntity.badRequest()
                .body(Map.of("message", "No materials added yet. Add items before sending."));

        String phone = job.getVehicle().getCustomer().getPhone();
        String customerName = job.getVehicle().getCustomer().getName();

        String sentBy = user != null ? (user.getDisplayName() != null ? user.getDisplayName() : user.getUsername()) : null;
        MaterialApproval approval = approvalService.create(job, items, sentBy);
        String link = approvalService.linkFor(approval);

        byte[] pdf = pdfService.generate(job, items);
        String base64 = Base64.getEncoder().encodeToString(pdf);
        String fileName = "Material_Estimate_" + job.getJobNumber() + ".pdf";
        String caption = "🚗 *7GEARS MOTORS* — Material Estimate\n\n" +
                "Hello " + customerName + ",\n\n" +
                "Please find the material estimate for your vehicle *" + job.getVehicle().getRegistrationNumber() +
                "* (Job #" + job.getJobNumber() + ").\n\n" +
                "🔩 *Material Consumed*\n" + itemLines(items) + "\n" +
                "Parts: ₹" + money(approval.getPartsTotal()) + "\n" +
                "Labour: ₹" + money(approval.getLabourTotal()) + "\n" +
                "*Grand Total: ₹" + money(approval.getGrandTotal()) + "*\n" +
                "_Tax extra on final billing._\n\n" +
                "📎 Full material details are in the attached PDF.\n\n" +
                "👇 Please tap *✅ Approve* or *❌ Reject* in the poll below.\n\n" +
                "Thank you,\n*7GEARS MOTORS*, Chennai\n\n" +
                "This is a system generated message.";

        // Send text notification first (always visible), then the PDF document
        whatsAppService.send(phone, caption);
        String msgId = whatsAppService.sendDocument(phone, base64, fileName,
                "📎 Material Estimate — " + job.getJobNumber());
        whatsAppService.sendPoll(phone, approvalService.pollQuestion(approval),
                MaterialApprovalService.POLL_OPTIONS, approval.getToken());
        approvalService.logSent(approval, items.size());
        return ResponseEntity.ok(Map.of(
                "messageId", msgId,
                "sentTo", phone,
                "approvalLink", link,
                "message", "PDF sent to " + phone));
    }

    /** Re-sends the Approve/Reject poll (same approval, no new estimate) to the customer's WhatsApp. */
    @Transactional
    @PostMapping("/approval/resend-link")
    public ResponseEntity<Map<String, String>> resendApprovalLink(@PathVariable Long jobId,
                                                                  @AuthenticationPrincipal AppUser user) {
        ServiceJob job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        MaterialApproval approval = approvalService.latestPending(jobId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No pending approval for this job. Use 'Send for Approval' first."));
        String phone = job.getVehicle().getCustomer().getPhone();
        String link = approvalService.linkFor(approval);
        List<MaterialConsumed> items = repo.findByJobIdOrderByCreatedAtAsc(jobId);
        whatsAppService.send(phone, "🚗 *7GEARS MOTORS*\n\n" +
                "Your material estimate for *" + job.getVehicle().getRegistrationNumber() +
                "* (Job #" + job.getJobNumber() + ") is waiting for your approval.\n" +
                "*Grand Total: ₹" + money(approval.getGrandTotal()) + "*\n\n" +
                "📎 Full material details are in the attached PDF.\n\n" +
                "👇 Please tap *✅ Approve* or *❌ Reject* in the poll below.");
        if (!items.isEmpty()) {
            try {
                byte[] pdf = pdfService.generate(job, items);
                whatsAppService.sendDocument(phone, Base64.getEncoder().encodeToString(pdf),
                        "Material_Estimate_" + job.getJobNumber() + ".pdf",
                        "📎 Material Estimate — " + job.getJobNumber());
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException("Could not create estimate PDF: " + e.getMessage(), e);
            }
        }
        String msgId = whatsAppService.sendPoll(phone, approvalService.pollQuestion(approval),
                MaterialApprovalService.POLL_OPTIONS, approval.getToken());
        approvalService.logResent(approval, user != null ? (user.getDisplayName() != null ? user.getDisplayName() : user.getUsername()) : null);
        return ResponseEntity.ok(Map.of("messageId", msgId, "sentTo", phone, "approvalLink", link,
                "message", "Approval poll sent to " + phone));
    }

    private static String money(java.math.BigDecimal v) {
        java.text.NumberFormat nf = java.text.NumberFormat.getNumberInstance(new java.util.Locale("en", "IN"));
        nf.setMinimumFractionDigits(2);
        nf.setMaximumFractionDigits(2);
        return nf.format(v != null ? v : java.math.BigDecimal.ZERO);
    }

    /** "1. OIL (Qty 1) — Part ₹2,000.00 + Labour ₹100.00 = ₹2,100.00" per item. */
    private static String itemLines(List<MaterialConsumed> items) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            MaterialConsumed m = items.get(i);
            sb.append(i + 1).append(". ").append(m.getDescription());
            if (m.getQuantity() != null) sb.append(" (Qty ").append(m.getQuantity().stripTrailingZeros().toPlainString()).append(")");
            sb.append("\n    Part ₹").append(money(m.getAmount()));
            if (m.getLabour() != null && m.getLabour().signum() > 0) sb.append(" + Labour ₹").append(money(m.getLabour()));
            sb.append(" = *₹").append(money(m.getLineTotal())).append("*\n");
        }
        return sb.toString();
    }

    private MaterialConsumedDTO toDTO(MaterialConsumed m) {
        MaterialConsumedDTO dto = new MaterialConsumedDTO();
        dto.setId(m.getId());
        dto.setJobId(m.getJob().getId());
        dto.setDescription(m.getDescription());
        dto.setRemarks(m.getRemarks());
        dto.setQuantity(m.getQuantity());
        dto.setAmount(m.getAmount());
        dto.setLabour(m.getLabour());
        if (m.getCreatedAt() != null) dto.setCreatedAt(m.getCreatedAt().format(FMT));
        return dto;
    }
}
