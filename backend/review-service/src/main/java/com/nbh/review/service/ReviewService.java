package com.nbh.review.service;

import com.nbh.review.model.Review;
import com.nbh.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public Review submitReview(Review review) {
        Review saved = reviewRepository.save(review);
        // In a real event-driven system, we would publish a ReviewCreatedEvent here
        // to update the Homestay's aggregate Vibe Score asynchronously.
        return saved;
    }

    public List<Review> getHomestayReviews(UUID homestayId) {
        return reviewRepository.findByHomestayId(homestayId);
    }

    public BigDecimal calculateAverageVibeScore(UUID homestayId) {
        List<Review> reviews = reviewRepository.findByHomestayId(homestayId);
        if (reviews.isEmpty())
            return BigDecimal.ZERO;

        double avgRating = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        double avgCleanliness = reviews.stream().mapToInt(r -> r.getCleanliness() != null ? r.getCleanliness() : 5)
                .average().orElse(5.0);

        // Vibe Score Formula: (Rating * 2 + Cleanliness)/3 (Simplified)
        double score = (avgRating * 2 + avgCleanliness) / 3.0;

        return BigDecimal.valueOf(score);
    }
}
