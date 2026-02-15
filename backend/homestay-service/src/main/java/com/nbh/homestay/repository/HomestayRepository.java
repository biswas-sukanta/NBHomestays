package com.nbh.homestay.repository;

import com.nbh.homestay.model.Homestay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface HomestayRepository extends JpaRepository<Homestay, UUID> {

    // Hybrid Search Query:
    // Matches text against search_vector
    // Orders by a weighted rank of text match, vibe score, and freshness (implied
    // by ID or created_at)
    @Query(value = """
            SELECT h.*,
                   ts_rank(h.search_vector, to_tsquery('english', :query)) * 0.5 +
                   COALESCE(h.vibe_score, 0) * 0.3 as rank_score
            FROM homestays h
            WHERE h.status = 'APPROVED'
              AND (:query IS NULL OR :query = '' OR h.search_vector @@ to_tsquery('english', :query))
              AND (:minPrice IS NULL OR h.price_per_night >= :minPrice)
              AND (:maxPrice IS NULL OR h.price_per_night <= :maxPrice)
            ORDER BY rank_score DESC
            """, nativeQuery = true)
    List<Homestay> searchHomestays(
            @Param("query") String query,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice
    );

    List<Homestay> findByOwnerId(String ownerId);
}
