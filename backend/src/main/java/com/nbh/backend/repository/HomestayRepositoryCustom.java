package com.nbh.backend.repository;

import com.nbh.backend.model.Homestay;
import java.util.List;
import java.util.Map;

public interface HomestayRepositoryCustom {
    List<Homestay> search(String query, Map<String, Boolean> amenities, String tag, int limit, int offset);
}
