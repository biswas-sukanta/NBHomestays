package com.nbh.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
        @NotBlank(message = "Location name is mandatory")
        @Size(max = 255, message = "Location name cannot exceed 255 characters")
        private String locationName;

        @NotBlank(message = "Text content is mandatory")
        @Size(max = 5000, message = "Text content cannot exceed 5000 characters")
        private String textContent;

        private List<MediaDto> media;
        private UUID homestayId;
        private UUID originalPostId;

        @Size(max = 3, message = "Maximum 3 tags allowed")
        private List<String> tags;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {
        private UUID id;
        private AuthorDto author;
        private String locationName;
        private String textContent;
        private List<MediaDto> media;
        private UUID homestayId;
        private String homestayName;
        private int loveCount;
        private int shareCount;
        private int commentCount;
        private boolean isLikedByCurrentUser;
        private Response originalPost;
        private LocalDateTime createdAt;
        private List<String> tags;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LikeResponse {
        private int loveCount;
        private boolean isLiked;
    }
}
