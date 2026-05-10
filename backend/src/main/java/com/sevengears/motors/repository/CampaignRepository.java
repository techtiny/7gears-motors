package com.sevengears.motors.repository;

import com.sevengears.motors.model.Campaign;
import com.sevengears.motors.model.CampaignType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findAllByOrderByCreatedAtDesc();
    List<Campaign> findByType(CampaignType type);
}
