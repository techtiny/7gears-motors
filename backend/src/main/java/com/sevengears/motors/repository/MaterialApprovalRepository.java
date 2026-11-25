package com.sevengears.motors.repository;

import com.sevengears.motors.model.MaterialApproval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MaterialApprovalRepository extends JpaRepository<MaterialApproval, Long> {
    List<MaterialApproval> findByJobIdOrderBySentAtDescIdDesc(Long jobId);

    Optional<MaterialApproval> findByToken(String token);
    Optional<MaterialApproval> findFirstByJobIdOrderBySentAtDescIdDesc(Long jobId);
    List<MaterialApproval> findByJobIdAndStatus(Long jobId, MaterialApproval.Status status);
}
