package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Lightweight projection DTO for community feed.
 * Designed to avoid Hibernate lazy-loading traps by using SQL aggregation
 * and batch queries instead of entity collection access.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostFeedDto {

    private UUID postId;
    private String textContent;
    private LocalDateTime createdAt;
    
    // Author (pre-loaded via JOIN)
    private UUID authorId;
    private String authorName;
    private String authorAvatarUrl;
    private String authorRole;
    private boolean authorVerifiedHost;
    private boolean isLikedByCurrentUser;
    
    // Counts (pre-computed via SQL aggregation)
    private int commentCount;
    private int likeCount;
    private int shareCount;
    
    // Optional homestay reference
    private UUID homestayId;
    private String homestayName;
    
    // Tags (loaded via batch query)
    private List<String> tags;
    
    // Media variants (loaded via batch query with ImageKit transforms)
    private List<MediaVariantDto> media;
    
    // Repost metadata (minimal, no recursion)
    private boolean isRepost;
    private UUID originalPostId;
    private String originalAuthorName;
    private String originalContentPreview; // First 150 chars
    
    /**
     * Author information for feed display.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorDto {
        private UUID id;
        private String name;
        private String avatarUrl;
        private String role;
        private boolean isVerifiedHost;
    }

    /**
     * Media variant with multiple resolution URLs for responsive images.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaVariantDto {
        private UUID id;
        private String fileId;
        private String originalUrl;
        private String thumbnail;  // w-200,q-60,f-auto
        private String small;      // w-480,q-70,f-auto
        private String medium;     // w-800,q-75,f-auto
        private String large;      // w-1200,q-80,f-auto
    }
    
    /**
     * Cursor for pagination (encoded as Base64 JSON by controller).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Cursor {
        private LocalDateTime createdAt;
        private UUID id;
    }
    
    /**
     * Cursor-paginated response wrapper.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedResponse {
        private List<PostFeedDto> posts;
        private String nextCursor;
        private boolean hasMore;
    }
}
