package com.sevengears.motors.repository;

import com.sevengears.motors.model.ServiceUpdate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceUpdateRepository extends JpaRepository<ServiceUpdate, Long> {
    List<ServiceUpdate> findByServiceJobIdOrderByCreatedAtAsc(Long serviceJobId);
}
