package com.nbh.homestay.service;

import com.nbh.homestay.model.Homestay;
import com.nbh.homestay.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HomestayService {

    private final HomestayRepository homestayRepository;

    @Transactional
    public Homestay createHomestay(Homestay homestay) {
        homestay.setStatus(Homestay.HomestayStatus.DRAFT);
        // Logic to update searchVector would typically be a DB trigger or computed in
        // Java
        return homestayRepository.save(homestay);
    }

    public List<Homestay> search(String query, BigDecimal minPrice, BigDecimal maxPrice) {
        // Prepare query for tsquery (e.g., replace spaces with &)
        String formattedQuery = (query == null || query.isBlank()) ? null : query.trim().replace(" ", " & ");
        return homestayRepository.searchHomestays(formattedQuery, minPrice, maxPrice);
    }

    public List<Homestay> getMyHomestays(String ownerId) {
        return homestayRepository.findByOwnerId(ownerId);
    }

    public Homestay getHomestay(UUID id) {
        return homestayRepository.findById(id).orElseThrow(() -> new RuntimeException("Homestay not found"));
    }
}
