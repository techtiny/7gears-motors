package com.sevengears.motors.controller;

import com.sevengears.motors.dto.MaterialConsumedDTO;
import com.sevengears.motors.model.MaterialConsumed;
import com.sevengears.motors.model.ServiceJob;
import com.sevengears.motors.repository.MaterialConsumedRepository;
import com.sevengears.motors.repository.ServiceJobRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jobs/{jobId}/materials")
public class MaterialConsumedController {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final MaterialConsumedRepository repo;
    private final ServiceJobRepository jobRepo;

    public MaterialConsumedController(MaterialConsumedRepository repo, ServiceJobRepository jobRepo) {
        this.repo = repo;
        this.jobRepo = jobRepo;
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
