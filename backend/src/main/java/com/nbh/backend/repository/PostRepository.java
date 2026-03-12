package com.nbh.backend.repository;

import com.nbh.backend.model.Post;
import com.nbh.backend.repository.projection.PostListProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

        org.springframework.data.domain.Page<Post> findAll(org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByLocationNameContainingIgnoreCase(String locationName,
                        org.springframework.data.domain.Pageable pageable);

        org.springframework.data.domain.Page<Post> findByUser(com.nbh.backend.model.User user,
                        org.springframework.data.domain.Pageable pageable);

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
                       p.original_post_id AS originalPostId,
                       (SELECT COUNT(c.id) FROM comments c WHERE c.post_id = p.id) AS commentCount,
                       (SELECT COALESCE(json_agg(pt.tag), '[]'::json) FROM post_tags pt WHERE pt.post_id = p.id) AS tags
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
                SELECT DISTINCT p.id AS id,
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
                       p.original_post_id AS originalPostId,
                       (SELECT COUNT(c.id) FROM comments c WHERE c.post_id = p.id) AS commentCount,
                       (SELECT COALESCE(json_agg(pt.tag), '[]'::json) FROM post_tags pt WHERE pt.post_id = p.id) AS tags
                FROM posts p
                INNER JOIN users u ON p.user_id = u.id
                LEFT JOIN homestays h ON p.homestay_id = h.id
                INNER JOIN post_tags pt_filter ON p.id = pt_filter.post_id AND pt_filter.tag = :tag
                WHERE p.is_deleted = false
                ORDER BY p.created_at DESC
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
}
