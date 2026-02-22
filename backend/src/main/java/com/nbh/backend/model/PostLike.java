package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "post_likes", indexes = @Index(name = "idx_post_likes_post_id", columnList = "post_id"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = { "userId", "postId" })
@IdClass(PostLike.PostLikePk.class)
public class PostLike {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "liked_at", nullable = false)
    @Builder.Default
    private LocalDateTime likedAt = LocalDateTime.now();

    // ── Composite PK Class ────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostLikePk implements Serializable {
        private UUID userId;
        private UUID postId;
    }
}
