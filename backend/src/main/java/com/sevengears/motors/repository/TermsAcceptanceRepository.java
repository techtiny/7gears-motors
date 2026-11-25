package com.sevengears.motors.repository;

import com.sevengears.motors.model.TermsAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TermsAcceptanceRepository extends JpaRepository<TermsAcceptance, Long> {
    Optional<TermsAcceptance> findByToken(String token);
    List<TermsAcceptance> findByJobIdOrderBySentAtDescIdDesc(Long jobId);
    Optional<TermsAcceptance> findFirstByJobIdOrderBySentAtDescIdDesc(Long jobId);
    List<TermsAcceptance> findByJobIdAndStatus(Long jobId, TermsAcceptance.Status status);
    boolean existsByJobIdAndStatus(Long jobId, TermsAcceptance.Status status);
}
