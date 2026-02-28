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
        private List<MediaDto> media;
        private UUID homestayId;
        private UUID originalPostId;
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
