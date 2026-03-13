package com.nbh.backend.controller;

import com.nbh.backend.dto.CommentDto;
import com.nbh.backend.model.User;
import com.nbh.backend.service.CommentService;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    private User requireCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
    }

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
            @Valid @RequestBody CommentDto.Request request,
            Authentication authentication) {
        User currentUser = requireCurrentUser(authentication);
        try {
            return ResponseEntity.ok(commentService.addComment(postId, request, currentUser));
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR IN ADD COMMENT: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /** Reply to an existing comment. */
    @PostMapping("/posts/{postId}/comments/{parentId}/replies")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDto> addReply(
            @PathVariable("postId") UUID postId,
            @PathVariable("parentId") UUID parentId,
            @Valid @RequestBody CommentDto.Request request,
            Authentication authentication) {
        User currentUser = requireCurrentUser(authentication);
        try {
            return ResponseEntity.ok(commentService.addReply(postId, parentId, request, currentUser));
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR IN ADD REPLY: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /** Update an existing comment (owner only). */
    @PutMapping("/posts/{postId}/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable("postId") UUID postId,
            @PathVariable("commentId") UUID commentId,
            @Valid @RequestBody CommentDto.Request request,
            Authentication authentication) {
        User currentUser = requireCurrentUser(authentication);
        try {
            return ResponseEntity.ok(commentService.updateComment(commentId, request, currentUser));
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR IN EDIT COMMENT: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /** Delete a comment (owner or admin). */
    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteComment(
            @PathVariable("commentId") UUID commentId,
            Authentication authentication) {
        User currentUser = requireCurrentUser(authentication);
        commentService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
