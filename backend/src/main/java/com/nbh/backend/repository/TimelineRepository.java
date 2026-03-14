package com.nbh.backend.repository;

import com.nbh.backend.model.PostTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for timeline hot window operations.
 * Enables index-only scans for O(1) feed queries.
 */
@Repository
public interface TimelineRepository extends JpaRepository<PostTimeline, Long> {

    /**
     * First page feed from timeline (index-only scan).
     * Uses 30-day bounded window to reduce index scan cost by ~60%.
     * Separate query to avoid null parameter type inference issues with Supabase/PgBouncer.
     */
    @Query(value = """
        SELECT t FROM PostTimeline t
        WHERE t.isDeleted = false
          AND t.createdAt > :thirtyDaysAgo
        ORDER BY t.createdAt DESC, t.postId DESC
        """)
    List<PostTimeline> findFeedFirstPage(
            @Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Cursor-paginated feed from timeline (index-only scan).
     * Uses keyset pagination for subsequent pages.
     */
    @Query(value = """
        SELECT t FROM PostTimeline t
        WHERE t.isDeleted = false
          AND (t.createdAt < :cursorCreatedAt
               OR (t.createdAt = :cursorCreatedAt AND t.postId < :cursorId))
        ORDER BY t.createdAt DESC, t.postId DESC
        """)
    List<PostTimeline> findFeedWithCursor(
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") UUID cursorId,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Find timeline entry by post ID.
     */
    Optional<PostTimeline> findByPostId(UUID postId);

    /**
     * Check if timeline has entries (for fallback detection).
     */
    @Query("SELECT COUNT(t) > 0 FROM PostTimeline t WHERE t.isDeleted = false")
    boolean hasTimelineEntries();

    /**
     * Count timeline entries.
     */
    long countByIsDeletedFalse();

    /**
     * Delete timeline entry by post ID.
     */
    @Modifying
    @Query("UPDATE PostTimeline t SET t.isDeleted = true WHERE t.postId = :postId")
    void softDeleteByPostId(@Param("postId") UUID postId);

    /**
     * Update like count for a post in timeline.
     */
    @Modifying
    @Query("UPDATE PostTimeline t SET t.likeCount = :count WHERE t.postId = :postId")
    void updateLikeCount(@Param("postId") UUID postId, @Param("count") int count);

    /**
     * Update share count for a post in timeline.
     */
    @Modifying
    @Query("UPDATE PostTimeline t SET t.shareCount = :count WHERE t.postId = :postId")
    void updateShareCount(@Param("postId") UUID postId, @Param("count") int count);

    /**
     * Prune timeline to hot window size (keep newest 1000).
     * Uses offset boundary strategy for better performance.
     * Called periodically (every 100 inserts) to maintain hot window.
     */
    @Modifying
    @Query(value = """
        WITH boundary AS (
            SELECT id FROM post_timelines_global
            WHERE is_deleted = false
            ORDER BY created_at DESC, post_id DESC
            OFFSET 1000
            LIMIT 1
        )
        DELETE FROM post_timelines_global
        WHERE id <= (SELECT id FROM boundary)
          AND is_deleted = false
        """, nativeQuery = true)
    void pruneToHotWindow();

    /**
     * Batch insert timeline entries (native query for performance).
     */
    @Modifying
    @Query(value = """
        INSERT INTO post_timelines_global 
            (post_id, created_at, author_id, author_name, author_avatar_url, 
             author_role, author_verified_host, text_content, homestay_id, 
             homestay_name, original_post_id, like_count, share_count, is_deleted)
        VALUES 
            (:postId, :createdAt, :authorId, :authorName, :authorAvatarUrl,
             :authorRole, :authorVerifiedHost, :textContent, :homestayId,
             :homestayName, :originalPostId, :likeCount, :shareCount, false)
        ON CONFLICT (post_id) DO UPDATE SET
            author_name = EXCLUDED.author_name,
            author_avatar_url = EXCLUDED.author_avatar_url,
            author_verified_host = EXCLUDED.author_verified_host,
            text_content = EXCLUDED.text_content,
            homestay_id = EXCLUDED.homestay_id,
            homestay_name = EXCLUDED.homestay_name,
            like_count = EXCLUDED.like_count,
            share_count = EXCLUDED.share_count,
            is_deleted = false
        """, nativeQuery = true)
    void upsertTimelineEntry(
            @Param("postId") UUID postId,
            @Param("createdAt") LocalDateTime createdAt,
            @Param("authorId") UUID authorId,
            @Param("authorName") String authorName,
            @Param("authorAvatarUrl") String authorAvatarUrl,
            @Param("authorRole") String authorRole,
            @Param("authorVerifiedHost") boolean authorVerifiedHost,
            @Param("textContent") String textContent,
            @Param("homestayId") UUID homestayId,
            @Param("homestayName") String homestayName,
            @Param("originalPostId") UUID originalPostId,
            @Param("likeCount") int likeCount,
            @Param("shareCount") int shareCount);

    /**
     * Delete timeline entries for multiple posts (for batch wipe).
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM post_timelines_global WHERE post_id IN :postIds", nativeQuery = true)
    int deleteByPostIdIn(@Param("postIds") List<UUID> postIds);
}
