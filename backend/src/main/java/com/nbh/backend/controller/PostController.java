package com.nbh.backend.controller;

import com.nbh.backend.dto.PostDto;
import com.nbh.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.nbh.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseEntity<Page<PostDto.Response>> getAllPosts(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(postService.getAllPosts(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostDto.Response>> searchPosts(
            @RequestParam(name = "q", required = false, defaultValue = "") String query,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(postService.searchPosts(query, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto.Response> getPostById(@PathVariable("id") java.util.UUID id) {
        return postService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> createPost(
            @RequestBody PostDto.Request request,
            Authentication authentication) {
        return ResponseEntity.ok(postService.createPost(request, authentication.getName()));
    }

    @GetMapping("/my-posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PostDto.Response>> getMyPosts(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(postService.getPostsByUser(authentication.getName(), pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> updatePost(
            @PathVariable("id") java.util.UUID id,
            @RequestBody PostDto.Request request,
            Authentication authentication) {
        return ResponseEntity.ok(postService.updatePost(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletePost(
            @PathVariable("id") java.util.UUID id,
            Authentication authentication) {
        postService.deletePost(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.LikeResponse> toggleLike(
            @PathVariable("id") java.util.UUID id,
            @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to like this post");
        }
        try {
            PostDto.LikeResponse resp = postService.toggleLike(id, currentUser.getEmail());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR IN TOGGLE LIKE: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<PostDto.LikeResponse> sharePost(
            @PathVariable("id") java.util.UUID id) {
        PostDto.LikeResponse resp = postService.incrementShare(id);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/repost")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> repost(
            @PathVariable("id") java.util.UUID id,
            @RequestBody(required = false) PostDto.Request request,
            Authentication authentication) {
        if (request == null) {
            request = new PostDto.Request();
        }
        return ResponseEntity.ok(postService.repost(id, request, authentication.getName()));
    }
}
