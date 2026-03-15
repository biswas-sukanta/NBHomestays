package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Helpful Vote entity for the Elevation Engine gamification system.
 * Tracks which users marked posts as helpful.
 * Uses composite primary key (post_id, user_id).
 */
@Entity
@Table(name = "helpful_votes")
@IdClass(HelpfulVote.HelpfulVoteId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HelpfulVote {

    @Id
    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "voted_at", nullable = false)
    private Instant votedAt;

    /**
     * Composite primary key class for HelpfulVote.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HelpfulVoteId implements Serializable {
        private UUID postId;
        private UUID userId;
    }

    /**
     * Convenience constructor for creating a vote.
     */
    public HelpfulVote(UUID postId, UUID userId) {
        this.postId = postId;
        this.userId = userId;
        this.votedAt = Instant.now();
    }
}
