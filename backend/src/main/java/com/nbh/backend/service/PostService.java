package com.nbh.backend.service;

import com.nbh.backend.dto.PostDto;
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
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final com.nbh.backend.repository.HomestayRepository homestayRepository;
    private final com.nbh.backend.repository.PostLikeRepository postLikeRepository;

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
                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new java.util.ArrayList<>())
                .user(user)
                .homestay(homestay)
                .originalPost(originalPost)
                .createdAt(LocalDateTime.now()) // Kept this from original, as snippet removed it but instruction didn't
                                                // say to.
                .build();

        Post saved = postRepository.save(post);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postDetail", key = "#id", sync = true)
    public java.util.Optional<PostDto.Response> getPostById(java.util.UUID id) {
        return postRepository.findById(id).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", sync = true)
    public List<PostDto.Response> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> mapToResponse(p, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", sync = true)
    public List<PostDto.Response> searchPosts(String query) {
        if (query == null || query.isBlank()) {
            return getAllPosts();
        }
        return postRepository.findByLocationNameContainingIgnoreCaseOrderByCreatedAtDesc(query).stream()
                .map(p -> mapToResponse(p, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "postsList", sync = true)
    public List<PostDto.Response> getPostsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByUser(user).stream()
                .map(p -> mapToResponse(p, null))
                .collect(Collectors.toList());
    }

    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#id")
    })
    public PostDto.Response updatePost(java.util.UUID id, PostDto.Request request, String userEmail) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to update this post.");
        }

        if (request.getLocationName() != null)
            post.setLocationName(request.getLocationName());
        if (request.getTextContent() != null)
            post.setTextContent(request.getTextContent());
        if (request.getImageUrls() != null)
            post.setImageUrls(request.getImageUrls());

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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete this post.");
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
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isLiked;
        if (postLikeRepository.existsByUserIdAndPostId(user.getId(), postId)) {
            postLikeRepository.deleteByUserIdAndPostId(user.getId(), postId);
            post.setLoveCount(Math.max(0, post.getLoveCount() - 1));
            isLiked = false;
        } else {
            postLikeRepository.save(PostLike.builder().userId(user.getId()).postId(postId).build());
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
                .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new java.util.ArrayList<>())
                .user(user)
                .originalPost(original)
                .createdAt(LocalDateTime.now())
                .build();

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

        return PostDto.Response.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .userName(post.getUser().getFirstName() + " " + post.getUser().getLastName())
                .locationName(post.getLocationName())
                .textContent(post.getTextContent())
                .imageUrls(post.getImageUrls())
                .homestayId(post.getHomestay() != null ? post.getHomestay().getId() : null)
                .homestayName(post.getHomestay() != null ? post.getHomestay().getName() : null)
                .loveCount(post.getLoveCount())
                .shareCount(post.getShareCount())
                .commentCount(post.getComments() != null ? post.getComments().size() : 0)
                .isLikedByCurrentUser(isLiked)
                .originalPost(originalPostDto)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
