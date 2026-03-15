package com.nbh.backend.controller;

import com.nbh.backend.dto.PostDto;
import com.nbh.backend.dto.PostFeedDto;
import com.nbh.backend.model.HelpfulVote;
import com.nbh.backend.model.Post;
import com.nbh.backend.repository.HelpfulVoteRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.service.FeedService;
import com.nbh.backend.service.PostService;
import com.nbh.backend.service.UserService;
import com.nbh.backend.service.XpService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final FeedService feedService;
    private final HelpfulVoteRepository helpfulVoteRepository;
    private final PostRepository postRepository;
    private final UserService userService;
    private final ApplicationEventPublisher eventPublisher;

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
            @RequestParam(name = "scope", required = false, defaultValue = "latest") String scope,
            @RequestParam(name = "cursor", required = false) String cursor,
            @RequestParam(name = "limit", required = false) Integer limit,
            @RequestParam(name = "layout", required = false, defaultValue = "true") boolean layout,
            Authentication authentication) {
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            String email = authentication.getName();
            // Get user ID from email for like status
            userId = postService.getUserIdByEmail(email);
        }
        
        PostFeedDto.FeedResponse response = feedService.getFeed(tag, scope, cursor, limit, userId, layout);
        
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

    @DeleteMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.LikeResponse> unlike(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to unlike this post");
        }
        PostDto.LikeResponse resp = postService.unlike(id, authentication.getName());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PostDto.Response>> searchPosts(
            @RequestParam(name = "q", required = false, defaultValue = "") String query,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(postService.searchPosts(query, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto.Response> getPostById(@PathVariable("id") UUID id) {
        return postService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/trending")
    public ResponseEntity<PostFeedDto.FeedResponse> getTrendingFeed(
            @RequestParam(name = "cursor", required = false) String cursor,
            @RequestParam(name = "limit", required = false) Integer limit,
            @RequestParam(name = "layout", required = false, defaultValue = "true") boolean layout,
            Authentication authentication) {
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated()) {
            userId = postService.getUserIdByEmail(authentication.getName());
        }
        return ResponseEntity.ok(feedService.getFeed(null, "trending", cursor, limit, userId, layout));
    }

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> createPost(
            @Valid @RequestPart("request") PostDto.Request request,
            @RequestPart(value = "files", required = false) List<org.springframework.web.multipart.MultipartFile> files,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postService.createPost(request, files, authentication.getName()));
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
            @PathVariable("id") UUID id,
            @RequestPart("request") PostDto.Request request,
            @RequestPart(value = "files", required = false) List<org.springframework.web.multipart.MultipartFile> files,
            Authentication authentication) {
        return ResponseEntity.ok(postService.updatePost(id, request, files, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletePost(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        postService.deletePost(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.LikeResponse> toggleLike(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to like this post");
        }
        try {
            PostDto.LikeResponse resp = postService.toggleLike(id, authentication.getName());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            throw e;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // HELPFUL VOTE ENDPOINT (Phase 3 - Elevation Engine)
    // ═════════════════════════════════════════════════════════════════════════
    
    /**
     * Mark a post as helpful.
     * 
     * Rules:
     * - User must be authenticated
     * - Cannot mark own post as helpful
     * - Cannot mark same post twice
     * 
     * Side effects:
     * - Increments helpful_count on Post
     * - Publishes HelpfulVoteEvent for async XP processing
     */
    @PostMapping("/{id}/helpful")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HelpfulVoteResponse> markPostHelpful(
            @PathVariable("id") UUID id,
            Authentication authentication) {
        
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in to mark posts as helpful");
        }
        
        UUID voterId = userService.findUserIdByEmail(authentication.getName());
        if (voterId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }
        
        // Check if already voted
        if (helpfulVoteRepository.existsByPostIdAndUserId(id, voterId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already marked as helpful");
        }
        
        // Get post and author
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        
        // Prevent self-voting
        if (post.getUser().getId().equals(voterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot mark own post as helpful");
        }
        
        // Save helpful vote
        HelpfulVote vote = HelpfulVote.builder()
                .postId(id)
                .userId(voterId)
                .votedAt(Instant.now())
                .build();
        helpfulVoteRepository.save(vote);
        
        // Increment helpful count on post
        int newHelpfulCount = post.getHelpfulCount() + 1;
        post.setHelpfulCount(newHelpfulCount);
        postRepository.save(post);
        
        // Publish event for XpService to process async
        eventPublisher.publishEvent(new XpService.HelpfulVoteEvent(
                id, voterId, post.getUser().getId(), Instant.now()));
        
        return ResponseEntity.ok(new HelpfulVoteResponse(newHelpfulCount, true));
    }
    
    /**
     * Response DTO for helpful vote endpoint.
     */
    public record HelpfulVoteResponse(int helpfulCount, boolean voted) {}

    @PostMapping("/{id}/share")
    public ResponseEntity<PostDto.LikeResponse> sharePost(
            @PathVariable("id") UUID id) {
        PostDto.LikeResponse resp = postService.incrementShare(id);
        return ResponseEntity.ok(resp);
    }

    @PostMapping(value = "/{id}/repost", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PostDto.Response> repost(
            @PathVariable("id") UUID id,
            @RequestPart(value = "request", required = false) PostDto.Request request,
            @RequestPart(value = "files", required = false) List<org.springframework.web.multipart.MultipartFile> files,
            Authentication authentication) {
        if (request == null) {
            request = new PostDto.Request();
        }
        return ResponseEntity.ok(postService.repost(id, request, files, authentication.getName()));
    }

    // ── Deep Wipe Endpoint (Admin Only) ─────────────────────────────────────
    /**
     * DEEP WIPE: Deletes ALL posts, comments, likes, and physical media files.
     * This is a nuclear option - admin only.
     * 
     * @return WipeResult with counts of deleted entities
     */
    @DeleteMapping("/admin/wipe-all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<PostService.WipeResult> wipeAllPosts(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        PostService.WipeResult result = postService.wipeAllPosts(authentication.getName());
        return ResponseEntity.ok(result);
    }

    // ── Batch Wipe Endpoint (Admin Only) ─────────────────────────────────────
    /**
     * BATCH WIPE: Deletes a limited batch of posts, comments, likes, and physical media files.
     * Designed to avoid timeouts by processing in chunks.
     * 
     * @param limit Maximum number of posts to delete in this batch (default 10)
     * @return BatchWipeResult with deletedCount and hasMore flag
     */
    @DeleteMapping("/admin/wipe-batch")
    @PreAuthorize("hasRole('ADMIN') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<PostService.BatchWipeResult> wipePostsBatch(
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        PostService.BatchWipeResult result = postService.wipePostsBatch(authentication.getName(), limit);
        return ResponseEntity.ok(result);
    }
}
