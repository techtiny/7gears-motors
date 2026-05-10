package com.sevengears.motors.repository;

import com.sevengears.motors.model.ServiceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ServiceImageRepository extends JpaRepository<ServiceImage, Long> {
    List<ServiceImage> findByServiceJobIdOrderByUploadedAtAsc(Long jobId);
    List<ServiceImage> findByServiceJobIdAndImageTypeOrderByUploadedAtAsc(Long jobId, String imageType);
    void deleteByServiceJobIdAndFileName(Long jobId, String fileName);
    long countByServiceJobIdAndImageType(Long jobId, String imageType);
    Optional<ServiceImage> findFirstByServiceJobIdAndImageTypeOrderByUploadedAtAsc(Long jobId, String imageType);
}
