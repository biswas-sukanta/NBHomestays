package com.nbh.backend.service;

import com.nbh.backend.dto.PostFeedDto;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * No-operation implementation of FeedCacheService.
 * Used when Redis caching is not yet configured or desired.
 * All operations are pass-through with no caching.
 */
@Service
public class NoOpFeedCacheService implements FeedCacheService {

    @Override
    public Optional<PostFeedDto.FeedResponse> get(String key) {
        return Optional.empty();
    }

    @Override
    public void put(String key, PostFeedDto.FeedResponse response) {
        // No-op: does not cache
    }

    @Override
    public void invalidateAll() {
        // No-op: nothing to invalidate
    }
}
