package com.nbh.backend.repository;

import com.nbh.backend.model.State;
import com.nbh.backend.repository.projection.StateSummaryProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface StateRepository extends JpaRepository<State, UUID> {

    Optional<State> findBySlug(String slug);

    @Query("SELECT COUNT(d) FROM Destination d WHERE d.state.id = :stateId")
    long countDestinationsByStateId(@Param("stateId") UUID stateId);

    @Query("SELECT COUNT(h) FROM Homestay h WHERE h.destination.state.id = :stateId AND h.isDeleted = false")
    long countHomestaysByStateId(@Param("stateId") UUID stateId);

    @Query("""
            SELECT s.id AS id,
                   s.slug AS slug,
                   s.name AS name,
                   s.description AS description,
                   s.heroImageName AS heroImageName,
                   COUNT(DISTINCT d.id) AS destinationCount,
                   COUNT(DISTINCT h.id) AS homestayCount
            FROM State s
            LEFT JOIN s.destinations d
            LEFT JOIN Homestay h ON h.destination = d AND h.isDeleted = false
            GROUP BY s.id, s.slug, s.name, s.description, s.heroImageName
            ORDER BY homestayCount DESC, destinationCount DESC
            """)
    List<StateSummaryProjection> fetchStateSummaries();
}
