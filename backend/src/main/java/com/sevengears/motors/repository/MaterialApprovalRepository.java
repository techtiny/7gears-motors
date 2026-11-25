package com.sevengears.motors.repository;

import com.sevengears.motors.model.MaterialApproval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaterialApprovalRepository extends JpaRepository<MaterialApproval, Long> {
    List<MaterialApproval> findByJobIdOrderBySentAtDescIdDesc(Long jobId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM MaterialApproval a WHERE a.job.id = :jobId")
    void deleteAllForJob(Long jobId);

    Optional<MaterialApproval> findByToken(String token);
    Optional<MaterialApproval> findFirstByJobIdOrderBySentAtDescIdDesc(Long jobId);
    List<MaterialApproval> findByJobIdAndStatus(Long jobId, MaterialApproval.Status status);
}
