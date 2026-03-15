package com.nbh.backend.repository;

import com.nbh.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    /**
     * Find all users ordered by total XP descending for leaderboard.
     */
    Page<User> findAllByOrderByTotalXpDesc(Pageable pageable);

    @Query(value = """
            SELECT u.id AS id,
                   u.first_name AS firstName,
                   u.last_name AS lastName,
                   u.email AS email,
                   u.avatar_url AS avatarUrl,
                   u.role AS role,
                   u.is_verified_host AS verifiedHost
            FROM users u
            WHERE u.id IN :userIds
            """, nativeQuery = true)
    List<SocialAuthorProjection> findSocialAuthorsByIds(@Param("userIds") List<UUID> userIds);

    interface SocialAuthorProjection {
        UUID getId();
        String getFirstName();
        String getLastName();
        String getEmail();
        String getAvatarUrl();
        String getRole();
        Boolean getVerifiedHost();
    }

    /**
     * Find top contributors by post count.
     * Returns users with most posts in the system.
     */
    @Query(value = """
            SELECT u.id AS id,
                   u.first_name AS firstName,
                   u.last_name AS lastName,
                   u.email AS email,
                   u.avatar_url AS avatarUrl,
                   u.role AS role,
                   u.is_verified_host AS verifiedHost,
                   COUNT(p.id) AS postCount
            FROM users u
            INNER JOIN posts p ON p.user_id = u.id AND p.is_deleted = false
            GROUP BY u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.role, u.is_verified_host
            ORDER BY COUNT(p.id) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<TopContributorProjection> findTopContributors(@Param("limit") int limit);

    interface TopContributorProjection {
        UUID getId();
        String getFirstName();
        String getLastName();
        String getEmail();
        String getAvatarUrl();
        String getRole();
        Boolean getVerifiedHost();
        Long getPostCount();
    }
}
