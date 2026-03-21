package com.nbh.backend.repository;

import com.nbh.backend.model.Post;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Optimized repository for community feed queries.
 * Uses native SQL queries with Object[] projections to avoid Hibernate lazy-loading traps.
 * Extends Repository<Post, UUID> for Spring Data proxy creation (no CRUD methods used).
 */
public interface FeedRepository extends Repository<Post, UUID> {

    /**
     * First page feed query - no cursor, returns post projections.
     * Separate query to avoid null parameter type inference issues with Supabase/PgBouncer.
     */
    @Query(value = """
        SELECT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.is_deleted = false
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit
        """,
        nativeQuery = true)
    List<Object[]> findFeedFirstPage(@Param("limit") int limit);

    /**
     * Cursor-based feed query - for subsequent pages with cursor.
     * Uses keyset pagination for O(1) performance.
     */
    @Query(value = """
        SELECT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.is_deleted = false
          AND (p.created_at < :cursorCreatedAt
               OR (p.created_at = :cursorCreatedAt AND p.id < :cursorId))
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit
        """,
        nativeQuery = true)
    List<Object[]> findFeedWithCursor(
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") UUID cursorId,
            @Param("limit") int limit);

    /**
     * First page feed query with tag filter - no cursor.
     * Separate query to avoid null parameter type inference issues with Supabase/PgBouncer.
     */
    @Query(value = """
        SELECT DISTINCT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        INNER JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.is_deleted = false
          AND pt.tag = :tag
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit
        """,
        nativeQuery = true)
    List<Object[]> findFeedByTagFirstPage(
            @Param("tag") String tag,
            @Param("limit") int limit);

    /**
     * Cursor-based feed query with tag filter - for subsequent pages with cursor.
     */
    @Query(value = """
        SELECT DISTINCT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        INNER JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.is_deleted = false
          AND pt.tag = :tag
          AND (p.created_at < :cursorCreatedAt
               OR (p.created_at = :cursorCreatedAt AND p.id < :cursorId))
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit
        """,
        nativeQuery = true)
    List<Object[]> findFeedByTagWithCursor(
            @Param("tag") String tag,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") UUID cursorId,
            @Param("limit") int limit);

    /**
     * Batch load media resources for multiple posts.
     * Includes width/height for layout engine aspect ratio decisions.
     * Note: width/height may be null if not yet populated - layout engine handles gracefully.
     */
    @Query(value = """
        SELECT m.post_id as postId, m.id as mediaId, m.url as url, m.file_id as fileId,
               m.width as width, m.height as height
        FROM media_resources m
        WHERE m.post_id IN :postIds
        ORDER BY m.post_id, m.id
        """,
        nativeQuery = true)
    List<Object[]> findMediaByPostIds(@Param("postIds") List<UUID> postIds);

    /**
     * Batch load tags for multiple posts.
     */
    @Query(value = """
        SELECT pt.post_id as postId, pt.tag as tag
        FROM post_tags pt
        WHERE pt.post_id IN :postIds
        ORDER BY pt.post_id, pt.tag
        """,
        nativeQuery = true)
    List<Object[]> findTagsByPostIds(@Param("postIds") List<UUID> postIds);

    /**
     * Batch load comment counts for multiple posts.
     */
    @Query(value = """
        SELECT c.post_id as postId, COUNT(*) as count
        FROM comments c
        WHERE c.post_id IN :postIds
          AND c.is_deleted = false
        GROUP BY c.post_id
        """,
        nativeQuery = true)
    List<Object[]> countCommentsByPostIds(@Param("postIds") List<UUID> postIds);

    /**
     * Batch load like counts for multiple posts.
     */
    @Query(value = """
        SELECT pl.post_id as postId, COUNT(*) as count
        FROM post_likes pl
        WHERE pl.post_id IN :postIds
        GROUP BY pl.post_id
        """,
        nativeQuery = true)
    List<Object[]> countLikesByPostIds(@Param("postIds") List<UUID> postIds);

