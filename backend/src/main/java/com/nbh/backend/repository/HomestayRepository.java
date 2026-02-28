package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HomestayRepository extends JpaRepository<Homestay, UUID>, HomestayRepositoryCustom {

        org.springframework.data.domain.Page<Homestay> findByStatus(Homestay.Status status,
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
}
