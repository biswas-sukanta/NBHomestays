package com.nbh.backend.repository;

import com.nbh.backend.model.UserXpPostHelpful;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserXpPostHelpfulRepository extends JpaRepository<UserXpPostHelpful, UUID> {

    List<UserXpPostHelpful> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT COUNT(x) FROM UserXpPostHelpful x WHERE x.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);
}
