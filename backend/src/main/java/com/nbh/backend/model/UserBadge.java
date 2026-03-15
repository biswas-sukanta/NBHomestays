package com.nbh.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.JdbcTypeCode;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * User Badge entity for the Elevation Engine gamification system.
 * Represents a badge awarded to a user.
 */
@Entity
@Table(name = "user_badges")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "badge_id", nullable = false)
    private BadgeDefinition badge;

    @Column(name = "awarded_at", nullable = false)
    @Builder.Default
    private Instant awardedAt = Instant.now();

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean isPinned = false;

    @Column(name = "award_reason", columnDefinition = "TEXT")
    private String awardReason;

    @Column(name = "metadata", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    /**
     * Convenience method to get badge name.
     */
    @Transient
    public String getBadgeName() {
        return badge != null ? badge.getName() : null;
    }

    /**
     * Convenience method to get badge icon URL.
     */
    @Transient
    public String getBadgeIconUrl() {
        return badge != null ? badge.getIconUrl() : null;
    }

    /**
     * Convenience method to get badge slug.
     */
    @Transient
    public String getBadgeSlug() {
        return badge != null ? badge.getSlug() : null;
    }
}
