package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

@Repository
public interface HomestayRepository extends JpaRepository<Homestay, UUID>, HomestayRepositoryCustom {

        org.springframework.data.domain.Page<Homestay> findByStatus(Homestay.Status status,
                        org.springframework.data.domain.Pageable pageable);

        @org.springframework.data.jpa.repository.Query("SELECT h FROM Homestay h LEFT JOIN FETCH h.mediaFiles WHERE h.destination.slug = :slug AND h.isDeleted = false")
        org.springframework.data.domain.Page<Homestay> findByDestinationSlug(
                        @org.springframework.data.repository.query.Param("slug") String slug,
                        org.springframework.data.domain.Pageable pageable);

        @org.springframework.data.jpa.repository.Query("SELECT h FROM Homestay h WHERE h.status = :status AND h.isDeleted = false")
        List<Homestay> findByStatus(@org.springframework.data.repository.query.Param("status") Homestay.Status status);

        long countByStatus(Homestay.Status status);

        long countByFeaturedTrue();

        org.springframework.data.domain.Page<Homestay> findByOwner(com.nbh.backend.model.User owner,
                        org.springframework.data.domain.Pageable pageable);

        @org.springframework.data.jpa.repository.Query("SELECT h FROM Homestay h LEFT JOIN FETCH h.owner LEFT JOIN FETCH h.mediaFiles WHERE h.id = :id AND h.isDeleted = false")
        java.util.Optional<Homestay> findByIdWithDetails(
                        @org.springframework.data.repository.query.Param("id") UUID id);

        @Modifying
        @Query(value = "UPDATE homestays SET view_count = COALESCE(view_count, 0) + 1 WHERE id = :id", nativeQuery = true)
        int incrementViewCount(@Param("id") UUID id);

        @Modifying
        @Query(value = "UPDATE homestays SET inquiry_count = COALESCE(inquiry_count, 0) + 1 WHERE id = :id", nativeQuery = true)
        int incrementInquiryCount(@Param("id") UUID id);

        /**
         * Hard delete ALL homestays, bypassing @SQLDelete (soft-delete).
         * Must be called AFTER media_resources and reviews are deleted (no CASCADE on those FKs).
         * Used during seeder purge to prevent soft-deleted row accumulation.
         *
         * @return Number of rows deleted
         */
        @Modifying(flushAutomatically = true, clearAutomatically = true)
        @Query(value = "DELETE FROM homestays", nativeQuery = true)
        int hardDeleteAll();
}

