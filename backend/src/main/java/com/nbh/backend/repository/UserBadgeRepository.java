package com.nbh.backend.repository;

import com.nbh.backend.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, UUID> {
    
    List<UserBadge> findByUserId(UUID userId);
    
    List<UserBadge> findByUserIdAndIsPinnedTrue(UUID userId);
    
    Optional<UserBadge> findByUserIdAndBadgeId(UUID userId, UUID badgeId);
    
    boolean existsByUserIdAndBadgeId(UUID userId, UUID badgeId);
    
    @Query("SELECT CASE WHEN COUNT(ub) > 0 THEN true ELSE false END FROM UserBadge ub WHERE ub.user.id = :userId AND ub.badge.slug = :badgeSlug")
    boolean existsByUserIdAndBadgeSlug(@Param("userId") UUID userId, @Param("badgeSlug") String badgeSlug);
}
