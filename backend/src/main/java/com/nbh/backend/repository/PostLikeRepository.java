package com.nbh.backend.repository;

import com.nbh.backend.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikePk> {

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    long countByPostId(UUID postId);

    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    void deleteByPostId(UUID postId);

    @Modifying
    @Query(value = "INSERT INTO post_likes (post_id, user_id, liked_at) VALUES (:postId, :userId, NOW()) ON CONFLICT (post_id, user_id) DO NOTHING", nativeQuery = true)
    int insertLikeIgnoreConflict(@Param("postId") UUID postId, @Param("userId") UUID userId);

    @Query("SELECT pl.postId FROM PostLike pl WHERE pl.userId = :userId")
    java.util.List<UUID> findLikedPostIdsByUserId(@Param("userId") UUID userId);

    // ── Deep Wipe Method ────────────────────────────────────────
    /**
     * Delete all post_likes and return the count.
     */
    @Modifying
    @Query(value = "DELETE FROM post_likes", nativeQuery = true)
    long deleteAllAndGetCount();

    /**
     * Delete likes for multiple posts by post IDs.
     */
    @Modifying
    @Query(value = "DELETE FROM post_likes WHERE post_id IN :postIds", nativeQuery = true)
    void deleteByPostIdIn(@Param("postIds") java.util.List<UUID> postIds);
}
