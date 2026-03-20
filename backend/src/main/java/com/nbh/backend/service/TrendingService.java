package com.nbh.backend.service;

import com.nbh.backend.model.Post;
import com.nbh.backend.model.PostTrendingHistory;
import com.nbh.backend.repository.PostRepository;
import com.nbh.backend.repository.PostTrendingHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrendingService {

    private static final int TRENDING_LIMIT = 20;

    private final PostRepository postRepository;
    private final PostTrendingHistoryRepository postTrendingHistoryRepository;
    private final FeedCacheService feedCacheService;

    @Transactional
    public void refreshTrendingScores() {
        List<Post> posts = postRepository.findAll();
        Instant now = Instant.now();
        List<PostTrendingHistory> snapshots = new java.util.ArrayList<>(posts.size());

        for (Post post : posts) {
            int comments = postRepository.countCommentsByPostId(post.getId());
            double score = calculateScore(post, comments, now);
            post.setTrendingScore(score);
            post.setTrendingComputedAt(now);
            post.setTrending(score > 0);
            snapshots.add(PostTrendingHistory.builder()
                    .postId(post.getId())
                    .trendingScore(score)
                    .computedAt(now)
                    .build());
        }

        List<Post> ranked = posts.stream()
                .sorted(Comparator.comparingDouble(Post::getTrendingScore).reversed()
                        .thenComparing(Post::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        for (int i = 0; i < ranked.size(); i++) {
            ranked.get(i).setTrending(i < TRENDING_LIMIT && ranked.get(i).getTrendingScore() > 0);
        }

        postRepository.saveAll(posts);
        postTrendingHistoryRepository.saveAll(snapshots);
        feedCacheService.invalidateAll();
    }

    /**
     * Update trending score for a single post by ID directly from DB.
     * Prevents stale state from memory.
     */
    @Transactional
    public void updateTrendingScoreByPostId(java.util.UUID postId) {
        Post post = postRepository.findById(postId).orElseThrow();
        updatePostTrendingScore(post);
    }

    /**
     * Update trending score for a single post (called on engagement events).
     * Uses stored comment_count from post entity.
     */
    @Transactional
    public void updatePostTrendingScore(Post post) {
        Instant now = Instant.now();
        int commentCount = post.getCommentCount();
        double score = calculateScore(post, commentCount, now);
        
        postRepository.updateTrendingData(post.getId(), score, now, score > 0);
        feedCacheService.invalidateAll();
    }

    private double calculateScore(Post post, int commentCount, Instant now) {
        Instant createdAt = post.getCreatedAt() == null ? now : post.getCreatedAt();
        double ageHours = Math.max(1.0, Duration.between(createdAt, now).toHours());
        double engagement = (post.getLoveCount() * 3.0)
                + (commentCount * 4.0)
                + (post.getShareCount() * 5.0)
                + (post.getViewCount() * 0.2);
        double recencyBoost = 24.0 / ageHours;
        return Math.max(0d, engagement + recencyBoost);
    }
}
