package com.nbh.backend.repository;

import com.nbh.backend.dto.SearchCardDto;
import com.nbh.backend.model.Homestay;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface HomestayRepositoryCustom {
    Page<Homestay> search(String query, Map<String, Boolean> amenities, String tag, String stateSlug,
            Boolean isFeatured,
            Double minLat, Double maxLat, Double minLng, Double maxLng,
            Pageable pageable);

    Page<SearchCardDto> searchCards(String query, Map<String, Boolean> amenities, String tag, String stateSlug,
            Boolean isFeatured,
            Double minLat, Double maxLat, Double minLng, Double maxLng,
            Pageable pageable);
}
