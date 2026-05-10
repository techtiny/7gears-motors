package com.sevengears.motors.repository;

import com.sevengears.motors.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    List<Customer> findByNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);

    @Query("SELECT c FROM Customer c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%',:q,'%')) OR c.phone LIKE CONCAT('%',:q,'%') OR LOWER(c.email) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<Customer> search(@Param("q") String query);

    // Customers whose birthday is today
    @Query("SELECT c FROM Customer c WHERE FUNCTION('MONTH', c.birthDate) = FUNCTION('MONTH', :today) AND FUNCTION('DAY', c.birthDate) = FUNCTION('DAY', :today)")
    List<Customer> findBirthdaysToday(@Param("today") LocalDate today);

    // Insurance expiring within days
    @Query("SELECT c FROM Customer c WHERE c.insuranceExpiry BETWEEN :from AND :to")
    List<Customer> findInsuranceExpiringBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // PUC expiring within days
    @Query("SELECT c FROM Customer c WHERE c.pucExpiry BETWEEN :from AND :to")
    List<Customer> findPucExpiringBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
