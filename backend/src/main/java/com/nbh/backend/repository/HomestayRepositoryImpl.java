package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class HomestayRepositoryImpl implements HomestayRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<Homestay> search(String searchQuery, Map<String, Boolean> amenities, String tag, Boolean isFeatured,
            Pageable pageable) {
        StringBuilder sql = new StringBuilder("SELECT h.id FROM homestays h WHERE h.status = 'APPROVED' ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM homestays h WHERE h.status = 'APPROVED' ");

        StringBuilder conditions = new StringBuilder();

        if (Boolean.TRUE.equals(isFeatured)) {
            conditions.append("AND h.featured = true ");
        } else if (Boolean.FALSE.equals(isFeatured)) {
            conditions.append("AND (h.featured = false OR h.featured IS NULL) ");
        }

        // Full Text Search
        if (searchQuery != null && !searchQuery.isBlank()) {
            conditions.append(
                    "AND (to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')) @@ plainto_tsquery('english', :query)) ");
        }

        // JSONB Filters
        if (amenities != null && !amenities.isEmpty()) {
            for (String key : amenities.keySet()) {
                if (Boolean.TRUE.equals(amenities.get(key))) {
                    conditions.append("AND h.amenities ->> '").append(key).append("' = 'true' ");
                }
            }
        }

        // Tag Filter (JSONB Array contains element OR location_name checks for legacy
        // safety)
        if (tag != null && !tag.isBlank()) {
            String safeTag = tag.replace("'", "''");
            conditions.append("AND (h.tags @> '[\"")
                    .append(safeTag)
                    .append("\"]'::jsonb OR lower(h.address) LIKE lower('%")
                    .append(safeTag)
                    .append("%')) ");
        }

        sql.append(conditions);
        countSql.append(conditions);

        // Ranking
        if (searchQuery != null && !searchQuery.isBlank()) {
            sql.append(
                    "ORDER BY (ts_rank(to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')), plainto_tsquery('english', :query)) * 0.4 + COALESCE(h.vibe_score, 0) * 0.4) DESC ");
        } else {
            sql.append("ORDER BY COALESCE(h.vibe_score, 0) DESC ");
        }

        // Pagination
        sql.append("LIMIT :limit OFFSET :offset");

        Query nativeQuery = entityManager.createNativeQuery(sql.toString());
        Query nativeCountQuery = entityManager.createNativeQuery(countSql.toString());

        if (searchQuery != null && !searchQuery.isBlank()) {
            nativeQuery.setParameter("query", searchQuery);
            nativeCountQuery.setParameter("query", searchQuery);
        }

        nativeQuery.setParameter("limit", pageable.getPageSize());
        nativeQuery.setParameter("offset", pageable.getOffset());

        @SuppressWarnings("unchecked")
        List<Object> rawIds = nativeQuery.getResultList();
        List<java.util.UUID> ids = rawIds.stream()
                .map(obj -> {
                    if (obj instanceof java.util.UUID)
                        return (java.util.UUID) obj;
                    return java.util.UUID.fromString(obj.toString());
                })
                .collect(java.util.stream.Collectors.toList());
        long total = ((Number) nativeCountQuery.getSingleResult()).longValue();

        if (ids.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, total);
        }

        // N+1 Fix: Fetch entities with JOIN FETCH to eagerly load proxies
        List<Homestay> unsorted = entityManager.createQuery(
                "SELECT h FROM Homestay h LEFT JOIN FETCH h.owner LEFT JOIN FETCH h.photoUrls WHERE h.id IN :ids",
                Homestay.class).setParameter("ids", ids).getResultList();

        // Sort unsorted list based on the order of the initially ranked native 'ids'
        Map<java.util.UUID, Homestay> homestayMap = unsorted.stream()
                .collect(java.util.stream.Collectors.toMap(Homestay::getId, h -> h));
        List<Homestay> result = ids.stream()
                .map(homestayMap::get)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());

        return new PageImpl<>(result, pageable, total);
    }
}
