package com.nbh.backend.controller;

import com.nbh.backend.dto.PostDto;
import com.nbh.backend.dto.PostFeedDto;
import com.nbh.backend.service.FeedService;
import com.nbh.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
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
    private final FeedService feedService;

    /**
     * Legacy pageable endpoint - unchanged for backward compatibility.
     * Returns Spring Page format.
     */
    @GetMapping
    public ResponseEntity<Page<PostDto.Response>> getAllPosts(
            @RequestParam(name = "tag", required = false) String tag,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(postService.getAllPosts(tag, pageable));
    }

    /**
     * Optimized cursor-paginated feed endpoint.
     * Returns {posts, nextCursor, hasMore, blocks} format.
     * Includes HTTP cache headers for client-side caching.
     * 
     * @param tag Optional tag filter
     * @param cursor Base64-encoded cursor (null for first page)
     * @param limit Page size (default 12)
     * @param layout Whether to generate layout blocks (default true)
     */
    @GetMapping("/feed")
    public ResponseEntity<PostFeedDto.FeedResponse> getFeed(
            @RequestParam(name = "tag", required = false) String tag,
            @RequestParam(name = "cursor", required = false) String cursor,
            @RequestParam(name = "limit", required = false) Integer limit,
            @RequestParam(name = "layout", required = false, defaultValue = "true") boolean layout,
            Authentication authentication) {
        java.util.UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            // Get user ID from email for like status
            userId = postService.getUserIdByEmail(email);
        }
        
        PostFeedDto.FeedResponse response = feedService.getFeed(tag, cursor, limit, userId, layout);
        
        // Generate ETag from response hash
        String etag = generateFeedETag(response);
        
        // HTTP cache headers: private (user-specific), max-age=10s
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(10, java.util.concurrent.TimeUnit.SECONDS)
                        .cachePrivate())
                .eTag(etag)
                .body(response);
    }
    
    /**
     * Generate ETag for feed response.
     * Uses SHA-256 for deterministic and collision-resistant hash.
     */
    private String generateFeedETag(PostFeedDto.FeedResponse response) {
        try {
            StringBuilder sb = new StringBuilder();
            response.getPosts().forEach(p -> sb.append(p.getPostId()).append(":"));
            sb.append(response.getNextCursor());
            sb.append(response.isHasMore());
            
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            // Convert to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return "\"" + hexString + "\"";
        } catch (java.security.NoSuchAlgorithmException e) {
            // Fallback to hashCode if SHA-256 unavailable
            StringBuilder sb = new StringBuilder();
            response.getPosts().forEach(p -> sb.append(p.getPostId()).append(":"));
            sb.append(response.getNextCursor());
            sb.append(response.isHasMore());
            return "\"" + Integer.toHexString(sb.toString().hashCode()) + "\"";
        }
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

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> createPost(
            @Valid @RequestPart("request") PostDto.Request request,
            @RequestPart(value = "files", required = false) java.util.List<org.springframework.web.multipart.MultipartFile> files,
            Authentication authentication) {
        return ResponseEntity.ok(postService.createPost(request, files, authentication.getName()));
    }

    @GetMapping("/my-posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PostDto.Response>> getMyPosts(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(postService.getPostsByUser(authentication.getName(), pageable));
    }

    @PutMapping(value = "/{id}", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> updatePost(
            @PathVariable("id") java.util.UUID id,
            @RequestPart("request") PostDto.Request request,
            @RequestPart(value = "files", required = false) java.util.List<org.springframework.web.multipart.MultipartFile> files,
            Authentication authentication) {
        return ResponseEntity.ok(postService.updatePost(id, request, files, authentication.getName()));
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
            throw e;
        }
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<PostDto.LikeResponse> sharePost(
            @PathVariable("id") java.util.UUID id) {
        PostDto.LikeResponse resp = postService.incrementShare(id);
        return ResponseEntity.ok(resp);
    }

    @PostMapping(value = "/{id}/repost", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> repost(
            @PathVariable("id") java.util.UUID id,
            @RequestPart(value = "request", required = false) PostDto.Request request,
            @RequestPart(value = "files", required = false) java.util.List<org.springframework.web.multipart.MultipartFile> files,
            Authentication authentication) {
        if (request == null) {
            request = new PostDto.Request();
        }
        return ResponseEntity.ok(postService.repost(id, request, files, authentication.getName()));
    }
}
