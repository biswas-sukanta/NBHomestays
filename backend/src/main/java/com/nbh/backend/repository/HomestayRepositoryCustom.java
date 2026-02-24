package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface HomestayRepositoryCustom {
    Page<Homestay> search(String query, Map<String, Boolean> amenities, String tag, Boolean isFeatured,
            Pageable pageable);
}
