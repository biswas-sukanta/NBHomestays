package com.nbh.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * User XP History entity for the Elevation Engine gamification system.
 * Immutable log of XP changes for audit and history tracking.
 */
@Entity
@Table(name = "user_xp_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserXpHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private SourceType sourceType;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "xp_delta", nullable = false)
    private Integer xpDelta;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /**
     * Source type for XP changes.
     */
    public enum SourceType {
        /** XP from post marked as helpful */
        POST_HELPFUL,
        /** XP from receiving a badge */
        BADGE_AWARD,
        /** XP from general community contribution */
        COMMUNITY_CONTRIBUTION,
        /** XP from hosting activity */
        HOST_ACTIVITY,
        /** XP from review activity */
        REVIEW_ACTIVITY,
        /** XP from referral */
        REFERRAL,
        /** XP adjustment by admin */
        ADMIN_ADJUSTMENT,
        /** XP from special event */
        SPECIAL_EVENT
    }
}
