package com.nbh.backend.repository;

import com.nbh.backend.model.User;
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

    boolean existsByEmail(String email);

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
}
