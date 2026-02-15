package com.nbh.backend.controller;

import com.nbh.backend.dto.ReviewDto;
import com.nbh.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('HOST') or hasRole('ADMIN')")
    public ResponseEntity<ReviewDto.Response> addReview(@RequestBody ReviewDto.Request request,
            Authentication authentication) {
        return ResponseEntity.ok(reviewService.addReview(request, authentication.getName()));
    }

    @GetMapping("/homestay/{homestayId}")
    public ResponseEntity<List<ReviewDto.Response>> getReviews(@PathVariable UUID homestayId) {
        return ResponseEntity.ok(reviewService.getReviewsByHomestay(homestayId));
    }
}
