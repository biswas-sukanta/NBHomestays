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
    public Page<Homestay> search(String searchQuery, Map<String, Boolean> amenities, String tag, Pageable pageable) {
        StringBuilder sql = new StringBuilder("SELECT h.* FROM homestays h WHERE h.status = 'APPROVED' ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM homestays h WHERE h.status = 'APPROVED' ");

        StringBuilder conditions = new StringBuilder();

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

        Query nativeQuery = entityManager.createNativeQuery(sql.toString(), Homestay.class);
        Query nativeCountQuery = entityManager.createNativeQuery(countSql.toString());

        if (searchQuery != null && !searchQuery.isBlank()) {
            nativeQuery.setParameter("query", searchQuery);
            nativeCountQuery.setParameter("query", searchQuery);
        }

        nativeQuery.setParameter("limit", pageable.getPageSize());
        nativeQuery.setParameter("offset", pageable.getOffset());

        @SuppressWarnings("unchecked")
        List<Homestay> result = nativeQuery.getResultList();
        long total = ((Number) nativeCountQuery.getSingleResult()).longValue();

        return new PageImpl<>(result, pageable, total);
    }
}
