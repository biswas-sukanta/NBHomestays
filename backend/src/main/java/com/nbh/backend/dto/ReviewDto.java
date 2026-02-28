package com.nbh.backend.dto;

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
        private UUID homestayId;
        private Integer rating;
        private Integer atmosphereRating;
        private Integer serviceRating;
        private Integer accuracyRating;
        private Integer valueRating;
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
