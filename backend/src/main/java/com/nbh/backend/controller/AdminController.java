package com.nbh.backend.controller;

import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.UserRepository;
import com.nbh.backend.model.Homestay;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class AdminController {

    private final HomestayRepository homestayRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @GetMapping("/hello")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> sayHello() {
        return ResponseEntity.ok("Hello Admin");
    }

    /** Platform-wide analytics for the admin dashboard */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long totalHomestays = homestayRepository.count();
        long pendingHomestays = homestayRepository.countByStatus(Homestay.Status.PENDING);
        long approvedHomestays = homestayRepository.countByStatus(Homestay.Status.APPROVED);
        long featuredHomestays = homestayRepository.countByFeaturedTrue();

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalPosts", totalPosts,
                "totalHomestays", totalHomestays,
                "pendingHomestays", pendingHomestays,
                "approvedHomestays", approvedHomestays,
                "featuredHomestays", featuredHomestays));
    }

    /** Admin-only force-delete any post (for moderation) */
    @DeleteMapping("/posts/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Caching(evict = {
            @CacheEvict(value = "postsList", allEntries = true),
            @CacheEvict(value = "adminStats", allEntries = true)
    })
    public ResponseEntity<Void> adminDeletePost(@PathVariable("id") UUID id) {
        if (!postRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /** Toggle featured status on a homestay */
    @PutMapping("/homestays/{id}/feature")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Caching(evict = {
            @CacheEvict(value = "homestay", key = "#p0"),
            @CacheEvict(value = "homestaysSearch", allEntries = true)
    })
    public ResponseEntity<Map<String, Object>> toggleFeatured(@PathVariable("id") UUID id) {
        Homestay homestay = homestayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        boolean newState = !Boolean.TRUE.equals(homestay.getFeatured());
        homestay.setFeatured(newState);
        homestayRepository.save(homestay);
        return ResponseEntity.ok(Map.of("id", id, "featured", newState));
    }
}
