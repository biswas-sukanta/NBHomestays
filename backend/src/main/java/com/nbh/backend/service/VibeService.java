package com.nbh.backend.service;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.Review;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
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
    private final CacheManager cacheManager;

    @Async
    @Transactional
    public void updateVibeScoreAsync(UUID homestayId) {
        homestayRepository.findById(homestayId).ifPresent(h -> {
            calculateAndSave(h);
            // Programmatic eviction — @Async bypasses Spring AOP proxy
            evictHomestayCache(homestayId);
        });
    }

    private void evictHomestayCache(UUID homestayId) {
        var homestayCache = cacheManager.getCache("homestay");
        if (homestayCache != null)
            homestayCache.evict(homestayId);

        var searchCache = cacheManager.getCache("homestaysSearch");
        if (searchCache != null)
            searchCache.clear();

        log.info("Evicted homestay caches after vibeScore update for {}", homestayId);
    }

    @Transactional
    public void calculateAndSave(Homestay homestay) {
        List<Review> reviews = reviewRepository.findByHomestayId(homestay.getId());
        int total = reviews.size();
        homestay.setTotalReviews(total);

        if (total > 0) {
            double sumAtmosphere = 0, sumService = 0, sumAccuracy = 0, sumValue = 0, sumOverall = 0;
            for (Review r : reviews) {
                sumAtmosphere += (r.getAtmosphereRating() != null ? r.getAtmosphereRating() : 0);
                sumService += (r.getServiceRating() != null ? r.getServiceRating() : 0);
                sumAccuracy += (r.getAccuracyRating() != null ? r.getAccuracyRating() : 0);
                sumValue += (r.getValueRating() != null ? r.getValueRating() : 0);
                sumOverall += r.getRating();
            }
            homestay.setAvgAtmosphereRating(Math.round((sumAtmosphere / total) * 10.0) / 10.0);
            homestay.setAvgServiceRating(Math.round((sumService / total) * 10.0) / 10.0);
            homestay.setAvgAccuracyRating(Math.round((sumAccuracy / total) * 10.0) / 10.0);
            homestay.setAvgValueRating(Math.round((sumValue / total) * 10.0) / 10.0);

            double avgRating = sumOverall / total;
            double responseRate = 1.0;
            int imageCount = homestay.getMediaFiles() != null ? homestay.getMediaFiles().size() : 0;
            double score = (avgRating * 0.6) + (responseRate * 0.2) + (imageCount * 0.2);
            homestay.setVibeScore(Math.round(score * 10.0) / 10.0);
            log.info("Updated Vibe Score for {}: {}", homestay.getName(), homestay.getVibeScore());
        } else {
            homestay.setVibeScore(4.0); // Default for new properties
            homestay.setTotalReviews(0);
        }
        homestayRepository.save(homestay);
    }

    private double calculateAvgRating(java.util.UUID homestayId) {
        List<Review> reviews = reviewRepository.findByHomestayId(homestayId);
        if (reviews.isEmpty())
            return 0.0;
        double sum = reviews.stream().mapToInt(Review::getRating).sum();
        return sum / reviews.size();
    }
}
