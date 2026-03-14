package com.nbh.backend.service;

import com.nbh.backend.model.Post;
import com.nbh.backend.model.PostTimeline;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.TimelineRepository;
import com.nbh.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for managing the timeline hot window.
 * Implements Instagram-style optimization: only last 1000 posts are kept.
 * 
 * Fan-out strategy:
 * - Since no follow system exists, we use a global timeline
 * - All posts are inserted into the single timeline
 * - Timeline is pruned every 100 inserts (not every insert)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TimelineService {

    private final TimelineRepository timelineRepository;
    private final PostRepository postRepository;
    
    private static final int HOT_WINDOW_SIZE = 1000;
    private static final int PRUNE_INTERVAL = 100;
    private static final int BACKFILL_BATCH_SIZE = 100;
    
    // Counter for prune interval
    private final AtomicInteger insertCounter = new AtomicInteger(0);

    /**
     * Insert a post into the timeline (synchronous for create, async for updates).
     * Denormalizes author and post data for index-only scans.
     */
    @Transactional
    public void insertPostToTimeline(Post post) {
        if (post == null || post.getId() == null) {
            return;
        }
        
        User author = post.getUser();
        if (author == null) {
            log.warn("Cannot insert post {} to timeline: no author", post.getId());
            return;
        }
        
        String authorName = buildAuthorName(author);
        String homestayName = post.getHomestay() != null ? post.getHomestay().getName() : null;
        
        try {
            timelineRepository.upsertTimelineEntry(
                    post.getId(),
                    post.getCreatedAt(),
                    author.getId(),
                    authorName,
                    author.getAvatarUrl(),
                    author.getRole().name(),
                    author.isVerifiedHost(),
                    post.getTextContent(),
                    post.getHomestay() != null ? post.getHomestay().getId() : null,
                    homestayName,
                    post.getOriginalPost() != null ? post.getOriginalPost().getId() : null,
                    post.getLoveCount(),
                    post.getShareCount()
            );
            
            log.debug("Inserted post {} to timeline", post.getId());
            
            // Prune every 100 inserts, not every insert
            if (insertCounter.incrementAndGet() >= PRUNE_INTERVAL) {
                insertCounter.set(0);
                pruneTimeline();
            }
        } catch (Exception e) {
            log.error("Failed to insert post {} to timeline: {}", post.getId(), e.getMessage());
        }
    }
    
    /**
     * Async insert for non-critical updates.
     */
    @Async
    @Transactional
    public void insertPostToTimelineAsync(Post post) {
        insertPostToTimeline(post);
    }

    /**
     * Soft delete a post from timeline.
     */
    @Transactional
    public void deletePostFromTimeline(UUID postId) {
        if (postId == null) {
            return;
        }
        
        try {
            timelineRepository.softDeleteByPostId(postId);
            log.debug("Soft deleted post {} from timeline", postId);
        } catch (Exception e) {
            log.error("Failed to delete post {} from timeline: {}", postId, e.getMessage());
        }
    }

    /**
     * Update like count in timeline.
     */
    @Transactional
    public void updateLikeCount(UUID postId, int likeCount) {
        if (postId == null) {
            return;
        }
        
        try {
            timelineRepository.updateLikeCount(postId, likeCount);
            log.debug("Updated like count for post {} to {}", postId, likeCount);
        } catch (Exception e) {
            log.error("Failed to update like count for post {}: {}", postId, e.getMessage());
        }
    }

    /**
     * Update share count in timeline.
     */
    @Transactional
    public void updateShareCount(UUID postId, int shareCount) {
        if (postId == null) {
            return;
        }
        
        try {
            timelineRepository.updateShareCount(postId, shareCount);
            log.debug("Updated share count for post {} to {}", postId, shareCount);
        } catch (Exception e) {
            log.error("Failed to update share count for post {}: {}", postId, e.getMessage());
        }
    }

    /**
     * Prune timeline to hot window size.
     * Keeps only the newest 1000 posts.
     */
    @Transactional
    public void pruneTimeline() {
        try {
            long count = timelineRepository.countByIsDeletedFalse();
            if (count > HOT_WINDOW_SIZE) {
                timelineRepository.pruneToHotWindow();
                log.debug("Pruned timeline from {} to {} entries", count, HOT_WINDOW_SIZE);
            }
        } catch (Exception e) {
            log.error("Failed to prune timeline: {}", e.getMessage());
        }
    }

    /**
     * Check if timeline is populated (for fallback detection).
     */
    @Transactional(readOnly = true)
    public boolean hasTimelineEntries() {
        return timelineRepository.hasTimelineEntries();
    }

    /**
     * Backfill timeline with missing posts.
     * Called on startup or via admin endpoint to sync existing posts.
     * 
     * @return Number of posts backfilled
     */
    @Transactional
    public int backfillTimeline() {
        log.info("Starting timeline backfill...");
        int backfilled = 0;
        
        try {
            // Get all posts that don't have timeline entries
            List<Post> postsWithoutTimeline = postRepository.findPostsNotInTimeline();
            
            for (Post post : postsWithoutTimeline) {
                try {
                    insertPostToTimeline(post);
                    backfilled++;
                    
                    // Log progress every 100 posts
                    if (backfilled % BACKFILL_BATCH_SIZE == 0) {
                        log.info("Backfilled {} posts to timeline", backfilled);
                    }
                } catch (Exception e) {
                    log.warn("Failed to backfill post {}: {}", post.getId(), e.getMessage());
                }
            }
            
            log.info("Timeline backfill complete. Backfilled {} posts", backfilled);
        } catch (Exception e) {
            log.error("Timeline backfill failed: {}", e.getMessage());
        }
        
        return backfilled;
    }

    /**
     * Build author display name.
     */
    private String buildAuthorName(User author) {
        StringBuilder name = new StringBuilder(author.getFirstName());
        if (author.getLastName() != null && !author.getLastName().isBlank()) {
            name.append(" ").append(author.getLastName());
        }
        return name.toString();
    }

    /**
     * Clear all timeline entries (for deep wipe).
     */
    @Transactional
    public void clearAll() {
        try {
            timelineRepository.deleteAll();
            log.info("[DEEP WIPE] Cleared all timeline entries");
        } catch (Exception e) {
            log.error("Failed to clear timeline: {}", e.getMessage());
        }
    }

    /**
     * Delete multiple posts from timeline (for batch wipe).
     */
    @Transactional
    public void deletePostsFromTimeline(List<UUID> postIds) {
        if (postIds == null || postIds.isEmpty()) {
            return;
        }
        
        try {
            timelineRepository.deleteByPostIdIn(postIds);
            log.debug("[BATCH WIPE] Deleted {} posts from timeline", postIds.size());
        } catch (Exception e) {
            log.error("Failed to delete {} posts from timeline: {}", postIds.size(), e.getMessage());
        }
    }
}
