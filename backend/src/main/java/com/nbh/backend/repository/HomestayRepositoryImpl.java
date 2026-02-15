package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class HomestayRepositoryImpl implements HomestayRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Homestay> search(String searchQuery, Map<String, Boolean> amenities, int limit, int offset) {
        StringBuilder sql = new StringBuilder("SELECT h.* FROM homestays h WHERE h.status = 'APPROVED' ");

        // Full Text Search
        if (searchQuery != null && !searchQuery.isBlank()) {
            sql.append(
                    "AND (to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')) @@ plainto_tsquery('english', :query)) ");
        }

        // JSONB Filters
        if (amenities != null && !amenities.isEmpty()) {
            for (String key : amenities.keySet()) {
                if (Boolean.TRUE.equals(amenities.get(key))) {
                    sql.append("AND h.amenities ->> '").append(key).append("' = 'true' ");
                }
            }
        }

        // Ranking (The Secret Sauce)
        // distance not implemented in this snippet as we don't have user location input
        // yet in search params,
        // defaulting distance factor to 0 or 1 for now.
        // Formula: (ts_rank(...) * 0.4 + vibe_score * 0.4)
        if (searchQuery != null && !searchQuery.isBlank()) {
            sql.append(
                    "ORDER BY (ts_rank(to_tsvector('english', COALESCE(h.name, '') || ' ' || COALESCE(h.description, '') || ' ' || COALESCE(h.address, '')), plainto_tsquery('english', :query)) * 0.4 + COALESCE(h.vibe_score, 0) * 0.4) DESC ");
        } else {
            sql.append("ORDER BY COALESCE(h.vibe_score, 0) DESC ");
        }

        // Pagination
        sql.append("LIMIT :limit OFFSET :offset");

        Query nativeQuery = entityManager.createNativeQuery(sql.toString(), Homestay.class);

        if (searchQuery != null && !searchQuery.isBlank()) {
            nativeQuery.setParameter("query", searchQuery);
        }
        nativeQuery.setParameter("limit", limit);
        nativeQuery.setParameter("offset", offset);

        @SuppressWarnings("unchecked")
        List<Homestay> result = nativeQuery.getResultList();
        return result;
    }
}
