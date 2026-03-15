package com.nbh.backend.repository;

import com.nbh.backend.model.UserXpHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserXpHistoryRepository extends JpaRepository<UserXpHistory, UUID> {
    
    List<UserXpHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    List<UserXpHistory> findByUserIdAndSourceType(UUID userId, UserXpHistory.SourceType sourceType);
}
