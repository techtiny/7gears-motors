package com.sevengears.motors.repository;

import com.sevengears.motors.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);
    List<Vehicle> findByCustomerId(Long customerId);

    @Query("SELECT v FROM Vehicle v WHERE LOWER(v.registrationNumber) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(v.make) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(v.model) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Vehicle> search(@Param("q") String query);
}
