package com.nbh.backend.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.nbh.backend.dto.PostFeedDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * In-memory cache implementation for feed responses using Caffeine.
 * Redis-free alternative with superior performance.
 * 
 * Features:
 * - High-performance Caffeine cache (better than ConcurrentHashMap)
 * - 5 second TTL (configurable)
 * - Maximum 10,000 entries
 * - Automatic eviction based on size and expiration
 * - Thread-safe by design
 */
@Primary
@Service
@Slf4j
public class InMemoryFeedCacheService implements FeedCacheService {

    private final Cache<String, PostFeedDto.FeedResponse> cache;
    
    public InMemoryFeedCacheService() {
        this.cache = Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterWrite(5, TimeUnit.SECONDS)
                .recordStats() // Enable stats for monitoring
                .build();
    }

    @Override
    public Optional<PostFeedDto.FeedResponse> get(String key) {
        PostFeedDto.FeedResponse response = cache.getIfPresent(key);
        if (response != null) {
            log.debug("Cache hit for key: {} (stats: {})", key, cache.stats());
            return Optional.of(response);
        }
        log.debug("Cache miss for key: {}", key);
        return Optional.empty();
    }

    @Override
    public void put(String key, PostFeedDto.FeedResponse response) {
        cache.put(key, response);
        log.debug("Cached feed response for key: {}", key);
    }

    @Override
    public void invalidateAll() {
        long size = cache.estimatedSize();
        cache.invalidateAll();
        log.debug("Invalidated {} cache entries", size);
    }
    
    /**
     * Get cache stats for monitoring.
     */
    public String getStats() {
        var stats = cache.stats();
        return String.format("hits=%d, misses=%d, hitRate=%.2f%%, evictions=%d, size=%d",
                stats.hitCount(),
                stats.missCount(),
                stats.hitRate() * 100,
                stats.evictionCount(),
                cache.estimatedSize());
    }
    
    /**
     * Get current cache size.
     */
    public long size() {
        return cache.estimatedSize();
    }
}
