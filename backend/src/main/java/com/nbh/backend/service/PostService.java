package com.nbh.backend.service;

import com.nbh.backend.dto.PostDto;
import com.nbh.backend.dto.AuthorDto;
import com.nbh.backend.dto.MediaDto;
import com.nbh.backend.model.Destination;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.MediaResource;
import com.nbh.backend.model.Post;
import com.nbh.backend.model.PostLike;
import com.nbh.backend.model.PostType;
import com.nbh.backend.model.User;
import com.nbh.backend.model.VibeTag;
import com.nbh.backend.repository.DestinationRepository;
import com.nbh.backend.repository.MediaResourceRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.PostLikeRepository;
import com.nbh.backend.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Optional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final HomestayRepository homestayRepository;
    private final DestinationRepository destinationRepository;
    private final PostLikeRepository postLikeRepository;
    private final MediaResourceRepository mediaResourceRepository;
    private final CommentRepository commentRepository;
    private final ImageUploadService imageUploadService;
    private final AsyncJobService asyncJobService;
    private final FeedCacheService feedCacheService;
    private final TimelineService timelineService;
    private final ViewTrackingService viewTrackingService;

    /**
     * Get user ID by email - used by feed service for like status.
     */
    public java.util.UUID getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(null);
    }

    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true)
    })
    public PostDto.Response createPost(PostDto.Request request,
            java.util.List<org.springframework.web.multipart.MultipartFile> files, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        validatePostRequest(request);

        Homestay homestay = null;
        if (request.getHomestayId() != null) {
            homestay = homestayRepository.findById(request.getHomestayId()).orElse(null);
        }

        Destination destination = null;
        if (request.getDestinationId() != null) {
            destination = destinationRepository.findById(request.getDestinationId()).orElse(null);
        }

        Post originalPost = null;
        if (request.getOriginalPostId() != null) {
            originalPost = postRepository.findById(request.getOriginalPostId()).orElse(null);
        }

        Post post = Post.builder()
                .id(java.util.UUID.randomUUID())
                .locationName(request.getLocationName())
                .textContent(request.getTextContent())
                .tags(request.getTags() != null ? request.getTags() : new java.util.ArrayList<>())
                .mediaFiles(request.getMedia() != null ? request.getMedia().stream()
                        .map(dto -> com.nbh.backend.model.MediaResource.builder()
                                .id(dto.getId())
                                .url(dto.getUrl())
                                .fileId(dto.getFileId())
                                .build())
                        .collect(java.util.stream.Collectors.toList()) : new java.util.ArrayList<>())
                .user(user)
                .homestay(homestay)
                .destination(destination)
                .originalPost(originalPost)
                .createdAt(Instant.now())
                .postType(request.getPostType())
                .isEditorial(user.getRole() == User.Role.ROLE_ADMIN)
                .build();

        if (post.getMediaFiles() != null) {
            final Post finalPost = post;
            post.getMediaFiles().forEach(m -> m.setPost(finalPost));
        }

        if (files != null && !files.isEmpty()) {
            try {
                java.util.List<com.nbh.backend.model.MediaResource> uploadedResources = imageUploadService
                        .uploadFiles(files, "posts/" + post.getId());
                for (com.nbh.backend.model.MediaResource res : uploadedResources) {
                    res.setPost(post);
                }
                if (post.getMediaFiles() == null) {
                    post.setMediaFiles(new java.util.ArrayList<>());
                }
                post.getMediaFiles().addAll(uploadedResources);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload media files", e);
            }
        }

        Post saved = postRepository.save(post);
        asyncJobService.enqueuePostProcessMedia(extractFileIds(request.getMedia()), "posts/" + saved.getId());
        feedCacheService.invalidateAll();
        // Fan-out to timeline
        timelineService.insertPostToTimeline(saved);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<PostDto.Response> getPostById(java.util.UUID id) {
        viewTrackingService.incrementPostView(id);
        feedCacheService.invalidateAll();
        return postRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", key = "(#tag ?: 'all') + '-' + #pageable.pageNumber + '-' + #pageable.pageSize", sync = true)
    public Page<PostDto.Response> getAllPosts(String tag, Pageable pageable) {
        // Use optimized projection queries - single query for posts + batch load media
        Page<Object[]> postsPage = (tag != null && !tag.isBlank())
                ? postRepository.findPostProjectionsByTag(tag, pageable)
                : postRepository.findAllPostProjections(pageable);
        
        // Extract post IDs for batch queries
        List<UUID> postIds = postsPage.getContent().stream()
                .map(row -> (UUID) row[0])
                .collect(Collectors.toList());
        
        // Batch load media (1 query)
        Map<UUID, List<MediaDto>> mediaByPost = loadMediaByPostIds(postIds);
        
        // Map to DTOs
        List<PostDto.Response> dtos = postsPage.getContent().stream()
                .map(row -> mapProjectionToResponse(row, mediaByPost, null))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtos, pageable, postsPage.getTotalElements());
    }

    /**
     * Batch load media for multiple posts - single query.
     */
    private Map<UUID, List<MediaDto>> loadMediaByPostIds(List<UUID> postIds) {
        if (postIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        List<Object[]> rows = postRepository.findMediaByPostIds(postIds);
        Map<UUID, List<MediaDto>> result = new java.util.HashMap<>();
        
        for (Object[] row : rows) {
            UUID postId = (UUID) row[0];
            UUID mediaId = (UUID) row[1];
            String url = (String) row[2];
            String fileId = (String) row[3];
            
            result.computeIfAbsent(postId, k -> new java.util.ArrayList<>())
                    .add(MediaDto.builder().id(mediaId).url(url).fileId(fileId).build());
        }
        
        return result;
    }

    /**
     * Map native query projection row to Response DTO.
     */
    private PostDto.Response mapProjectionToResponse(Object[] row, Map<UUID, List<MediaDto>> mediaByPost, String userEmail) {
        UUID postId = (UUID) row[0];
        String locationName = (String) row[1];
        String textContent = (String) row[2];
        Instant createdAt = toInstant(row[3]);
        int loveCount = ((Number) row[4]).intValue();
        int shareCount = ((Number) row[5]).intValue();
        
        UUID authorId = (UUID) row[6];
        String authorFirstName = (String) row[7];
        String authorLastName = (String) row[8];
        String authorAvatarUrl = (String) row[9];
        String authorRole = (String) row[10];
        boolean authorVerifiedHost = row[11] instanceof Boolean 
                ? (Boolean) row[11] 
                : ((Number) row[11]).intValue() == 1;
        
        UUID homestayId = (UUID) row[12];
        String homestayName = (String) row[13];
        UUID destinationId = (UUID) row[14];
        PostType postType = parsePostType(row[15]);
        UUID originalPostId = (UUID) row[16];
        int commentCount = ((Number) row[17]).intValue();

        // Parse tags from JSON array
        List<String> tags = parseTagsFromJson(row[18]);
        
        AuthorDto author = AuthorDto.builder()
                .id(authorId)
                .name((authorFirstName != null ? authorFirstName : "") 
                        + (authorLastName != null ? " " + authorLastName : ""))
                .role(authorRole)
                .avatarUrl(authorAvatarUrl)
                .isVerifiedHost(authorVerifiedHost)
                .build();
        
        return PostDto.Response.builder()
                .id(postId)
                .author(author)
                .locationName(locationName)
                .textContent(textContent)
                .media(mediaByPost.getOrDefault(postId, java.util.Collections.emptyList()))
                .homestayId(homestayId)
                .homestayName(homestayName)
                .destinationId(destinationId)
                .postType(postType)
                .loveCount(loveCount)
                .shareCount(shareCount)
                .commentCount(commentCount)
                .viewCount(toInt(row[19]))
                .isLikedByCurrentUser(false) // Set by authenticated context if needed
                .isEditorial(toBoolean(row[20]))
                .isFeatured(toBoolean(row[21]))
                .isPinned(toBoolean(row[22]))
                .isTrending(toBoolean(row[23]))
                .trendingScore(toDouble(row[24]))
                .editorialScore(toDouble(row[25]))
                .originalPost(null) // Not loaded in list view for performance
                .createdAt(createdAt)
                .tags(tags)
                .build();
    }
    
    /**
     * Parse tags from PostgreSQL JSON array string.
     */
    private List<String> parseTagsFromJson(Object tagsObj) {
        if (tagsObj == null) {
            return java.util.Collections.emptyList();
        }
        String tagsStr = tagsObj.toString();
        if (tagsStr == null || tagsStr.isBlank() || "[]".equals(tagsStr) || "null".equals(tagsStr)) {
            return java.util.Collections.emptyList();
        }
        // Handle PostgreSQL json_agg output: ["tag1","tag2"]
        try {
            if (tagsStr.startsWith("[") && tagsStr.endsWith("]")) {
                String inner = tagsStr.substring(1, tagsStr.length() - 1);
                if (inner.isBlank()) {
                    return java.util.Collections.emptyList();
                }
                return java.util.Arrays.stream(inner.split(","))
                        .map(s -> s.replace("\"", "").trim())
                        .filter(s -> !s.isBlank())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            // Fall through
        }
        return java.util.Collections.emptyList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", key = "'search-' + #query + '-' + #pageable.pageNumber", sync = true)
    public Page<PostDto.Response> searchPosts(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return getAllPosts(null, pageable);
        }
        // Use optimized projection query - single query for posts + batch load media
        Page<Object[]> postsPage = postRepository.searchPostProjections(query, pageable);
        
        // Extract post IDs for batch queries
        List<UUID> postIds = postsPage.getContent().stream()
                .map(row -> (UUID) row[0])
                .collect(Collectors.toList());
        
        // Batch load media (1 query)
        Map<UUID, List<MediaDto>> mediaByPost = loadMediaByPostIds(postIds);
        
        // Map to DTOs
        List<PostDto.Response> dtos = postsPage.getContent().stream()
                .map(row -> mapProjectionToResponse(row, mediaByPost, null))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtos, pageable, postsPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", key = "'user-' + #email + '-' + #pageable.pageNumber", sync = true)
    public Page<PostDto.Response> getPostsByUser(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Use optimized projection query - single query for posts + batch load media
        Page<Object[]> postsPage = postRepository.findPostProjectionsByUserId(user.getId(), pageable);
        
        // Extract post IDs for batch queries
        List<UUID> postIds = postsPage.getContent().stream()
                .map(row -> (UUID) row[0])
                .collect(Collectors.toList());
        
        // Batch load media (1 query)
        Map<UUID, List<MediaDto>> mediaByPost = loadMediaByPostIds(postIds);
        
        // Map to DTOs
        List<PostDto.Response> dtos = postsPage.getContent().stream()
                .map(row -> mapProjectionToResponse(row, mediaByPost, null))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtos, pageable, postsPage.getTotalElements());
    }

    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#id")
    })
    public PostDto.Response updatePost(java.util.UUID id, PostDto.Request request,
            java.util.List<org.springframework.web.multipart.MultipartFile> files, String userEmail) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        validatePostRequest(request);

        if (!post.getUser().getEmail().equals(userEmail)) {
            User requestor = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Requesting user not found"));
            if (requestor.getRole() != User.Role.ROLE_ADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You do not have permission to update this post.");
            }
        }

        if (request.getLocationName() != null)
            post.setLocationName(request.getLocationName());
        if (request.getTextContent() != null)
            post.setTextContent(request.getTextContent());
        if (request.getTags() != null)
            post.setTags(request.getTags());
        if (request.getPostType() != null)
            post.setPostType(request.getPostType());
        if (request.getDestinationId() != null) {
            post.setDestination(destinationRepository.findById(request.getDestinationId()).orElse(null));
        }
        post.setEditorial(post.getUser().getRole() == User.Role.ROLE_ADMIN);

        // --- CLOUD JANITOR DIFF: Purge images removed by the user ---
        java.util.List<com.nbh.backend.model.MediaResource> finalMergedMedia = new java.util.ArrayList<>();
        java.util.List<String> removedFileIds = new java.util.ArrayList<>();
        if (request.getMedia() != null) {
            java.util.List<com.nbh.backend.model.MediaResource> existingMedia = post.getMediaFiles();
            java.util.List<MediaDto> retainedMediaDtos = request.getMedia();

            // Find fileIds that were in existingMedia but are NOT in retainedMediaDtos
            java.util.Set<String> retainedFileIds = retainedMediaDtos.stream()
                    .map(MediaDto::getFileId)
                    .filter(java.util.Objects::nonNull)
                    .filter(s -> !s.isBlank())
                    .collect(java.util.stream.Collectors.toSet());

            if (existingMedia != null) {
                // Mutate the persistent collection so orphanRemoval deletes DB rows deterministically
                java.util.Iterator<com.nbh.backend.model.MediaResource> it = existingMedia.iterator();
                while (it.hasNext()) {
                    com.nbh.backend.model.MediaResource oldResource = it.next();
                    String oldFileId = oldResource.getFileId();
                    if (oldFileId != null && !retainedFileIds.contains(oldFileId)) {
                        removedFileIds.add(oldFileId);
                        it.remove();
                    }
                }

                // Build the final list to be returned/persisted
                for (com.nbh.backend.model.MediaResource kept : existingMedia) {
                    if (kept.getFileId() != null) {
                        finalMergedMedia.add(kept);
                    }
                }
            }
        } else {
            // If media not provided, keep existing state.
            if (post.getMediaFiles() != null) {
                finalMergedMedia.addAll(post.getMediaFiles());
            }
        }

        // --- Upload NEW files if any ---
        final Post finalPost = post;
        if (files != null && !files.isEmpty()) {
            try {
                java.util.List<com.nbh.backend.model.MediaResource> uploadedResources = imageUploadService
                        .uploadFiles(files, "posts/" + post.getId());
                for (com.nbh.backend.model.MediaResource res : uploadedResources) {
                    res.setPost(finalPost);
                    finalMergedMedia.add(res);
                }
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload new media files", e);
            }
        }

        if (post.getMediaFiles() == null) {
            post.setMediaFiles(new java.util.ArrayList<>());
        }
        post.getMediaFiles().clear();
        post.getMediaFiles().addAll(finalMergedMedia);

        Post saved = postRepository.save(post);
        asyncJobService.enqueueDeleteMedia(removedFileIds);
        asyncJobService.enqueuePostProcessMedia(extractFileIds(request.getMedia()), "posts/" + saved.getId());
        feedCacheService.invalidateAll();
        // Update timeline
        timelineService.insertPostToTimeline(saved);
        return mapToResponse(saved, userEmail);
    }

    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#id")
    })
    public void deletePost(java.util.UUID id, String userEmail) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getEmail().equals(userEmail)) {
            User requestor = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Requesting user not found"));
            if (requestor.getRole() != User.Role.ROLE_ADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You do not have permission to delete this post.");
            }
        }

        // --- CLOUD JANITOR: Purge ImageKit Media before Database Deletion ---
        asyncJobService.enqueueDeleteMedia(post.getMediaFiles() == null ? java.util.List.of()
                : post.getMediaFiles().stream().map(MediaResource::getFileId).toList());

        feedCacheService.invalidateAll();
        // Remove from timeline
        timelineService.deletePostFromTimeline(post.getId());
        postRepository.delete(post);
    }

    // ── Viral Metric Methods ──────────────────────────────────
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#postId")
    })
    public PostDto.LikeResponse toggleLike(java.util.UUID postId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int inserted = 0;
        try {
            // Idempotent ensure-like: a single Postgres UPSERT. No pre-checks.
            inserted = postLikeRepository.insertLikeIgnoreConflict(postId, user.getId());
        } catch (DataIntegrityViolationException e) {
            // Concurrent inserts (or racing DDL) should not bubble as 500.
            inserted = 0;
        }

        if (inserted > 0) {
            postRepository.incrementLoveCount(postId);
        }

        Integer loveCount = postRepository.findLoveCountById(postId);
        int resolvedLoveCount = loveCount == null ? 0 : loveCount;

        feedCacheService.invalidateAll();
        timelineService.updateLikeCount(postId, resolvedLoveCount);
        return PostDto.LikeResponse.builder().loveCount(resolvedLoveCount).isLiked(true).build();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#postId")
    })
    public PostDto.LikeResponse unlike(java.util.UUID postId, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            postLikeRepository.deleteByUserIdAndPostId(user.getId(), postId);
            post.setLoveCount((int) postLikeRepository.countByPostId(postId));
            postRepository.save(post);
            feedCacheService.invalidateAll();
            timelineService.updateLikeCount(postId, post.getLoveCount());
        }

        return PostDto.LikeResponse.builder().loveCount(post.getLoveCount()).isLiked(false).build();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#postId")
    })
    public PostDto.LikeResponse incrementShare(java.util.UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setShareCount(post.getShareCount() + 1);
        postRepository.save(post);
        feedCacheService.invalidateAll();
        // Update timeline share count
        timelineService.updateShareCount(postId, post.getShareCount());
        return PostDto.LikeResponse.builder().loveCount(post.getLoveCount()).isLiked(false).build();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#originalPostId")
    })
    public PostDto.Response repost(java.util.UUID originalPostId, PostDto.Request request,
            java.util.List<org.springframework.web.multipart.MultipartFile> files, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post original = postRepository.findById(originalPostId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Original post not found"));

        original.setShareCount(original.getShareCount() + 1);
        postRepository.save(original);

        Post post = Post.builder()
                .id(java.util.UUID.randomUUID())
                .locationName(
                        request.getLocationName() != null ? request.getLocationName() : original.getLocationName())
                .textContent(request.getTextContent() != null ? request.getTextContent() : "")
                .mediaFiles(request.getMedia() != null ? request.getMedia().stream()
                        .map(dto -> com.nbh.backend.model.MediaResource.builder()
                                .id(dto.getId())
                                .url(dto.getUrl())
                                .fileId(dto.getFileId())
                                .build())
                        .collect(java.util.stream.Collectors.toList()) : new java.util.ArrayList<>())
                .user(user)
                .destination(original.getDestination())
                .originalPost(original)
                .createdAt(Instant.now())
                .postType(request.getPostType() != null ? request.getPostType() : original.getPostType())
                .isEditorial(user.getRole() == User.Role.ROLE_ADMIN)
                .build();

        if (post.getMediaFiles() != null) {
            final Post finalPost = post;
            post.getMediaFiles().forEach(m -> m.setPost(finalPost));
        }

        if (files != null && !files.isEmpty()) {
            try {
                java.util.List<com.nbh.backend.model.MediaResource> uploadedResources = imageUploadService
                        .uploadFiles(files, "posts/" + post.getId());
                for (com.nbh.backend.model.MediaResource res : uploadedResources) {
                    res.setPost(post);
                }
                if (post.getMediaFiles() == null) {
                    post.setMediaFiles(new java.util.ArrayList<>());
                }
                post.getMediaFiles().addAll(uploadedResources);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to upload media files", e);
            }
        }

        Post saved = postRepository.save(post);
        asyncJobService.enqueuePostProcessMedia(extractFileIds(request.getMedia()), "posts/" + saved.getId());
        feedCacheService.invalidateAll();
        return mapToResponse(saved);
    }

    private java.util.List<String> extractFileIds(java.util.List<MediaDto> media) {
        if (media == null || media.isEmpty()) {
            return java.util.List.of();
        }
        return media.stream()
                .map(MediaDto::getFileId)
                .filter(java.util.Objects::nonNull)
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();
    }

    // ── Deep Wipe: Admin-only nuclear option ────────────────────────────────
    /**
     * DEEP WIPE: Deletes ALL posts, comments, likes, and physical media files.
     * This is a nuclear option for admin use only.
     * 
     * Order of operations:
     * 1. Collect ALL media fileIds from posts AND comments
     * 2. Delete physical files from ImageKit
     * 3. Delete all post_likes (separate table, no cascade)
     * 4. Hard delete all posts (bypasses soft delete)
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", allEntries = true),
            @CacheEvict(value = "postComments", allEntries = true),
            @CacheEvict(value = "adminStats", allEntries = true)
    })
    public WipeResult wipeAllPosts(String adminEmail) {
        log.info("[DEEP WIPE] Initiated by admin: {}", adminEmail);
        
        // Verify admin role
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (admin.getRole() != User.Role.ROLE_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Only admins can perform deep wipe");
        }
        
        // Step 1: Collect ALL media fileIds from posts
        List<Post> allPosts = postRepository.findAllIncludingDeleted();
        List<String> allFileIds = new java.util.ArrayList<>();
        
        for (Post post : allPosts) {
            // Post media
            if (post.getMediaFiles() != null) {
                for (MediaResource mr : post.getMediaFiles()) {
                    if (mr.getFileId() != null && !mr.getFileId().isBlank()) {
                        allFileIds.add(mr.getFileId());
                    }
                }
            }
            // Comment media (comments cascade from posts, but we need fileIds first)
            if (post.getComments() != null) {
                for (com.nbh.backend.model.Comment comment : post.getComments()) {
                    if (comment.getMediaFiles() != null) {
                        for (MediaResource mr : comment.getMediaFiles()) {
                            if (mr.getFileId() != null && !mr.getFileId().isBlank()) {
                                allFileIds.add(mr.getFileId());
                            }
                        }
                    }
                }
            }
        }
        
        int totalFileIds = allFileIds.size();
        log.info("[DEEP WIPE] Found {} media files to delete", totalFileIds);
        
        // Step 2: Delete physical files from ImageKit (synchronously for wipe)
        int deletedFileCount = 0;
        int failedFileCount = 0;
        for (String fileId : allFileIds) {
            try {
                imageUploadService.deleteFileById(fileId);
                deletedFileCount++;
            } catch (Exception e) {
                log.warn("[DEEP WIPE] Failed to delete fileId {}: {}", fileId, e.getMessage());
                failedFileCount++;
            }
        }
        log.info("[DEEP WIPE] Deleted {} files from ImageKit, {} failed", deletedFileCount, failedFileCount);
        
        // Step 3: Delete all comment_images (ElementCollection table lacks ON DELETE CASCADE)
        int commentImagesDeleted = commentRepository.deleteAllCommentImages();
        log.info("[DEEP WIPE] Deleted {} comment_images records", commentImagesDeleted);
        
        // Step 4: Delete all media_resources (hardDeleteAll bypasses JPA cascade)
        int mediaResourcesDeleted = mediaResourceRepository.deleteAllAndCount();
        log.info("[DEEP WIPE] Deleted {} media_resources records", mediaResourcesDeleted);
        
        // Step 5: Delete all post_likes (separate table)
        long likesDeleted = postLikeRepository.deleteAllAndGetCount();
        log.info("[DEEP WIPE] Deleted {} post_likes records", likesDeleted);
        
        // Step 6: Clear timeline
        timelineService.clearAll();
        
        // Step 7: Hard delete all posts (bypass soft delete)
        long postsDeleted = postRepository.hardDeleteAll();
        log.info("[DEEP WIPE] Hard deleted {} posts", postsDeleted);
        
        // Step 8: Invalidate all caches
        feedCacheService.invalidateAll();
        
        return WipeResult.builder()
                .postsDeleted(postsDeleted)
                .mediaFilesDeleted(deletedFileCount)
                .mediaFilesFailed(failedFileCount)
                .likesDeleted(likesDeleted)
                .build();
    }
    
    // Result DTO for wipe operation
    @lombok.Data
    @lombok.Builder
    public static class WipeResult {
        private long postsDeleted;
        private int mediaFilesDeleted;
        private int mediaFilesFailed;
        private long likesDeleted;
    }

    // Result DTO for batch wipe operation
    @lombok.Data
    @lombok.Builder
    public static class BatchWipeResult {
        private int deletedCount;
        private boolean hasMore;
        private int mediaFilesDeleted;
        private int mediaFilesFailed;
    }

    // ── Batch Wipe: Admin-only chunked deletion ────────────────────────────────
    /**
     * BATCH WIPE: Deletes a limited batch of posts, comments, likes, and physical media files.
     * Designed to avoid timeouts by processing in manageable chunks.
     * 
     * Order of operations:
     * 1. Fetch a limited batch of posts (including soft-deleted)
     * 2. Collect media fileIds from posts AND their comments
     * 3. Delete physical files from ImageKit
     * 4. Delete likes for these specific posts
     * 5. Delete the posts (cascade handles comments)
     * 6. Clear timeline entries for deleted posts
     * 
     * @param adminEmail Email of the admin performing the wipe
     * @param limit Maximum number of posts to delete in this batch
     * @return BatchWipeResult with deletedCount and hasMore flag
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", allEntries = true),
            @CacheEvict(value = "postComments", allEntries = true),
            @CacheEvict(value = "adminStats", allEntries = true)
    })
    public BatchWipeResult wipePostsBatch(String adminEmail, int limit) {
        log.info("[BATCH WIPE] Initiated by admin: {} with limit: {}", adminEmail, limit);
        
        // Validate limit
        if (limit <= 0 || limit > 100) {
            limit = Math.max(1, Math.min(limit, 100)); // Clamp between 1-100
        }
        
        // Verify admin role
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (admin.getRole() != User.Role.ROLE_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Only admins can perform batch wipe");
        }
        
        // Step 1: Fetch a limited batch of posts (including soft-deleted)
        List<Post> batchPosts = postRepository.findAllIncludingDeletedWithLimit(limit);
        
        if (batchPosts.isEmpty()) {
            log.info("[BATCH WIPE] No posts found to delete");
            feedCacheService.invalidateAll();
            return BatchWipeResult.builder()
                    .deletedCount(0)
                    .hasMore(false)
                    .mediaFilesDeleted(0)
                    .mediaFilesFailed(0)
                    .build();
        }
        
        // Step 2: Collect media fileIds from posts AND their comments
        List<String> fileIds = new java.util.ArrayList<>();
        List<UUID> postIds = new java.util.ArrayList<>();
        
        for (Post post : batchPosts) {
            postIds.add(post.getId());
            
            // Post media
            if (post.getMediaFiles() != null) {
                for (MediaResource mr : post.getMediaFiles()) {
                    if (mr.getFileId() != null && !mr.getFileId().isBlank()) {
                        fileIds.add(mr.getFileId());
                    }
                }
            }
            // Comment media
            if (post.getComments() != null) {
                for (com.nbh.backend.model.Comment comment : post.getComments()) {
                    if (comment.getMediaFiles() != null) {
                        for (MediaResource mr : comment.getMediaFiles()) {
                            if (mr.getFileId() != null && !mr.getFileId().isBlank()) {
                                fileIds.add(mr.getFileId());
                            }
                        }
                    }
                }
            }
        }
        
        log.info("[BATCH WIPE] Batch of {} posts, {} media files to delete", batchPosts.size(), fileIds.size());
        
        // Step 3: Delete physical files from ImageKit
        int deletedFileCount = 0;
        int failedFileCount = 0;
        for (String fileId : fileIds) {
            try {
                imageUploadService.deleteFileById(fileId);
                deletedFileCount++;
            } catch (Exception e) {
                log.warn("[BATCH WIPE] Failed to delete fileId {}: {}", fileId, e.getMessage());
                failedFileCount++;
            }
        }
        log.info("[BATCH WIPE] Deleted {} files from ImageKit, {} failed", deletedFileCount, failedFileCount);
        
        // Step 4: Delete comment_images (ElementCollection table lacks ON DELETE CASCADE)
        // Must be deleted BEFORE comments are removed
        int commentImagesDeleted = commentRepository.deleteCommentImagesByPostIdIn(postIds);
        log.info("[BATCH WIPE] Deleted {} comment_images records", commentImagesDeleted);
        
        // Step 5: Delete media_resources explicitly (deleteAllByIdInBatch bypasses JPA cascade)
        // 5a: Delete comment media first (media_resources.comment_id lacks ON DELETE CASCADE)
        int commentMediaDeleted = mediaResourceRepository.deleteByCommentPostIdIn(postIds);
        log.info("[BATCH WIPE] Deleted {} comment media_resources records", commentMediaDeleted);
        // 5b: Delete post media
        int postMediaDeleted = mediaResourceRepository.deleteByPostIdIn(postIds);
        log.info("[BATCH WIPE] Deleted {} post media_resources records", postMediaDeleted);
        
        // Step 6: Clear timeline entries for these posts (has CASCADE but delete explicitly for safety)
        timelineService.deletePostsFromTimeline(postIds);
        log.info("[BATCH WIPE] Cleared timeline entries for {} posts", postIds.size());
        
        // Step 7: Hard delete the posts (DB cascade handles comments, post_tags, post_likes)
        int postsDeleted = postRepository.hardDeleteByIdIn(postIds);
        log.info("[BATCH WIPE] Hard deleted {} posts", postsDeleted);
        
        // Verify deletion succeeded
        if (postsDeleted == 0 && !postIds.isEmpty()) {
            log.error("[BATCH WIPE] Failed to delete any posts! Possible FK constraint violation.");
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                    "Failed to delete posts - possible database constraint violation");
        }
        
        // Step 8: Check if there are more posts remaining
        long remainingCount = postRepository.countIncludingDeleted();
        boolean hasMore = remainingCount > 0;
        
        log.info("[BATCH WIPE] Batch complete. {} posts deleted, {} remaining, hasMore: {}", 
                postIds.size(), remainingCount, hasMore);
        
        // Step 9: Invalidate all caches
        feedCacheService.invalidateAll();
        
        return BatchWipeResult.builder()
                .deletedCount(postIds.size())
                .hasMore(hasMore)
                .mediaFilesDeleted(deletedFileCount)
                .mediaFilesFailed(failedFileCount)
                .build();
    }

    // ── Mapping Helper ────────────────────────────────────────
    private PostDto.Response mapToResponse(Post post) {
        return mapToResponse(post, null);
    }

    private PostDto.Response mapToResponse(Post post, String userEmail) {
        return mapToResponse(post, userEmail, true);
    }

    private PostDto.Response mapToResponse(Post post, String userEmail, boolean includeRepost) {
        boolean isLiked = false;
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                isLiked = postLikeRepository.existsByUserIdAndPostId(user.getId(), post.getId());
            }
        }

        PostDto.Response originalPostDto = null;
        if (includeRepost && post.getOriginalPost() != null) {
            originalPostDto = mapToResponse(post.getOriginalPost(), userEmail, false); // prevent infinite recursion
        }

        List<com.nbh.backend.model.MediaResource> combinedMedia = new java.util.ArrayList<>();
        if (post.getMediaFiles() != null) {
            combinedMedia.addAll(post.getMediaFiles());
        }
        // Fallback for Legacy Images
        if (post.getLegacyImageUrls() != null && !post.getLegacyImageUrls().isEmpty() && combinedMedia.isEmpty()) {
            for (String url : post.getLegacyImageUrls()) {
                combinedMedia.add(com.nbh.backend.model.MediaResource.builder().url(url).build());
            }
        }

        AuthorDto author = AuthorDto.builder()
                .id(post.getUser().getId())
                .name(post.getUser().getFirstName()
                        + (post.getUser().getLastName() != null ? " " + post.getUser().getLastName() : ""))
                .role(post.getUser().getRole().name())
                .avatarUrl(post.getUser().getAvatarUrl())
                .isVerifiedHost(post.getUser().isVerifiedHost())
                .build();
        List<MediaDto> dtoMedia = combinedMedia.stream()
                .map(m -> MediaDto.builder().id(m.getId()).url(m.getUrl()).fileId(m.getFileId()).build())
                .collect(java.util.stream.Collectors.toList());

        // Define homestay and authorName for the builder, assuming they are derived
        // from 'post' and 'author'
        // as per the original structure and the provided snippet's context.
        com.nbh.backend.model.Homestay homestay = post.getHomestay();
        String authorName = post.getUser().getFirstName()
                + (post.getUser().getLastName() != null ? " " + post.getUser().getLastName() : "");

        return PostDto.Response.builder()
                .id(post.getId())
                .author(author)
                .locationName(post.getLocationName())
                .textContent(post.getTextContent())
                .media(dtoMedia)
                .homestayId(homestay != null ? homestay.getId() : null)
                .homestayName(homestay != null ? homestay.getName() : null)
                .destinationId(post.getDestination() != null ? post.getDestination().getId() : null)
                .postType(post.getPostType())
                .loveCount(post.getLoveCount())
                .shareCount(post.getShareCount())
                .commentCount(postRepository.countCommentsByPostId(post.getId()))
                .viewCount(post.getViewCount())
                .isLikedByCurrentUser(isLiked)
                .isEditorial(post.isEditorial())
                .isFeatured(post.isFeatured())
                .isPinned(post.isPinned())
                .isTrending(post.isTrending())
                .trendingScore(post.getTrendingScore())
                .editorialScore(post.getEditorialScore())
                .originalPost(originalPostDto)
                .createdAt(post.getCreatedAt())
                .tags(post.getTags() == null ? java.util.List.of() : new java.util.ArrayList<>(post.getTags()))
                .build();
    }

    private void validatePostRequest(PostDto.Request request) {
        if (request == null) {
            return;
        }
        if (request.getTags() == null) {
            return;
        }
        var invalid = request.getTags().stream()
                .filter(tag -> !VibeTag.isAllowed(tag))
                .collect(Collectors.toCollection(HashSet::new));
        if (!invalid.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid vibe tags: " + String.join(", ", invalid));
        }
    }

    private Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant();
        }
        if (value instanceof java.time.LocalDateTime localDateTime) {
            return localDateTime.toInstant(java.time.ZoneOffset.UTC);
        }
        return Instant.parse(value.toString());
    }

    private PostType parsePostType(Object value) {
        if (value == null) {
            return null;
        }
        return PostType.fromValue(value.toString());
    }

    private boolean toBoolean(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        if (value instanceof Number number) {
            return number.intValue() != 0;
        }
        return Boolean.parseBoolean(value.toString());
    }

    private int toInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private double toDouble(Object value) {
        return value instanceof Number number ? number.doubleValue() : 0d;
    }
}
