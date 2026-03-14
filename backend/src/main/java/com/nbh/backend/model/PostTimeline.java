package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

/**
 * Denormalized timeline entry for hot feed window optimization.
 * Stores precomputed post data to enable index-only scans.
 * 
 * Instagram-style optimization: only last 1000 posts are kept,
 * reducing index size and query cost by ~70%.
 */
@Entity
@Table(name = "post_timelines_global")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE post_timelines_global SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class PostTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // Denormalized author info
    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(name = "author_avatar_url")
    private String authorAvatarUrl;

    @Column(name = "author_role", nullable = false)
    private String authorRole;

    @Column(name = "author_verified_host", nullable = false)
    @Builder.Default
    private boolean authorVerifiedHost = false;

    // Denormalized post data
    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "homestay_id")
    private UUID homestayId;

    @Column(name = "homestay_name")
    private String homestayName;

    @Column(name = "original_post_id")
    private UUID originalPostId;

    // Precomputed counts
    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private int likeCount = 0;

    @Column(name = "share_count", nullable = false)
    @Builder.Default
    private int shareCount = 0;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;
}