    /**
     * Check which posts are liked by a specific user.
     */
    @Query(value = """
        SELECT pl.post_id as postId
        FROM post_likes pl
        WHERE pl.user_id = :userId AND pl.post_id IN :postIds
        """,
        nativeQuery = true)
    List<UUID> findLikedPostIds(@Param("userId") UUID userId, @Param("postIds") List<UUID> postIds);

    /**
     * Count total posts for tag filter (for hasMore calculation).
     */
    @Query(value = """
        SELECT COUNT(DISTINCT p.id)
        FROM posts p
        INNER JOIN post_tags pt ON p.id = pt.post_id
        WHERE p.is_deleted = false AND pt.tag = :tag
        """,
        nativeQuery = true)
    long countByTag(@Param("tag") String tag);

    /**
     * Count total posts (for hasMore calculation).
     */
    @Query(value = """
        SELECT COUNT(*)
        FROM posts p
        WHERE p.is_deleted = false
        """,
        nativeQuery = true)
    long countAllActive();

    @Query(value = """
        SELECT p.id as postId, p.destination_id as destinationId, p.post_type as postType,
               p.view_count as viewCount, p.is_editorial as isEditorial, p.is_featured as isFeatured,
               p.is_pinned as isPinned, p.is_trending as isTrending,
               p.trending_score as trendingScore, p.editorial_score as editorialScore
        FROM posts p
        WHERE p.id IN :postIds
        """, nativeQuery = true)
    List<Object[]> findPostMetaByIds(@Param("postIds") List<UUID> postIds);

    @Query(value = """
        SELECT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.is_deleted = false
          AND p.trending_score IS NOT NULL
        ORDER BY p.trending_score DESC, p.created_at DESC, p.id DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTrendingFirstPage(@Param("limit") int limit);

    @Query(value = """
        SELECT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.is_deleted = false
          AND (
                p.trending_score < :cursorTrendingScore
                OR (p.trending_score = :cursorTrendingScore AND p.created_at < :cursorCreatedAt)
                OR (p.trending_score = :cursorTrendingScore AND p.created_at = :cursorCreatedAt AND p.id < :cursorId)
              )
        ORDER BY p.trending_score DESC, p.created_at DESC, p.id DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTrendingWithCursor(
            @Param("cursorTrendingScore") double cursorTrendingScore,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") UUID cursorId,
            @Param("limit") int limit);

    @Query(value = """
        SELECT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        INNER JOIN user_follows uf ON uf.followed_user_id = p.user_id
        WHERE p.is_deleted = false
          AND uf.follower_user_id = :viewerUserId
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findFollowingFirstPage(@Param("viewerUserId") UUID viewerUserId, @Param("limit") int limit);

    @Query(value = """
        SELECT p.id as postId, p.text_content as textContent, p.created_at as createdAt,
               u.id as authorId,
               CONCAT(u.first_name, COALESCE(CONCAT(' ', u.last_name), '')) as authorName,
               u.avatar_url as authorAvatarUrl, u.role as authorRole, u.is_verified_host as authorVerifiedHost,
               p.love_count as likeCount, p.share_count as shareCount, p.comment_count as commentCount,
               h.id as homestayId, h.name as homestayName,
               p.original_post_id as originalPostId,
               op.text_content as originalContent,
               ou.id as originalAuthorId,
               CONCAT(ou.first_name, COALESCE(CONCAT(' ', ou.last_name), '')) as originalAuthorName,
               p.helpful_count as helpfulCount,
               p.last_computed_xp as lastComputedXp
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        LEFT JOIN homestays h ON p.homestay_id = h.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        INNER JOIN user_follows uf ON uf.followed_user_id = p.user_id
        WHERE p.is_deleted = false
          AND uf.follower_user_id = :viewerUserId
          AND (p.created_at < :cursorCreatedAt OR (p.created_at = :cursorCreatedAt AND p.id < :cursorId))
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findFollowingWithCursor(
            @Param("viewerUserId") UUID viewerUserId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") UUID cursorId,
            @Param("limit") int limit);
}
