package com.nbh.backend.repository.projection;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Projection interface for post list data.
 * Used by optimized queries to avoid N+1 lazy loading issues.
 */
public interface PostListProjection {
    UUID getId();
    String getLocationName();
    String getTextContent();
    LocalDateTime getCreatedAt();
    int getLoveCount();
    int getShareCount();
    
    // Author fields
    UUID getAuthorId();
    String getAuthorFirstName();
    String getAuthorLastName();
    String getAuthorAvatarUrl();
    String getAuthorRole();
    boolean isAuthorVerifiedHost();
    
    // Homestay fields
    UUID getHomestayId();
    String getHomestayName();
    
    // Repost fields
    UUID getOriginalPostId();
    
    // Aggregates
    int getCommentCount();
    List<String> getTags();
}
