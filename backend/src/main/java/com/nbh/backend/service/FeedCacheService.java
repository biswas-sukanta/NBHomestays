package com.nbh.backend.service;

import com.nbh.backend.dto.PostFeedDto;
import java.util.Optional;

/**
 * Cache abstraction for community feed.
 * Current implementation: NoOp (no caching).
 * Future implementation: Redis with 5s TTL.
 * 
 * This abstraction allows the feed service to remain decoupled from
 * the cache infrastructure, enabling safe rollout without Redis dependency.
 */
public interface FeedCacheService {

    /**
     * Get cached feed response for the given key.
     * 
     * @param key Cache key (e.g., "community:feed:{tag}:{cursor}")
     * @return Cached response if present, empty otherwise
     */
    Optional<PostFeedDto.FeedResponse> get(String key);

    /**
     * Store feed response in cache.
     * 
     * @param key Cache key
     * @param response Feed response to cache
     */
    void put(String key, PostFeedDto.FeedResponse response);

    /**
     * Invalidate all feed cache entries.
     * Called on post create/update/delete/like/comment/repost.
     */
    void invalidateAll();

    /**
     * Generate cache key for feed query.
     * Includes userId to prevent cache pollution across users.
     * 
     * @param tag Optional tag filter
     * @param cursor Optional cursor (null for first page)
     * @param limit Page size
     * @param userId Optional user ID for personalized like status
     * @return Cache key string
     */
    default String generateKey(String tag, String cursor, int limit, java.util.UUID userId) {
        StringBuilder sb = new StringBuilder("community:feed:");
        sb.append(tag != null && !tag.isBlank() ? tag : "all");
        sb.append(":");
        sb.append(cursor != null ? cursor : "first");
        sb.append(":");
        sb.append(limit);
        sb.append(":");
        sb.append(userId != null ? userId.toString() : "anon");
        return sb.toString();
    }
    
    /**
     * Generate cache key for feed query (backward compatible).
     * 
     * @param tag Optional tag filter
     * @param cursor Optional cursor (null for first page)
     * @param limit Page size
     * @return Cache key string
     */
    default String generateKey(String tag, String cursor, int limit) {
        return generateKey(tag, cursor, limit, null);
    }
}
