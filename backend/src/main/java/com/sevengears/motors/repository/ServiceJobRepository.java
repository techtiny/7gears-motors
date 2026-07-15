package com.sevengears.motors.repository;

import com.sevengears.motors.model.ServiceJob;
import com.sevengears.motors.model.ServiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServiceJobRepository extends JpaRepository<ServiceJob, Long> {
    Optional<ServiceJob> findByJobNumber(String jobNumber);
    List<ServiceJob> findByStatusOrderByCreatedAtDesc(ServiceStatus status);
    List<ServiceJob> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    @Query("SELECT s FROM ServiceJob s WHERE LOWER(s.jobNumber) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(s.vehicle.registrationNumber) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(s.vehicle.customer.name) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<ServiceJob> search(@Param("q") String query);

    @Query("SELECT COUNT(s) FROM ServiceJob s WHERE s.status = :status")
    long countByStatus(@Param("status") ServiceStatus status);

    @Query("SELECT s FROM ServiceJob s ORDER BY s.createdAt DESC")
    List<ServiceJob> findAllOrderByCreatedAtDesc();

    @Query("SELECT MAX(s.jobNumber) FROM ServiceJob s")
    Optional<String> findMaxJobNumber();
}
