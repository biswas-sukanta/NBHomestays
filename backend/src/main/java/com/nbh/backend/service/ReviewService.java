package com.nbh.backend.service;

import com.nbh.backend.dto.ReviewDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.Review;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.ReviewRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
public class ReviewService {

        private final ReviewRepository reviewRepository;
        private final HomestayRepository homestayRepository;
        private final UserRepository userRepository;
        private final VibeService vibeService;

        @CacheEvict(value = "homestayReviews", key = "#request.homestayId")
        public ReviewDto.Response addReview(ReviewDto.Request request, String userEmail) {
                User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Homestay homestay = homestayRepository.findById(request.getHomestayId())
                                .orElseThrow(() -> new RuntimeException("Homestay not found"));

                Review review = Review.builder()
                                .homestay(homestay)
                                .user(user)
                                .rating(request.getRating())
                                .comment(request.getComment())
                                .photoUrls(request.getPhotoUrls())
                                .build();

                Review saved = reviewRepository.save(review);

                // Async update
                vibeService.updateVibeScoreAsync(homestay.getId());

                return mapToResponse(saved);
        }

        @Cacheable(value = "homestayReviews", key = "#homestayId", sync = true)
        public List<ReviewDto.Response> getReviewsByHomestay(java.util.UUID homestayId) {
                return reviewRepository.findByHomestayId(homestayId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        private ReviewDto.Response mapToResponse(Review review) {
                return ReviewDto.Response.builder()
                                .id(review.getId())
                                .userName(review.getUser().getFirstName() + " " + review.getUser().getLastName())
                                .rating(review.getRating())
                                .comment(review.getComment())
                                .photoUrls(review.getPhotoUrls())
                                .createdAt(review.getCreatedAt())
                                .build();
        }
}
