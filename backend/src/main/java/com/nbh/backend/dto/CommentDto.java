package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** DTO returned to clients for comment data. */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentDto {

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {
        private String body;
        private List<String> imageUrls;
    }

    private UUID id;
    private UUID postId;
    private UUID parentId;

    // Author info
    private UUID authorId;
    private String authorName;
    private String authorAvatarUrl;

    private String body;
    private List<String> imageUrls;
    private LocalDateTime createdAt;

    /** First-level replies (populated only for top-level comments). */
    private List<CommentDto> replies;
    private int replyCount;
}
