package com.nbh.backend.repository;

import com.nbh.backend.dto.SearchCardDto;
import com.nbh.backend.model.Homestay;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class HomestayRepositoryImpl implements HomestayRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private Environment environment;

    private boolean isH2Database() {
        String url = environment.getProperty("spring.datasource.url", "");
        return url.toLowerCase().contains("jdbc:h2");
    }

    @Override
    public Page<Homestay> search(String searchQuery, Map<String, Boolean> amenities, String tag, String stateSlug,
            Boolean isFeatured,
            Double minLat, Double maxLat, Double minLng, Double maxLng,
            Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "SELECT h.id FROM homestays h ");
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(h.id) FROM homestays h ");

        // Add JOINs if stateSlug is provided
        if (stateSlug != null && !stateSlug.isBlank()) {
            sql.append("JOIN destinations d ON h.destination_id = d.id JOIN states s ON d.state_id = s.id ");
            countSql.append("JOIN destinations d ON h.destination_id = d.id JOIN states s ON d.state_id = s.id ");
        }

        sql.append("WHERE h.is_deleted = false AND h.status = 'APPROVED' ");
        countSql.append("WHERE h.is_deleted = false AND h.status = 'APPROVED' ");

        StringBuilder conditions = new StringBuilder();

        if (Boolean.TRUE.equals(isFeatured)) {
            conditions.append("AND h.featured = true ");
        } else if (Boolean.FALSE.equals(isFeatured)) {
            conditions.append("AND (h.featured = false OR h.featured IS NULL) ");
        }

        boolean isH2 = isH2Database();

        // Full Text Search or Fallback
        if (searchQuery != null && !searchQuery.isBlank()) {
            if (isH2) {
                // H2 Fallback: Standard SQL LIKE
                conditions.append(
                        "AND (LOWER(COALESCE(h.name, '')) LIKE LOWER(:queryLike) OR LOWER(COALESCE(h.description, '')) LIKE LOWER(:queryLike) OR LOWER(COALESCE(h.address, '')) LIKE LOWER(:queryLike)) ");
            } else {
                // PostgreSQL Full Text Search
                conditions.append(
                        "AND (to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')) @@ plainto_tsquery('english', :query)) ");
            }
        }

        // JSONB Filters
        if (amenities != null && !amenities.isEmpty()) {
            for (String key : amenities.keySet()) {
                if (Boolean.TRUE.equals(amenities.get(key))) {
                    if (isH2) {
                        conditions.append("AND CAST(h.amenities AS VARCHAR) LIKE '%\"").append(key)
                                .append("\": true%' ");
                    } else {
                        conditions.append("AND h.amenities ->> '").append(key).append("' = 'true' ");
                    }
                }
            }
        }

        // Tag Filter
        if (tag != null && !tag.isBlank()) {
            if (isH2) {
                conditions.append(
                        "AND (CAST(h.tags AS VARCHAR) LIKE :tagLike OR LOWER(h.address) LIKE LOWER(:tagLike)) ");
            } else {
                conditions.append(
                        "AND (h.tags @> CAST(:tagJson AS jsonb) OR LOWER(h.address) LIKE LOWER(:tagLike)) ");
            }
        }

        // Bounding Box
        if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
            conditions.append("AND h.latitude BETWEEN :minLat AND :maxLat ")
                    .append("AND h.longitude BETWEEN :minLng AND :maxLng ");
        }

        // State Slug Filter
        if (stateSlug != null && !stateSlug.isBlank()) {
            conditions.append("AND s.slug = :stateSlug ");
        }

        sql.append(conditions);
        countSql.append(conditions);

        // Ranking
        if (searchQuery != null && !searchQuery.isBlank()) {
            if (isH2) {
                sql.append("ORDER BY COALESCE(h.vibe_score, 0) DESC ");
            } else {
                sql.append(
                        "ORDER BY (ts_rank(to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')), plainto_tsquery('english', :query)) * 0.4 + COALESCE(h.vibe_score, 0) * 0.4) DESC ");
            }
        } else {
            sql.append("ORDER BY COALESCE(h.vibe_score, 0) DESC ");
        }

        // Pagination
        sql.append("LIMIT :limit OFFSET :offset");

        Query nativeQuery = entityManager.createNativeQuery(sql.toString());
        Query nativeCountQuery = entityManager.createNativeQuery(countSql.toString());

        if (searchQuery != null && !searchQuery.isBlank()) {
            if (isH2) {
                String queryLike = "%" + searchQuery + "%";
                nativeQuery.setParameter("queryLike", queryLike);
                nativeCountQuery.setParameter("queryLike", queryLike);
            } else {
                nativeQuery.setParameter("query", searchQuery);
                nativeCountQuery.setParameter("query", searchQuery);
            }
        }

        if (tag != null && !tag.isBlank()) {
            String tagLike = "%" + tag + "%";
            if (isH2) {
                nativeQuery.setParameter("tagLike", tagLike);
                nativeCountQuery.setParameter("tagLike", tagLike);
            } else {
                String tagJson = "[\"" + tag.replace("\"", "\\\"") + "\"]";
                nativeQuery.setParameter("tagJson", tagJson);
                nativeQuery.setParameter("tagLike", tagLike);
                nativeCountQuery.setParameter("tagJson", tagJson);
                nativeCountQuery.setParameter("tagLike", tagLike);
            }
        }

        if (stateSlug != null && !stateSlug.isBlank()) {
            nativeQuery.setParameter("stateSlug", stateSlug);
            nativeCountQuery.setParameter("stateSlug", stateSlug);
        }

        if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
            nativeQuery.setParameter("minLat", minLat);
            nativeQuery.setParameter("maxLat", maxLat);
            nativeQuery.setParameter("minLng", minLng);
            nativeQuery.setParameter("maxLng", maxLng);
            nativeCountQuery.setParameter("minLat", minLat);
            nativeCountQuery.setParameter("maxLat", maxLat);
            nativeCountQuery.setParameter("minLng", minLng);
            nativeCountQuery.setParameter("maxLng", maxLng);
        }

        nativeQuery.setParameter("limit", pageable.getPageSize());
        nativeQuery.setParameter("offset", pageable.getOffset());

        @SuppressWarnings("unchecked")
        List<Object> rawIds = nativeQuery.getResultList();
        List<UUID> ids = rawIds.stream()
                .map(this::toUUID)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        long total = ((Number) nativeCountQuery.getSingleResult()).longValue();

        if (ids.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, total);
        }

        // N+1 Fix: Fetch entities with JOIN FETCH
        List<Homestay> unsorted = entityManager.createQuery(
                "SELECT DISTINCT h FROM Homestay h " +
                        "LEFT JOIN FETCH h.owner " +
                        "LEFT JOIN FETCH h.mediaFiles " +
                        "LEFT JOIN FETCH h.destination d " +
                        "LEFT JOIN FETCH d.state " +
                        "WHERE h.id IN :ids",
                Homestay.class).setParameter("ids", ids).getResultList();

        // Sort based on the order of the initially ranked native 'ids'
        Map<UUID, Homestay> homestayMap = unsorted.stream()
                .collect(Collectors.toMap(Homestay::getId, h -> h));
        List<Homestay> result = ids.stream()
                .map(homestayMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return new PageImpl<>(result, pageable, total);
    }

    @Override
    public Page<SearchCardDto> searchCards(String searchQuery, Map<String, Boolean> amenities, String tag, String stateSlug,
            Boolean isFeatured,
            Double minLat, Double maxLat, Double minLng, Double maxLng,
            Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "SELECT h.id, h.name, h.description, h.price_per_night, h.latitude, h.longitude, h.address, " +
                        "h.vibe_score, h.avg_atmosphere_rating, h.avg_service_rating, h.avg_accuracy_rating, h.avg_value_rating, h.total_reviews, " +
                        "h.status, h.owner_id, h.featured, " +
                        "d.id AS destination_id, d.slug AS destination_slug, d.name AS destination_name, d.district, d.hero_title, d.description AS destination_description, d.local_image_name, " +
                        "s.name AS state_name, s.slug AS state_slug, " +
                        "u.id AS host_id, u.first_name, u.last_name, u.role, u.avatar_url, u.is_verified_host, " +
                        "(SELECT mr.url FROM media_resources mr WHERE mr.homestay_id = h.id ORDER BY mr.id ASC LIMIT 1) AS cover_image_url " +
                        "FROM homestays h " +
                        "LEFT JOIN destinations d ON h.destination_id = d.id " +
                        "LEFT JOIN states s ON d.state_id = s.id " +
                        "LEFT JOIN users u ON h.owner_id = u.id ");
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(h.id) FROM homestays h " +
                        "LEFT JOIN destinations d ON h.destination_id = d.id " +
                        "LEFT JOIN states s ON d.state_id = s.id ");

        sql.append("WHERE h.is_deleted = false AND h.status = 'APPROVED' ");
        countSql.append("WHERE h.is_deleted = false AND h.status = 'APPROVED' ");

        StringBuilder conditions = new StringBuilder();
        boolean isH2 = isH2Database();

        if (Boolean.TRUE.equals(isFeatured)) {
            conditions.append("AND h.featured = true ");
        } else if (Boolean.FALSE.equals(isFeatured)) {
            conditions.append("AND (h.featured = false OR h.featured IS NULL) ");
        }

        if (searchQuery != null && !searchQuery.isBlank()) {
            if (isH2) {
                conditions.append(
                        "AND (LOWER(COALESCE(h.name, '')) LIKE LOWER(:queryLike) OR LOWER(COALESCE(h.description, '')) LIKE LOWER(:queryLike) OR LOWER(COALESCE(h.address, '')) LIKE LOWER(:queryLike)) ");
            } else {
                conditions.append(
                        "AND (to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')) @@ plainto_tsquery('english', :query)) ");
            }
        }

        if (amenities != null && !amenities.isEmpty()) {
            for (String key : amenities.keySet()) {
                if (Boolean.TRUE.equals(amenities.get(key))) {
                    if (isH2) {
                        conditions.append("AND CAST(h.amenities AS VARCHAR) LIKE '%\"").append(key)
                                .append("\": true%' ");
                    } else {
                        conditions.append("AND h.amenities ->> '").append(key).append("' = 'true' ");
                    }
                }
            }
        }

        if (tag != null && !tag.isBlank()) {
            if (isH2) {
                conditions.append("AND (CAST(h.tags AS VARCHAR) LIKE :tagLike OR LOWER(h.address) LIKE LOWER(:tagLike)) ");
            } else {
                conditions.append("AND (h.tags @> CAST(:tagJson AS jsonb) OR LOWER(h.address) LIKE LOWER(:tagLike)) ");
            }
        }

        if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
            conditions.append("AND h.latitude BETWEEN :minLat AND :maxLat ")
                    .append("AND h.longitude BETWEEN :minLng AND :maxLng ");
        }

        if (stateSlug != null && !stateSlug.isBlank()) {
            conditions.append("AND s.slug = :stateSlug ");
        }

        sql.append(conditions);
        countSql.append(conditions);

        if (searchQuery != null && !searchQuery.isBlank()) {
            if (isH2) {
                sql.append("ORDER BY COALESCE(h.vibe_score, 0) DESC ");
            } else {
                sql.append(
                        "ORDER BY (ts_rank(to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')), plainto_tsquery('english', :query)) * 0.4 + COALESCE(h.vibe_score, 0) * 0.4) DESC ");
            }
        } else {
            sql.append("ORDER BY COALESCE(h.vibe_score, 0) DESC ");
        }
        sql.append("LIMIT :limit OFFSET :offset");

        Query nativeQuery = entityManager.createNativeQuery(sql.toString());
        Query nativeCountQuery = entityManager.createNativeQuery(countSql.toString());

        bindSearchParameters(nativeQuery, nativeCountQuery, searchQuery, tag, stateSlug, minLat, maxLat, minLng, maxLng, isH2);

        nativeQuery.setParameter("limit", pageable.getPageSize());
        nativeQuery.setParameter("offset", pageable.getOffset());

        @SuppressWarnings("unchecked")
        List<Object[]> rows = nativeQuery.getResultList();
        long total = ((Number) nativeCountQuery.getSingleResult()).longValue();

        List<SearchCardDto> cards = rows.stream()
                .map(this::mapRowToSearchCard)
                .toList();

        return new PageImpl<>(cards, pageable, total);
    }

    private void bindSearchParameters(Query nativeQuery, Query nativeCountQuery, String searchQuery, String tag,
            String stateSlug, Double minLat, Double maxLat, Double minLng, Double maxLng, boolean isH2) {
        if (searchQuery != null && !searchQuery.isBlank()) {
            if (isH2) {
                String queryLike = "%" + searchQuery + "%";
                nativeQuery.setParameter("queryLike", queryLike);
                nativeCountQuery.setParameter("queryLike", queryLike);
            } else {
                nativeQuery.setParameter("query", searchQuery);
                nativeCountQuery.setParameter("query", searchQuery);
            }
        }

        if (tag != null && !tag.isBlank()) {
            String tagLike = "%" + tag + "%";
            if (isH2) {
                nativeQuery.setParameter("tagLike", tagLike);
                nativeCountQuery.setParameter("tagLike", tagLike);
            } else {
                String tagJson = "[\"" + tag.replace("\"", "\\\"") + "\"]";
                nativeQuery.setParameter("tagJson", tagJson);
                nativeQuery.setParameter("tagLike", tagLike);
                nativeCountQuery.setParameter("tagJson", tagJson);
                nativeCountQuery.setParameter("tagLike", tagLike);
            }
        }

        if (stateSlug != null && !stateSlug.isBlank()) {
            nativeQuery.setParameter("stateSlug", stateSlug);
            nativeCountQuery.setParameter("stateSlug", stateSlug);
        }

        if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
            nativeQuery.setParameter("minLat", minLat);
            nativeQuery.setParameter("maxLat", maxLat);
            nativeQuery.setParameter("minLng", minLng);
            nativeQuery.setParameter("maxLng", maxLng);
            nativeCountQuery.setParameter("minLat", minLat);
            nativeCountQuery.setParameter("maxLat", maxLat);
            nativeCountQuery.setParameter("minLng", minLng);
            nativeCountQuery.setParameter("maxLng", maxLng);
        }
    }

    private SearchCardDto mapRowToSearchCard(Object[] row) {
        int i = 0;
        UUID id = toUUID(row[i++]);
        String name = (String) row[i++];
        String description = (String) row[i++];
        Integer pricePerNight = toInteger(row[i++]);
        Double latitude = toDouble(row[i++]);
        Double longitude = toDouble(row[i++]);
        String locationName = (String) row[i++];
        Double vibeScore = toDouble(row[i++]);
        Double avgAtmosphereRating = toDouble(row[i++]);
        Double avgServiceRating = toDouble(row[i++]);
        Double avgAccuracyRating = toDouble(row[i++]);
        Double avgValueRating = toDouble(row[i++]);
        Integer totalReviews = toInteger(row[i++]);
        String status = row[i] == null ? null : row[i].toString();
        i++;
        UUID ownerId = toUUID(row[i++]);
        Boolean featured = toBoolean(row[i++]);
        UUID destinationId = toUUID(row[i++]);
        String destinationSlug = (String) row[i++];
        String destinationName = (String) row[i++];
        String destinationDistrict = (String) row[i++];
        String destinationHeroTitle = (String) row[i++];
        String destinationDescription = (String) row[i++];
        String destinationLocalImageName = (String) row[i++];
        String destinationStateName = (String) row[i++];
        String destinationStateSlug = (String) row[i++];
        UUID hostId = toUUID(row[i++]);
        String hostFirstName = (String) row[i++];
        String hostLastName = (String) row[i++];
        String hostRole = row[i] == null ? null : row[i].toString();
        i++;
        String hostAvatarUrl = (String) row[i++];
        Boolean hostVerified = toBoolean(row[i++]);
        String coverImageUrl = (String) row[i];

        return SearchCardDto.builder()
                .id(id)
                .name(name)
                .description(description)
                .pricePerNight(pricePerNight)
                .latitude(latitude)
                .longitude(longitude)
                .locationName(locationName)
                .vibeScore(vibeScore)
                .avgAtmosphereRating(avgAtmosphereRating)
                .avgServiceRating(avgServiceRating)
                .avgAccuracyRating(avgAccuracyRating)
                .avgValueRating(avgValueRating)
                .totalReviews(totalReviews)
                .status(status)
                .ownerId(ownerId)
                .featured(featured)
                .destinationId(destinationId)
                .destinationSlug(destinationSlug)
                .destinationName(destinationName)
                .destinationDistrict(destinationDistrict)
                .destinationHeroTitle(destinationHeroTitle)
                .destinationDescription(destinationDescription)
                .destinationLocalImageName(destinationLocalImageName)
                .destinationStateName(destinationStateName)
                .destinationStateSlug(destinationStateSlug)
                .hostId(hostId)
                .hostFirstName(hostFirstName)
                .hostLastName(hostLastName)
                .hostRole(hostRole)
                .hostAvatarUrl(hostAvatarUrl)
                .hostVerified(hostVerified)
                .coverImageUrl(coverImageUrl)
                .build();
    }

    /**
     * Convert native query result to UUID.
     * H2 returns byte[] for UUID columns, PostgreSQL returns UUID directly.
     */
    private UUID toUUID(Object obj) {
        if (obj == null)
            return null;
        if (obj instanceof UUID)
            return (UUID) obj;
        if (obj instanceof byte[]) {
            byte[] bytes = (byte[]) obj;
            if (bytes.length == 16) {
                long msb = 0;
                long lsb = 0;
                for (int i = 0; i < 8; i++)
                    msb = (msb << 8) | (bytes[i] & 0xff);
                for (int i = 8; i < 16; i++)
                    lsb = (lsb << 8) | (bytes[i] & 0xff);
                return new UUID(msb, lsb);
            }
            // Try parsing as string representation
            return UUID.fromString(new String(bytes));
        }
        return UUID.fromString(obj.toString());
    }

    private Double toDouble(Object obj) {
        if (obj == null)
            return null;
        return ((Number) obj).doubleValue();
    }

    private Integer toInteger(Object obj) {
        if (obj == null)
            return null;
        return ((Number) obj).intValue();
    }

    private Boolean toBoolean(Object obj) {
        if (obj == null)
            return null;
        if (obj instanceof Boolean b) {
            return b;
        }
        return Boolean.parseBoolean(obj.toString());
    }
}
