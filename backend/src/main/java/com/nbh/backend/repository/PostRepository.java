package com.nbh.backend.repository;

import com.nbh.backend.model.Post;
import com.nbh.backend.repository.projection.PostListProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

        org.springframework.data.domain.Page<Post> findAll(org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByLocationNameContainingIgnoreCase(String locationName,
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByUser(com.nbh.backend.model.User user,
                        org.springframework.data.domain.Pageable pageable);

        long countByUser_IdAndIsDeletedFalse(UUID userId);

        @Query("SELECT DISTINCT p FROM Post p JOIN p.tags t WHERE t = :tag")
        org.springframework.data.domain.Page<Post> findByTag(@Param("tag") String tag,
                        org.springframework.data.domain.Pageable pageable);

        /**
         * Optimized projection query for posts list - single query with all needed data.
         * Avoids N+1 lazy loading of user, homestay, comments, media.
         */
        @Query(value = """
                SELECT p.id AS id,
                       p.location_name AS locationName,
                       p.text_content AS textContent,
                       p.created_at AS createdAt,
                       p.love_count AS loveCount,
                       p.share_count AS shareCount,
                       u.id AS authorId,
                       u.first_name AS authorFirstName,
                       u.last_name AS authorLastName,
                       u.avatar_url AS authorAvatarUrl,
                       u.role AS authorRole,
                       u.is_verified_host AS authorVerifiedHost,
                       h.id AS homestayId,
                       h.name AS homestayName,
                       p.destination_id AS destinationId,
                       p.post_type AS postType,
                       p.original_post_id AS originalPostId,
                       (SELECT COUNT(c.id) FROM comments c WHERE c.post_id = p.id) AS commentCount,
                       (SELECT COALESCE(json_agg(pt.tag), '[]'::json) FROM post_tags pt WHERE pt.post_id = p.id) AS tags,
                       p.view_count AS viewCount,
                       p.is_editorial AS isEditorial,
                       p.is_featured AS isFeatured,
                       p.is_pinned AS isPinned,
                       p.is_trending AS isTrending,
                       p.trending_score AS trendingScore,
                       p.editorial_score AS editorialScore
                FROM posts p
                INNER JOIN users u ON p.user_id = u.id
                LEFT JOIN homestays h ON p.homestay_id = h.id
                WHERE p.is_deleted = false
                ORDER BY p.created_at DESC
                """,
                countQuery = "SELECT COUNT(*) FROM posts WHERE is_deleted = false",
                nativeQuery = true)
        Page<Object[]> findAllPostProjections(Pageable pageable);

        /**
         * Optimized projection query for posts by tag - single query.
         */
        @Query(value = """
                SELECT p.id AS id,
                       p.location_name AS locationName,
                       p.text_content AS textContent,
                       p.created_at AS createdAt,
                       p.love_count AS loveCount,
                       p.share_count AS shareCount,
                       u.id AS authorId,
                       u.first_name AS authorFirstName,
                       u.last_name AS authorLastName,
                       u.avatar_url AS authorAvatarUrl,
                       u.role AS authorRole,
                       u.is_verified_host AS authorVerifiedHost,
                       h.id AS homestayId,
                       h.name AS homestayName,
                       p.destination_id AS destinationId,
                       p.post_type AS postType,
                       p.original_post_id AS originalPostId,
                       COUNT(DISTINCT c.id) AS commentCount,
                       COALESCE(json_agg(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), '[]'::json) AS tags,
                       p.view_count AS viewCount,
                       p.is_editorial AS isEditorial,
                       p.is_featured AS isFeatured,
                       p.is_pinned AS isPinned,
                       p.is_trending AS isTrending,
                       p.trending_score AS trendingScore,
                       p.editorial_score AS editorialScore
                FROM posts p
                INNER JOIN users u ON p.user_id = u.id
                LEFT JOIN homestays h ON p.homestay_id = h.id
                LEFT JOIN comments c ON p.id = c.post_id
                LEFT JOIN post_tags pt ON p.id = pt.post_id
                INNER JOIN post_tags pt_filter ON p.id = pt_filter.post_id AND pt_filter.tag = :tag
                WHERE p.is_deleted = false
                GROUP BY p.id, u.id, h.id
                """,
                countQuery = "SELECT COUNT(DISTINCT p.id) FROM posts p INNER JOIN post_tags pt ON p.id = pt.post_id WHERE pt.tag = :tag AND p.is_deleted = false",
                nativeQuery = true)
        Page<Object[]> findPostProjectionsByTag(@Param("tag") String tag, Pageable pageable);

        /**
         * Batch load media for multiple posts.
         */
        @Query(value = """
                SELECT m.post_id AS postId, m.id AS mediaId, m.url AS url, m.file_id AS fileId
                FROM media_resources m
                WHERE m.post_id IN :postIds
                ORDER BY m.post_id, m.id
                """,
                nativeQuery = true)
        List<Object[]> findMediaByPostIds(@Param("postIds") List<UUID> postIds);

        /**
         * Batch load liked status for a user across multiple posts.
         */
        @Query(value = """
                SELECT pl.post_id AS postId
                FROM post_likes pl
                WHERE pl.user_id = :userId AND pl.post_id IN :postIds
                """,
                nativeQuery = true)
        List<UUID> findLikedPostIds(@Param("userId") UUID userId, @Param("postIds") List<UUID> postIds);

        /**
         * Optimized projection query for posts search by location name.
         */
        @Query(value = """
                SELECT p.id AS id,
                       p.location_name AS locationName,
                       p.text_content AS textContent,
                       p.created_at AS createdAt,
                       p.love_count AS loveCount,
                       p.share_count AS shareCount,
                       u.id AS authorId,
                       u.first_name AS authorFirstName,
                       u.last_name AS authorLastName,
                       u.avatar_url AS authorAvatarUrl,
                       u.role AS authorRole,
                       u.is_verified_host AS authorVerifiedHost,
                       h.id AS homestayId,
                       h.name AS homestayName,
                       p.destination_id AS destinationId,
                       p.post_type AS postType,
                       p.original_post_id AS originalPostId,
                       (SELECT COUNT(c.id) FROM comments c WHERE c.post_id = p.id) AS commentCount,
                       (SELECT COALESCE(json_agg(pt.tag), '[]'::json) FROM post_tags pt WHERE pt.post_id = p.id) AS tags,
                       p.view_count AS viewCount,
                       p.is_editorial AS isEditorial,
                       p.is_featured AS isFeatured,
                       p.is_pinned AS isPinned,
                       p.is_trending AS isTrending,
                       p.trending_score AS trendingScore,
                       p.editorial_score AS editorialScore
                FROM posts p
                INNER JOIN users u ON p.user_id = u.id
                LEFT JOIN homestays h ON p.homestay_id = h.id
                WHERE p.is_deleted = false AND LOWER(p.location_name) LIKE LOWER(CONCAT('%', :query, '%'))
                ORDER BY p.created_at DESC
                """,
                countQuery = "SELECT COUNT(*) FROM posts WHERE is_deleted = false AND LOWER(location_name) LIKE LOWER(CONCAT('%', :query, '%'))",
                nativeQuery = true)
        Page<Object[]> searchPostProjections(@Param("query") String query, Pageable pageable);

        /**
         * Optimized projection query for posts by user ID.
         */
        @Query(value = """
                SELECT p.id AS id,
                       p.location_name AS locationName,
                       p.text_content AS textContent,
                       p.created_at AS createdAt,
                       p.love_count AS loveCount,
                       p.share_count AS shareCount,
                       u.id AS authorId,
                       u.first_name AS authorFirstName,
                       u.last_name AS authorLastName,
                       u.avatar_url AS authorAvatarUrl,
                       u.role AS authorRole,
                       u.is_verified_host AS authorVerifiedHost,
                       h.id AS homestayId,
                       h.name AS homestayName,
                       p.destination_id AS destinationId,
                       p.post_type AS postType,
                       p.original_post_id AS originalPostId,
                       (SELECT COUNT(c.id) FROM comments c WHERE c.post_id = p.id) AS commentCount,
                       (SELECT COALESCE(json_agg(pt.tag), '[]'::json) FROM post_tags pt WHERE pt.post_id = p.id) AS tags,
                       p.view_count AS viewCount,
                       p.is_editorial AS isEditorial,
                       p.is_featured AS isFeatured,
                       p.is_pinned AS isPinned,
                       p.is_trending AS isTrending,
                       p.trending_score AS trendingScore,
                       p.editorial_score AS editorialScore
                FROM posts p
                INNER JOIN users u ON p.user_id = u.id
                LEFT JOIN homestays h ON p.homestay_id = h.id
                WHERE p.is_deleted = false AND p.user_id = :userId
                ORDER BY p.created_at DESC
                """,
                countQuery = "SELECT COUNT(*) FROM posts WHERE is_deleted = false AND user_id = :userId",
                nativeQuery = true)
        Page<Object[]> findPostProjectionsByUserId(@Param("userId") UUID userId, Pageable pageable);

        /**
         * Find posts that don't have timeline entries.
         * Used for backfilling the timeline table.
         */
        @Query("""
                SELECT p FROM Post p
                LEFT JOIN PostTimeline t ON t.postId = p.id
                WHERE p.isDeleted = false AND t.postId IS NULL
                ORDER BY p.createdAt DESC
                """)
        List<Post> findPostsNotInTimeline();

        @Transactional
        @Modifying
        @Query(value = "UPDATE posts SET love_count = love_count + 1 WHERE id = :postId", nativeQuery = true)
        int incrementLoveCount(@Param("postId") UUID postId);

        @Transactional
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "UPDATE posts SET love_count = GREATEST(love_count - 1, 0) WHERE id = :postId", nativeQuery = true)
        int decrementLoveCount(@Param("postId") UUID postId);

        @Transactional
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "UPDATE posts SET comment_count = comment_count + 1 WHERE id = :postId", nativeQuery = true)
        int incrementCommentCount(@Param("postId") UUID postId);

        @Transactional
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = :postId", nativeQuery = true)
        int decrementCommentCount(@Param("postId") UUID postId);

        @Transactional
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "UPDATE posts SET share_count = COALESCE(share_count, 0) + 1 WHERE id = :postId", nativeQuery = true)
        int incrementShareCount(@Param("postId") UUID postId);

        @Transactional
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "UPDATE posts SET trending_score = :score, trending_computed_at = :now, is_trending = :isTrending WHERE id = :postId", nativeQuery = true)
        int updateTrendingData(@Param("postId") UUID postId, @Param("score") double score, @Param("now") java.time.Instant now, @Param("isTrending") boolean isTrending);

        @Transactional
        @Modifying
        @Query(value = "UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = :postId", nativeQuery = true)
        int incrementViewCount(@Param("postId") UUID postId);

        @Transactional
        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query(value = "UPDATE posts SET last_computed_xp = :xp WHERE id = :postId", nativeQuery = true)
        int updateLastComputedXp(@Param("postId") UUID postId, @Param("xp") int xp);

        @Query(value = "SELECT COUNT(*) FROM comments WHERE post_id = :postId", nativeQuery = true)
        int countCommentsByPostId(@Param("postId") UUID postId);

        @Query(value = "SELECT love_count FROM posts WHERE id = :postId", nativeQuery = true)
        Integer findLoveCountById(@Param("postId") UUID postId);

        // ── Deep Wipe Methods ────────────────────────────────────────
        /**
         * Find all posts including soft-deleted ones.
         * Bypasses @SQLRestriction for wipe operation.
         */
        @Query(value = "SELECT * FROM posts", nativeQuery = true)
        List<Post> findAllIncludingDeleted();

        /**
         * Find a limited batch of posts including soft-deleted ones.
         * Bypasses @SQLRestriction for batch wipe operation.
         * Uses ORDER BY for consistent results across batches.
         */
        @Query(value = "SELECT * FROM posts ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
        List<Post> findAllIncludingDeletedWithLimit(@Param("limit") int limit);

        /**
         * Count all posts including soft-deleted ones.
         * Bypasses @SQLRestriction for batch wipe operation.
         */
        @Query(value = "SELECT COUNT(*) FROM posts", nativeQuery = true)
        long countIncludingDeleted();

        /**
         * Hard delete posts by IDs, bypassing soft delete.
         * Used for batch wipe operation.
         * 
         * @param postIds List of post IDs to delete
         * @return Number of rows deleted
         */
        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query(value = "DELETE FROM posts WHERE id IN :postIds", nativeQuery = true)
        int hardDeleteByIdIn(@Param("postIds") java.util.List<UUID> postIds);

        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query(value = "UPDATE posts SET homestay_id = NULL WHERE homestay_id IN :homestayIds", nativeQuery = true)
        int clearHomestayReferences(@Param("homestayIds") List<UUID> homestayIds);

        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query(value = "UPDATE posts SET homestay_id = NULL WHERE homestay_id IS NOT NULL", nativeQuery = true)
        int clearAllHomestayReferences();

        /**
         * Hard delete all posts, bypassing soft delete.
         * Returns count of deleted rows.
         */
        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query(value = "DELETE FROM posts", nativeQuery = true)
        int hardDeleteAll();
}
