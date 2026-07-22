package com.sevengears.motors.controller;

import com.sevengears.motors.dto.MaterialConsumedDTO;
import com.sevengears.motors.model.MaterialConsumed;
import com.sevengears.motors.model.ServiceJob;
import com.sevengears.motors.repository.MaterialConsumedRepository;
import com.sevengears.motors.repository.ServiceJobRepository;
import com.sevengears.motors.service.MaterialPdfService;
import com.sevengears.motors.service.WhatsAppService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    public MaterialConsumedController(MaterialConsumedRepository repo, ServiceJobRepository jobRepo,
                                      MaterialPdfService pdfService, WhatsAppService whatsAppService) {
        this.repo = repo;
        this.jobRepo = jobRepo;
        this.pdfService = pdfService;
        this.whatsAppService = whatsAppService;
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
        return ResponseEntity.ok(toDTO(repo.save(m)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long jobId, @PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

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

    @PostMapping("/send-approval")
    public ResponseEntity<Map<String, String>> sendApproval(@PathVariable Long jobId) throws Exception {
        ServiceJob job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found: " + jobId));
        List<MaterialConsumed> items = repo.findByJobIdOrderByCreatedAtAsc(jobId);
        if (items.isEmpty()) return ResponseEntity.badRequest()
                .body(Map.of("message", "No materials added yet. Add items before sending."));

        String phone = job.getVehicle().getCustomer().getPhone();
        String customerName = job.getVehicle().getCustomer().getName();

        byte[] pdf = pdfService.generate(job, items);
        String base64 = Base64.getEncoder().encodeToString(pdf);
        String fileName = "Material_Estimate_" + job.getJobNumber() + ".pdf";
        String caption = "🚗 *7GEARS MOTORS* — Material Estimate\n\n" +
                "Hello " + customerName + ",\n\n" +
                "Please find the material estimate for your vehicle *" + job.getVehicle().getRegistrationNumber() +
                "* (Job #" + job.getJobNumber() + ").\n\n" +
                "Kindly review and reply *APPROVED* to proceed with the service.\n\n" +
                "Thank you,\n*7GEARS MOTORS*, Chennai\n\n" +
                "This is a system generated message.";

        String msgId = whatsAppService.sendDocument(phone, base64, fileName, caption);
        return ResponseEntity.ok(Map.of("messageId", msgId, "message", "PDF sent to " + phone));
    }

    private MaterialConsumedDTO toDTO(MaterialConsumed m) {
        MaterialConsumedDTO dto = new MaterialConsumedDTO();
        dto.setId(m.getId());
        dto.setJobId(m.getJob().getId());
        dto.setDescription(m.getDescription());
        dto.setRemarks(m.getRemarks());
        dto.setQuantity(m.getQuantity());
        dto.setAmount(m.getAmount());
        if (m.getCreatedAt() != null) dto.setCreatedAt(m.getCreatedAt().format(FMT));
        return dto;
    }
}
