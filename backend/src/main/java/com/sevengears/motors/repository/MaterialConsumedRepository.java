package com.sevengears.motors.repository;

import com.sevengears.motors.model.MaterialConsumed;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaterialConsumedRepository extends JpaRepository<MaterialConsumed, Long> {
    List<MaterialConsumed> findByJobIdOrderByCreatedAtAsc(Long jobId);
}
