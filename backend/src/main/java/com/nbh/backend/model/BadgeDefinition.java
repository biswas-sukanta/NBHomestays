package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Badge Definition entity for the Elevation Engine gamification system.
 * Defines available badges and elevation stages.
 */
@Entity
@Table(name = "badge_definitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_type", nullable = false)
    private BadgeType badgeType;

    @Column(name = "icon_url", columnDefinition = "TEXT")
    private String iconUrl;

    @Column(name = "xp_reward", nullable = false)
    @Builder.Default
    private Integer xpReward = 0;

    @Column(name = "stage_number")
    private Integer stageNumber;

    @Column(name = "min_xp_threshold", nullable = false)
    @Builder.Default
    private Integer minXpThreshold = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    /**
     * Badge type classification.
     */
    public enum BadgeType {
        /** Elevation stage badges (Explorer, Guide, Expert, etc.) */
        STAGE,
        /** Achievement badges earned for specific accomplishments */
        ACHIEVEMENT,
        /** Special badges (community contributions, events, etc.) */
        SPECIAL
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
