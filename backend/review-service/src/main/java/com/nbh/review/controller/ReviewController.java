package com.nbh.review.controller;

import com.nbh.review.model.Review;
import com.nbh.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public Review submitReview(@RequestBody Review review) {
        return reviewService.submitReview(review);
    }

    @GetMapping("/homestay/{homestayId}")
    public List<Review> getReviews(@PathVariable UUID homestayId) {
        return reviewService.getHomestayReviews(homestayId);
    }
}
