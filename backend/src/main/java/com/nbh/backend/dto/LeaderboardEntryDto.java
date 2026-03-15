package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Leaderboard entry DTO for the community leaderboard.
 * Contains user ranking information with gamification data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardEntryDto {
    
    /** Rank position (1-based) */
    private int rank;
    
    /** User ID */
    private UUID userId;
    
    /** Display name (first + last name) */
    private String displayName;
    
    /** Avatar URL */
    private String avatarUrl;
    
    /** Total XP points */
    private int totalXp;
    
    /** Current stage title (e.g., "The Musafir") */
    private String stageTitle;
    
    /** Current stage icon URL */
    private String stageIconUrl;
    
    /** Number of posts */
    private long postCount;
    
    /** Number of followers */
    private long followersCount;
}
