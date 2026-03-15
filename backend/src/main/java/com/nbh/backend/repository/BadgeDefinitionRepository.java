package com.nbh.backend.repository;

import com.nbh.backend.model.BadgeDefinition;
import com.nbh.backend.model.BadgeDefinition.BadgeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BadgeDefinitionRepository extends JpaRepository<BadgeDefinition, UUID> {
    
    Optional<BadgeDefinition> findBySlug(String slug);
    
    boolean existsBySlug(String slug);
    
    List<BadgeDefinition> findByBadgeTypeOrderByStageNumberAsc(BadgeType badgeType);
}
