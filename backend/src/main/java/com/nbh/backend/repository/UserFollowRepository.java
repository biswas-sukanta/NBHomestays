package com.nbh.backend.repository;

import com.nbh.backend.model.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UserFollow.UserFollowPk> {
    long countByFollowerUserId(UUID followerUserId);
    long countByFollowedUserId(UUID followedUserId);
    long deleteByFollowerUserIdAndFollowedUserId(UUID followerUserId, UUID followedUserId);

    @Query(value = """
            SELECT EXISTS (
                SELECT 1
                FROM user_follows
                WHERE follower_user_id = :followerUserId
                  AND followed_user_id = :followedUserId
            )
            """, nativeQuery = true)
    boolean isFollowing(@Param("followerUserId") UUID followerUserId, @Param("followedUserId") UUID followedUserId);
}
