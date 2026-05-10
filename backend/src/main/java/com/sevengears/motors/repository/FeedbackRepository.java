package com.sevengears.motors.repository;

import com.sevengears.motors.model.ServiceFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<ServiceFeedback, Long> {
    Optional<ServiceFeedback> findByServiceJobId(Long serviceJobId);
    List<ServiceFeedback> findAllByOrderByCreatedAtDesc();

    @Query("SELECT AVG(f.rating) FROM ServiceFeedback f")
    Double averageRating();

    @Query("SELECT COUNT(f) FROM ServiceFeedback f WHERE f.rating >= 4")
    long countPositive();
}
