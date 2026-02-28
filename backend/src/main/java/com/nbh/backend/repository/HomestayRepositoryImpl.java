package com.nbh.backend.repository;

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
    public Page<Homestay> search(String searchQuery, Map<String, Boolean> amenities, String tag, Boolean isFeatured,
            Double minLat, Double maxLat, Double minLng, Double maxLng,
            Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "SELECT h.id FROM homestays h WHERE h.is_deleted = false AND h.status = 'APPROVED' ");
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(*) FROM homestays h WHERE h.is_deleted = false AND h.status = 'APPROVED' ");

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
                "SELECT h FROM Homestay h LEFT JOIN FETCH h.owner LEFT JOIN FETCH h.mediaFiles WHERE h.id IN :ids",
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
}
