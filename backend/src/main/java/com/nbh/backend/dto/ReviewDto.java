package com.nbh.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;
import java.time.LocalDateTime;

public class ReviewDto {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {
        @NotNull(message = "Homestay ID is mandatory")
        private UUID homestayId;

        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        private Integer rating;

        @Min(value = 1)
        @Max(value = 5)
        private Integer atmosphereRating;

        @Min(value = 1)
        @Max(value = 5)
        private Integer serviceRating;

        @Min(value = 1)
        @Max(value = 5)
        private Integer accuracyRating;

        @Min(value = 1)
        @Max(value = 5)
        private Integer valueRating;

        @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
        private String comment;

        private java.util.List<String> photoUrls;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {
        private UUID id;
        private String userName;
        private Integer atmosphereRating;
        private Integer serviceRating;
        private Integer accuracyRating;
        private Integer valueRating;
        private Double overallRating;
        private String comment;
        private java.util.List<String> photoUrls;
        private LocalDateTime createdAt;
    }
}
