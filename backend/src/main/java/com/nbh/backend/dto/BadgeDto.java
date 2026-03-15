package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Badge DTO for API responses.
 * Represents a badge with its definition and user-specific award information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDto {

    private UUID id;

    private String name;

    private String slug;

    private String iconUrl;

    private String description;

    private String badgeType;

    private Integer xpReward;

    private Integer stageNumber;

    /**
     * When this badge was awarded to the user (null if not awarded).
     */
    private Instant awardedAt;

    /**
     * Whether the user has pinned this badge to their profile.
     */
    private Boolean isPinned;

    /**
     * Reason for awarding this badge (if applicable).
     */
    private String awardReason;

    /**
     * Creates a BadgeDto from a BadgeDefinition entity (without user-specific info).
     */
    public static BadgeDto fromDefinition(Object badgeDefinition) {
        // This will be implemented in the service layer
        // Placeholder for type-safe conversion
        return null;
    }
}
