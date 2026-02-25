package com.nbh.backend.controller;

import com.nbh.backend.dto.CommentDto;
import com.nbh.backend.model.User;
import com.nbh.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /** Paginated top-level comments (with embedded first-level replies). */
    @GetMapping("/posts/{postId}/comments")
    public Page<CommentDto> getComments(
            @PathVariable("postId") UUID postId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return commentService.getComments(postId, page, size);
    }

    /** Add a top-level comment. */
    @PostMapping("/posts/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable UUID postId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(commentService.addComment(postId, body.get("body"), currentUser));
    }

    /** Reply to an existing comment. */
    @PostMapping("/posts/{postId}/comments/{parentId}/replies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDto> addReply(
            @PathVariable("postId") UUID postId,
            @PathVariable("parentId") UUID parentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(commentService.addReply(postId, parentId, body.get("body"), currentUser));
    }

    /** Delete a comment (owner or admin). */
    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
            @PathVariable("commentId") UUID commentId,
            @AuthenticationPrincipal User currentUser) {
        commentService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
