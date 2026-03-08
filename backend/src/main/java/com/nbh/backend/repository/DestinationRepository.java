package com.nbh.backend.repository;

import com.nbh.backend.model.Destination;
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
            SELECT com.nbh.backend.dto.DestinationDto.builder()
                .id(d.id)
                .slug(d.slug)
                .name(d.name)
                .homestayCount(COUNT(h))
                .district(d.district)
                .heroTitle(d.heroTitle)
                .description(d.description)
                .localImageName(d.localImageName)
                .tags(d.tags)
                .stateName(s.name)
                .stateSlug(s.slug)
                .build()
            FROM Destination d
            LEFT JOIN d.state s
            LEFT JOIN Homestay h ON h.destination = d AND h.isDeleted = false
            GROUP BY d.id, d.slug, d.name, d.district, d.heroTitle, d.description, d.localImageName, d.tags, s.name, s.slug
            ORDER BY COUNT(h) DESC
            """)
    List<DestinationDto> fetchDestinationRankings();

    @Query("""
            SELECT com.nbh.backend.dto.DestinationDto.builder()
                .id(d.id)
                .slug(d.slug)
                .name(d.name)
                .homestayCount(COUNT(h))
                .district(d.district)
                .heroTitle(d.heroTitle)
                .description(d.description)
                .localImageName(d.localImageName)
                .tags(d.tags)
                .stateName(s.name)
                .stateSlug(s.slug)
                .build()
            FROM Destination d
            LEFT JOIN d.state s
            LEFT JOIN Homestay h ON h.destination = d AND h.isDeleted = false
            WHERE s.slug = :stateSlug
            GROUP BY d.id, d.slug, d.name, d.district, d.heroTitle, d.description, d.localImageName, d.tags, s.name, s.slug
            ORDER BY COUNT(h) DESC
            """)
    List<DestinationDto> fetchDestinationRankingsByStateSlug(@Param("stateSlug") String stateSlug);
}
