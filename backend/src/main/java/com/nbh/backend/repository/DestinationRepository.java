package com.nbh.backend.repository;

import com.nbh.backend.model.Destination;
import com.nbh.backend.dto.DestinationCardDto;
import com.nbh.backend.dto.DestinationDto;
import com.nbh.backend.repository.projection.DestinationCardProjection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing destinations.
 */
@Repository
public interface DestinationRepository extends JpaRepository<Destination, UUID> {

    /**
     * Finds all destinations with their associated state and tags.
     *
     * @return A list of destinations.
     */
    @Override
    @EntityGraph(attributePaths = { "state", "tags" })
    List<Destination> findAll();

    @EntityGraph(attributePaths = { "state", "tags" })
    Optional<Destination> findBySlug(String slug);

    @EntityGraph(attributePaths = { "state", "tags" })
    List<Destination> findByStateSlug(String stateSlug);

    /**
     * Optimized projection query for destination cards with homestay count.
     * Single query avoids N+1 lazy loading issues.
     * Uses subquery for tags to avoid implicit join creating duplicate rows.
     */
    @Query("""
            SELECT d.id AS id,
                   d.slug AS slug,
                   d.name AS name,
                   d.localImageName AS localImageName,
                   (SELECT COUNT(h) FROM Homestay h WHERE h.destination = d AND h.isDeleted = false) AS homestayCount,
                   s.name AS stateName,
                   s.slug AS stateSlug,
                   (SELECT dt.tag FROM DestinationTag dt WHERE dt.destination.id = d.id) AS tags
            FROM Destination d
            LEFT JOIN d.state s
            ORDER BY homestayCount DESC
            """)
    List<DestinationCardProjection> fetchDestinationCardProjections();

    /**
     * Optimized projection query for destination cards by state slug.
     * Single query avoids N+1 lazy loading issues.
     * Uses subquery for tags to avoid implicit join creating duplicate rows.
     */
    @Query("""
            SELECT d.id AS id,
                   d.slug AS slug,
                   d.name AS name,
                   d.localImageName AS localImageName,
                   (SELECT COUNT(h) FROM Homestay h WHERE h.destination = d AND h.isDeleted = false) AS homestayCount,
                   s.name AS stateName,
                   s.slug AS stateSlug,
                   (SELECT dt.tag FROM DestinationTag dt WHERE dt.destination.id = d.id) AS tags
            FROM Destination d
            LEFT JOIN d.state s
            WHERE s.slug = :stateSlug
            ORDER BY homestayCount DESC
            """)
    List<DestinationCardProjection> fetchDestinationCardProjectionsByStateSlug(@Param("stateSlug") String stateSlug);

    @Query("""
            SELECT d
            FROM Destination d
            LEFT JOIN FETCH d.state
            LEFT JOIN FETCH d.tags
            ORDER BY (
                SELECT COUNT(h)
                FROM Homestay h
                WHERE h.destination = d AND h.isDeleted = false
            ) DESC
            """)
    List<Destination> fetchDestinationRankings();

    @Query("""
            SELECT d
            FROM Destination d
            LEFT JOIN FETCH d.state s
            LEFT JOIN FETCH d.tags
            WHERE s.slug = :stateSlug
            ORDER BY (
                SELECT COUNT(h)
                FROM Homestay h
                WHERE h.destination = d AND h.isDeleted = false
            ) DESC
            """)
    List<Destination> fetchDestinationRankingsByStateSlug(@Param("stateSlug") String stateSlug);

    @Query("""
            SELECT COUNT(h)
            FROM Homestay h
            WHERE h.destination.slug = :slug AND h.isDeleted = false
            """)
    Long countHomestaysByDestinationSlug(@Param("slug") String slug);
}
