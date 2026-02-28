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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
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
    private final com.nbh.backend.repository.HomestayRepository homestayRepository;
    private final com.nbh.backend.repository.PostLikeRepository postLikeRepository;
    private final ImageUploadService imageUploadService;

    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true)
    })
    public PostDto.Response createPost(PostDto.Request request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.nbh.backend.model.Homestay homestay = null;
        if (request.getHomestayId() != null) {
            homestay = homestayRepository.findById(request.getHomestayId()).orElse(null);
        }

        Post originalPost = null;
        if (request.getOriginalPostId() != null) {
            originalPost = postRepository.findById(request.getOriginalPostId()).orElse(null);
        }

        Post post = Post.builder()
                .locationName(request.getLocationName())
                .textContent(request.getTextContent())
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

        Post saved = postRepository.save(post);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postDetail", key = "#id", sync = true)
    public java.util.Optional<PostDto.Response> getPostById(java.util.UUID id) {
        return postRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", key = "#pageable.pageNumber + '-' + #pageable.pageSize", sync = true)
    public Page<PostDto.Response> getAllPosts(Pageable pageable) {
        Page<Post> postsPage = postRepository.findAll(pageable);
        List<PostDto.Response> dtos = postsPage.getContent().stream()
                .map(p -> mapToResponse(p, null))
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, postsPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", key = "'search-' + #query + '-' + #pageable.pageNumber", sync = true)
    public Page<PostDto.Response> searchPosts(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return getAllPosts(pageable);
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
    public PostDto.Response updatePost(java.util.UUID id, PostDto.Request request, String userEmail) {
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

        // --- CLOUD JANITOR DIFF: Purge images removed by the user ---
        if (request.getMedia() != null) {
            java.util.List<com.nbh.backend.model.MediaResource> existingMedia = post.getMediaFiles();
            java.util.List<MediaDto> newMedia = request.getMedia();

            if (existingMedia != null) {
                // Find fileIds that were in existingMedia but are NOT in newMedia
                java.util.Set<String> newFileIds = newMedia.stream()
                        .map(MediaDto::getFileId)
                        .filter(java.util.Objects::nonNull)
                        .collect(java.util.stream.Collectors.toSet());

                for (com.nbh.backend.model.MediaResource oldResource : existingMedia) {
                    String oldFileId = oldResource.getFileId();
                    if (oldFileId != null && !newFileIds.contains(oldFileId)) {
                        System.out.println("--- CLOUD JANITOR (UPDATE DIFF): Deleting orphaned File ID: " + oldFileId);
                        imageUploadService.deleteFile(oldFileId);
                    }
                }
            }
            final Post finalPost = post;
            java.util.List<com.nbh.backend.model.MediaResource> entityMedia = newMedia.stream()
                    .map(dto -> com.nbh.backend.model.MediaResource.builder()
                            .id(dto.getId())
                            .url(dto.getUrl())
                            .fileId(dto.getFileId())
                            .post(finalPost)
                            .build())
                    .collect(java.util.stream.Collectors.toList());

            if (post.getMediaFiles() == null) {
                post.setMediaFiles(new java.util.ArrayList<>());
            }
            post.getMediaFiles().clear();
            post.getMediaFiles().addAll(entityMedia);
        }

        Post saved = postRepository.save(post);
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
        if (post.getMediaFiles() != null && !post.getMediaFiles().isEmpty()) {
            System.out.println("--- CLOUD JANITOR INITIATED ---");
            for (com.nbh.backend.model.MediaResource media : post.getMediaFiles()) {
                System.out.println("Preparing to delete File ID: " + media.getFileId());
                imageUploadService.deleteFile(media.getFileId());
                System.out.println("Successfully purged File ID: " + media.getFileId() + " from cloud storage.");
            }
        }

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
        return PostDto.LikeResponse.builder().loveCount(post.getLoveCount()).isLiked(false).build();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#originalPostId")
    })
    public PostDto.Response repost(java.util.UUID originalPostId, PostDto.Request request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post original = postRepository.findById(originalPostId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Original post not found"));

        original.setShareCount(original.getShareCount() + 1);
        postRepository.save(original);

        Post post = Post.builder()
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

        Post saved = postRepository.save(post);
        return mapToResponse(saved);
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
                .build();
    }
}
