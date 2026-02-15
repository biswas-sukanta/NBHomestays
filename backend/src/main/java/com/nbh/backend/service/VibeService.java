package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.Review;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class VibeService {

    private final HomestayRepository homestayRepository;
    private final ReviewRepository reviewRepository;

    @Async
    @Transactional
    public void updateVibeScoreAsync(UUID homestayId) {
        homestayRepository.findById(homestayId).ifPresent(this::calculateAndSave);
    }

    @Transactional
    public void calculateAndSave(Homestay homestay) {
        double avgRating = calculateAvgRating(homestay.getId());
        double responseRate = 1.0; // Placeholder
        int imageCount = homestay.getPhotoUrls() != null ? homestay.getPhotoUrls().size() : 0;

        double score = (avgRating * 0.6) + (responseRate * 0.2) + (imageCount * 0.2);

        // Round to 1 decimal for cleanliness
        score = Math.round(score * 10.0) / 10.0;

        homestay.setVibeScore(score);
        homestayRepository.save(homestay);
        log.info("Updated Vibe Score for {}: {}", homestay.getName(), score);
    }

    private double calculateAvgRating(java.util.UUID homestayId) {
        List<Review> reviews = reviewRepository.findByHomestayId(homestayId);
        if (reviews.isEmpty())
            return 0.0;
        double sum = reviews.stream().mapToInt(Review::getRating).sum();
        return sum / reviews.size();
    }
}
