package com.nbh.backend.repository;

import com.nbh.backend.model.Destination;
import com.nbh.backend.dto.DestinationCardDto;
import com.nbh.backend.dto.DestinationDto;
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
