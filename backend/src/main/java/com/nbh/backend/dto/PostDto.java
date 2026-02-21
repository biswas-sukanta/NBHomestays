package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class PostDto {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {
        private String locationName;
        private String textContent;
        private List<String> imageUrls;
        private UUID homestayId;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {
        private UUID id;
        private UUID userId;
        private String userName;
        private String locationName;
        private String textContent;
        private List<String> imageUrls;
        private UUID homestayId;
        private String homestayName;
        private LocalDateTime createdAt;
    }
}
