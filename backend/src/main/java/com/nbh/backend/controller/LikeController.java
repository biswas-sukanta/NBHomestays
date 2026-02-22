package com.nbh.backend.controller;

import com.nbh.backend.model.User;
import com.nbh.backend.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    /**
     * Toggle like — POST = like if not liked, unlike if already liked.
     * Returns: { liked: true|false, count: <long> }
     */
    @PostMapping("/{postId}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable UUID postId,
            @AuthenticationPrincipal User currentUser) {
        boolean liked = likeService.toggle(postId, currentUser.getId());
        long count = likeService.countLikes(postId);
        return ResponseEntity.ok(Map.of("liked", liked, "count", count));
    }

    /** Get like count + whether the current user liked this post. */
    @GetMapping("/{postId}/like")
    public ResponseEntity<Map<String, Object>> getLike(
            @PathVariable UUID postId,
            @AuthenticationPrincipal User currentUser) {
        long count = likeService.countLikes(postId);
        boolean liked = currentUser != null && likeService.isLikedByUser(postId, currentUser.getId());
        return ResponseEntity.ok(Map.of("liked", liked, "count", count));
    }
}
