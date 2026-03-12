package com.nbh.backend.service;

import com.nbh.backend.dto.PostDto;
import com.nbh.backend.dto.AuthorDto;
import com.nbh.backend.dto.MediaDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.MediaResource;
import com.nbh.backend.model.Post;
import com.nbh.backend.model.PostLike;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.PostLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final HomestayRepository homestayRepository;
    private final PostLikeRepository postLikeRepository;
    private final ImageUploadService imageUploadService;
    private final AsyncJobService asyncJobService;
    private final FeedCacheService feedCacheService;
    private final TimelineService timelineService;

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

        Homestay homestay = null;
        if (request.getHomestayId() != null) {
            homestay = homestayRepository.findById(request.getHomestayId()).orElse(null);
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
                .originalPost(originalPost)
                .createdAt(LocalDateTime.now())
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
    @Cacheable(value = "postDetail", key = "#id", sync = true)
    public java.util.Optional<PostDto.Response> getPostById(java.util.UUID id) {
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
        java.time.LocalDateTime createdAt = row[3] instanceof java.time.LocalDateTime 
                ? (java.time.LocalDateTime) row[3] 
                : ((java.sql.Timestamp) row[3]).toLocalDateTime();
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
        UUID originalPostId = (UUID) row[14];
        int commentCount = ((Number) row[15]).intValue();
        
        // Parse tags from JSON array
        List<String> tags = parseTagsFromJson(row[16]);
        
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
                .loveCount(loveCount)
                .shareCount(shareCount)
                .commentCount(commentCount)
                .isLikedByCurrentUser(false) // Set by authenticated context if needed
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
        Page<Post> postsPage = postRepository.findByLocationNameContainingIgnoreCase(query, pageable);
        List<PostDto.Response> dtos = postsPage.getContent().stream()
                .map(p -> mapToResponse(p, null))
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, postsPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", key = "'user-' + #email + '-' + #pageable.pageNumber", sync = true)
    public Page<PostDto.Response> getPostsByUser(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Page<Post> postsPage = postRepository.findByUser(user, pageable);
        List<PostDto.Response> dtos = postsPage.getContent().stream()
                .map(p -> mapToResponse(p, null))
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
        // 1. Fetch the actual Post entity
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        // 2. Fetch the actual User entity explicitly from the DB to attach to Hibernate
        // session
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isLiked;
        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            postLikeRepository.deleteByUserIdAndPostId(user.getId(), postId);
            post.setLoveCount(Math.max(0, post.getLoveCount() - 1));
            isLiked = false;
        } else {
            // 3. Perform the Like logic using the explicitly fetched entities
            PostLike newLike = new PostLike();
            newLike.setPostId(postId);
            newLike.setUserId(user.getId());
            postLikeRepository.save(newLike);
            post.setLoveCount(post.getLoveCount() + 1);
            isLiked = true;
        }
        postRepository.save(post);
        feedCacheService.invalidateAll();
        // Update timeline like count
        timelineService.updateLikeCount(postId, post.getLoveCount());
        return PostDto.LikeResponse.builder().loveCount(post.getLoveCount()).isLiked(isLiked).build();
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
                .createdAt(LocalDateTime.now())
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
                .loveCount(post.getLoveCount())
                .shareCount(post.getShareCount())
                .commentCount(post.getComments() != null ? post.getComments().size() : 0)
                .isLikedByCurrentUser(isLiked)
                .originalPost(originalPostDto)
                .createdAt(post.getCreatedAt())
                .tags(post.getTags() == null ? java.util.List.of() : new java.util.ArrayList<>(post.getTags()))
                .build();
    }
}
