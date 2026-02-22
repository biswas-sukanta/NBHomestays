package com.nbh.backend.service;

import com.nbh.backend.dto.PostDto;
import com.nbh.backend.model.Post;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final com.nbh.backend.repository.HomestayRepository homestayRepository;

    @CacheEvict(value = "postsList", allEntries = true)
    public PostDto.Response createPost(PostDto.Request request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.nbh.backend.model.Homestay homestay = null;
        if (request.getHomestayId() != null) {
            homestay = homestayRepository.findById(request.getHomestayId())
                    .orElseThrow(() -> new RuntimeException("Homestay not found"));
        }

        Post post = Post.builder()
                .user(user)
                .locationName(request.getLocationName())
                .textContent(request.getTextContent())
                .imageUrls(request.getImageUrls())
                .homestay(homestay)
                .createdAt(LocalDateTime.now())
                .build();

        Post saved = postRepository.save(post);
        return mapToResponse(saved);
    }

    @Cacheable(value = "postDetail", key = "#id", sync = true)
    public java.util.Optional<PostDto.Response> getPostById(java.util.UUID id) {
        return postRepository.findById(id).map(this::mapToResponse);
    }

    @Cacheable(value = "postsList", sync = true)
    public List<PostDto.Response> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "postsList", sync = true)
    public List<PostDto.Response> searchPosts(String query) {
        if (query == null || query.isBlank()) {
            return getAllPosts();
        }
        return postRepository.findByLocationNameContainingIgnoreCaseOrderByCreatedAtDesc(query).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "postsList", sync = true)
    public List<PostDto.Response> getPostsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByUser(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#id")
    })
    public PostDto.Response updatePost(java.util.UUID id, PostDto.Request request, String userEmail) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getEmail().equals(userEmail)) { // No admin override for posts mentioned, but could add if
                                                            // needed
            throw new RuntimeException("Unauthorized");
        }

        if (request.getLocationName() != null)
            post.setLocationName(request.getLocationName());
        if (request.getTextContent() != null)
            post.setTextContent(request.getTextContent());
        if (request.getImageUrls() != null)
            post.setImageUrls(request.getImageUrls());

        Post saved = postRepository.save(post);
        return mapToResponse(saved);
    }

    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "postDetail", key = "#id")
    })
    public void deletePost(java.util.UUID id, String userEmail) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        postRepository.delete(post);
    }

    private PostDto.Response mapToResponse(Post post) {
        return PostDto.Response.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .userName(post.getUser().getFirstName() + " " + post.getUser().getLastName())
                .locationName(post.getLocationName())
                .textContent(post.getTextContent())
                .imageUrls(post.getImageUrls())
                .homestayId(post.getHomestay() != null ? post.getHomestay().getId() : null)
                .homestayName(post.getHomestay() != null ? post.getHomestay().getName() : null)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
