package com.nbh.backend.repository;

import com.nbh.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    @Query("SELECT r FROM Review r WHERE r.homestay.id = :homestayId AND r.isDeleted = false")
    List<Review> findByHomestayId(@Param("homestayId") UUID homestayId);

    long countByUserId(UUID userId);

    /**
     * Hard delete ALL reviews, bypassing JPA.
     * reviews.homestay_id and reviews.user_id have NO ON DELETE CASCADE (V3 migration).
     * Must be called BEFORE deleting homestays or users to avoid FK constraint violations.
     *
     * @return Number of rows deleted
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM reviews", nativeQuery = true)
    int hardDeleteAll();
}
