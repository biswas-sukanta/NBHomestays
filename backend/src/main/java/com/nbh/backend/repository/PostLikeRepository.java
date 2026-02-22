package com.nbh.backend.repository;

import com.nbh.backend.model.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLike.PostLikePk> {

    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    long countByPostId(UUID postId);

    void deleteByUserIdAndPostId(UUID userId, UUID postId);

    @Query("SELECT pl.postId FROM PostLike pl WHERE pl.userId = :userId")
    java.util.List<UUID> findLikedPostIdsByUserId(@Param("userId") UUID userId);
}
