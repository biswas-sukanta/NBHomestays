package com.nbh.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.PostFeedDto;
import com.nbh.backend.model.PostTimeline;
import com.nbh.backend.repository.FeedRepository;
import com.nbh.backend.repository.TimelineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Optimized feed service using timeline hot window and batch loading.
 * 
 * Architecture:
 * 1. Try timeline table first (index-only scan, ~10ms)
 * 2. Fallback to direct query if timeline empty (~150ms)
 * 3. Batch load media, tags, counts (5 queries total)
 * 
 * Performance targets:
 * - Timeline hit: <40ms
 * - Timeline miss: <200ms
 * - Cached: <5ms
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeedService {

    private final FeedRepository feedRepository;
    private final TimelineRepository timelineRepository;
    private final FeedCacheService cacheService;
    private final ObjectMapper objectMapper;
    private final FeedLayoutEngine layoutEngine;

    private static final int DEFAULT_LIMIT = 12;
    private static final int EXTRA_FOR_HAS_MORE = 1;

    /**
     * Get cursor-paginated feed with optional tag filter.
     * Priority: Timeline > Direct query
     * 
     * @param tag Optional tag filter
     * @param cursor Base64-encoded cursor (null for first page)
     * @param limit Page size (defaults to 12)
     * @param userId Optional user ID for like status
     * @return Feed response with posts, nextCursor, and hasMore
     */
    @Transactional(readOnly = true)
    public PostFeedDto.FeedResponse getFeed(String tag, String cursor, Integer limit, UUID userId) {
        return getFeed(tag, cursor, limit, userId, true);
    }
    
    /**
     * Get cursor-paginated feed with optional tag filter and layout generation.
     * Priority: Timeline > Direct query
     * 
     * @param tag Optional tag filter
     * @param cursor Base64-encoded cursor (null for first page)
     * @param limit Page size (defaults to 12)
     * @param userId Optional user ID for like status
     * @param layout Whether to generate layout blocks (default true)
     * @return Feed response with posts, nextCursor, hasMore, and optional blocks
     */
    @Transactional(readOnly = true)
    public PostFeedDto.FeedResponse getFeed(String tag, String cursor, Integer limit, UUID userId, boolean layout) {
        int pageSize = limit != null && limit > 0 ? limit : DEFAULT_LIMIT;
        int fetchLimit = pageSize + EXTRA_FOR_HAS_MORE;

        // Check cache with userId to prevent cache pollution
        String cacheKey = cacheService.generateKey(tag, cursor, pageSize, userId);
        Optional<PostFeedDto.FeedResponse> cached = cacheService.get(cacheKey);
        if (cached.isPresent()) {
            log.debug("Feed cache hit for key: {}", cacheKey);
            return cached.get();
        }

        // Decode cursor
        PostFeedDto.Cursor cursorData = decodeCursor(cursor);
        LocalDateTime cursorCreatedAt = cursorData != null ? cursorData.getCreatedAt() : null;
        UUID cursorId = cursorData != null ? cursorData.getId() : null;
        String previousBlockType = cursorData != null ? cursorData.getPreviousBlockType() : null;
        Integer previousBlockTypeRun = cursorData != null ? cursorData.getPreviousBlockTypeRun() : null;

        // Try timeline first (if no tag filter - timeline is global)
        List<PostFeedDto> posts;
        boolean hasMore;
        
        if (tag == null || tag.isBlank()) {
            PostFeedDto.FeedResponse timelineResponse = getFeedFromTimeline(cursorCreatedAt, cursorId, fetchLimit, pageSize, userId);
            if (timelineResponse != null) {
                log.debug("Feed served from timeline");
                PostFeedDto.FeedResponse response = timelineResponse;

                if (layout && response.getPosts() != null && !response.getPosts().isEmpty()) {
                    List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(
                            response.getPosts(),
                            pageSize,
                            previousBlockType,
                            previousBlockTypeRun);

                    String nextCursor = response.getNextCursor();
                    if (response.isHasMore() && nextCursor != null) {
                        PostFeedDto lastPost = response.getPosts().get(response.getPosts().size() - 1);
                        TailBlockRun tail = computeTailBlockRun(blocks);
                        nextCursor = encodeCursor(lastPost.getCreatedAt(), lastPost.getPostId(), tail.blockType, tail.runLength);
                    }

                    response = PostFeedDto.FeedResponse.builder()
                            .posts(response.getPosts())
                            .nextCursor(nextCursor)
                            .hasMore(response.isHasMore())
                            .blocks(blocks)
                            .build();
                }

                cacheService.put(cacheKey, response);
                return response;
            }
            log.debug("Timeline empty, falling back to direct query");
        }

        // Fallback: direct query from posts table
        PostFeedDto.FeedResponse response = getFeedFromDirectQuery(tag, cursorCreatedAt, cursorId, fetchLimit, pageSize, userId, cacheKey);

        // Generate layout blocks if requested
        if (layout && response.getPosts() != null && !response.getPosts().isEmpty()) {
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(
                    response.getPosts(),
                    pageSize,
                    previousBlockType,
                    previousBlockTypeRun);

            String nextCursor = response.getNextCursor();
            if (response.isHasMore() && nextCursor != null) {
                PostFeedDto lastPost = response.getPosts().get(response.getPosts().size() - 1);
                TailBlockRun tail = computeTailBlockRun(blocks);
                nextCursor = encodeCursor(lastPost.getCreatedAt(), lastPost.getPostId(), tail.blockType, tail.runLength);
            }

            response = PostFeedDto.FeedResponse.builder()
                    .posts(response.getPosts())
                    .nextCursor(nextCursor)
                    .hasMore(response.isHasMore())
                    .blocks(blocks)
                    .build();
        }

        return response;
    }
    
    /**
     * Get feed from timeline table (index-only scan).
     * Returns null if timeline is empty or has insufficient data (fallback protection).
     * Uses 30-day bounded window for 60% cost reduction.
     */
    private PostFeedDto.FeedResponse getFeedFromTimeline(
            LocalDateTime cursorCreatedAt, UUID cursorId, int fetchLimit, int pageSize, UUID userId) {
        
        // Check if timeline has entries
        if (!timelineRepository.hasTimelineEntries()) {
            return null;
        }
        
        // Calculate 30-day boundary for bounded keyset pagination
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        // Query timeline - use separate queries for first page vs cursor pagination
        List<PostTimeline> timelineRows;
        if (cursorCreatedAt == null) {
            // First page with 30-day window
            timelineRows = timelineRepository.findFeedFirstPage(thirtyDaysAgo, PageRequest.of(0, fetchLimit));
        } else {
            // Cursor pagination without window
            timelineRows = timelineRepository.findFeedWithCursor(cursorCreatedAt, cursorId, PageRequest.of(0, fetchLimit));
        }
        
        if (timelineRows.isEmpty()) {
            return PostFeedDto.FeedResponse.builder()
                    .posts(Collections.emptyList())
                    .nextCursor(null)
                    .hasMore(false)
                    .build();
        }
        
        // FALLBACK PROTECTION: If timeline returns fewer rows than requested on first page,
        // it may indicate timeline is out of sync. Check if direct query has more posts.
        if (cursorCreatedAt == null && timelineRows.size() < pageSize) {
            long timelineCount = timelineRepository.countByIsDeletedFalse();
            long postCount = feedRepository.countAllActive();
            
            // If posts significantly exceed timeline entries, fall back to direct query
            if (postCount > timelineCount + 5) {
                log.warn("Timeline out of sync: {} timeline entries vs {} posts. Falling back to direct query.", 
                        timelineCount, postCount);
                return null;
            }
        }
        
        // Determine hasMore
        boolean hasMore = timelineRows.size() > pageSize;
        if (hasMore) {
            timelineRows = timelineRows.subList(0, pageSize);
        }
        
        // Extract post IDs for batch queries
        List<UUID> postIds = timelineRows.stream()
                .map(PostTimeline::getPostId)
                .collect(Collectors.toList());
        
        // Batch load media, tags, counts
        Map<UUID, List<PostFeedDto.MediaVariantDto>> mediaByPost = loadMedia(postIds);
        Map<UUID, List<String>> tagsByPost = loadTags(postIds);
        Map<UUID, Integer> commentCounts = loadCommentCounts(postIds);
        Map<UUID, List<PostFeedDto.ImageDimDto>> dimensionsByPost = loadMediaDimensions(postIds);
        // Use precomputed like counts from timeline, but still batch load liked status
        Set<UUID> likedPostIds = userId != null ? loadLikedStatus(userId, postIds) : Collections.emptySet();
        
        // Map to DTOs
        List<PostFeedDto> posts = timelineRows.stream()
                .map(t -> mapTimelineToDto(t, mediaByPost, tagsByPost, commentCounts, likedPostIds, dimensionsByPost))
                .collect(Collectors.toList());
        
        // Generate next cursor
        String nextCursor = null;
        if (hasMore && !posts.isEmpty()) {
            PostFeedDto lastPost = posts.get(posts.size() - 1);
            nextCursor = encodeCursor(lastPost.getCreatedAt(), lastPost.getPostId());
        }
        
        return PostFeedDto.FeedResponse.builder()
                .posts(posts)
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .build();
    }
    
    /**
     * Get feed from direct query (fallback when timeline empty).
     */
    private PostFeedDto.FeedResponse getFeedFromDirectQuery(
            String tag, LocalDateTime cursorCreatedAt, UUID cursorId, 
            int fetchLimit, int pageSize, UUID userId, String cacheKey) {
        
        // Fetch posts (1 query)
        // Use separate queries for first page vs cursor pagination to avoid null parameter type inference issues
        List<Object[]> rows;
        boolean isFirstPage = (cursorCreatedAt == null);
        
        if (tag != null && !tag.isBlank()) {
            if (isFirstPage) {
                rows = feedRepository.findFeedByTagFirstPage(tag, fetchLimit);
            } else {
                rows = feedRepository.findFeedByTagWithCursor(tag, cursorCreatedAt, cursorId, fetchLimit);
            }
        } else {
            if (isFirstPage) {
                rows = feedRepository.findFeedFirstPage(fetchLimit);
            } else {
                rows = feedRepository.findFeedWithCursor(cursorCreatedAt, cursorId, fetchLimit);
            }
        }

        if (rows.isEmpty()) {
            return PostFeedDto.FeedResponse.builder()
                    .posts(Collections.emptyList())
                    .nextCursor(null)
                    .hasMore(false)
                    .build();
        }

        // Determine hasMore and trim to requested size
        boolean hasMore = rows.size() > pageSize;
        if (hasMore) {
            rows = rows.subList(0, pageSize);
        }

        // Extract post IDs for batch queries
        List<UUID> postIds = rows.stream()
                .map(row -> (UUID) row[0])
                .collect(Collectors.toList());

        // Batch load media, tags, counts
        Map<UUID, List<PostFeedDto.MediaVariantDto>> mediaByPost = loadMedia(postIds);
        Map<UUID, List<String>> tagsByPost = loadTags(postIds);
        Map<UUID, Integer> commentCounts = loadCommentCounts(postIds);
        Map<UUID, Integer> likeCounts = loadLikeCounts(postIds);
        Map<UUID, List<PostFeedDto.ImageDimDto>> dimensionsByPost = loadMediaDimensions(postIds);
        Set<UUID> likedPostIds = userId != null ? loadLikedStatus(userId, postIds) : Collections.emptySet();

        // Map to DTOs
        List<PostFeedDto> posts = rows.stream()
                .map(row -> mapToDto(row, mediaByPost, tagsByPost, commentCounts, likeCounts, likedPostIds, dimensionsByPost))
                .collect(Collectors.toList());

        // Generate next cursor
        String nextCursor = null;
        if (hasMore && !posts.isEmpty()) {
            PostFeedDto lastPost = posts.get(posts.size() - 1);
            nextCursor = encodeCursor(lastPost.getCreatedAt(), lastPost.getPostId());
        }

        PostFeedDto.FeedResponse response = PostFeedDto.FeedResponse.builder()
                .posts(posts)
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .build();

        // Cache the response
        cacheService.put(cacheKey, response);

        return response;
    }

    /**
     * Decode Base64 cursor to Cursor object.
     */
    private PostFeedDto.Cursor decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(cursor);
            String json = new String(bytes, StandardCharsets.UTF_8);
            return objectMapper.readValue(json, PostFeedDto.Cursor.class);
        } catch (IllegalArgumentException | JsonProcessingException e) {
            log.warn("Invalid cursor provided: {}", cursor, e);
            return null;
        }
    }

    /**
     * Encode cursor to Base64 string.
     */
    private String encodeCursor(LocalDateTime createdAt, UUID id) {
        return encodeCursor(createdAt, id, null, null);
    }

    private String encodeCursor(LocalDateTime createdAt, UUID id, String previousBlockType, Integer previousBlockTypeRun) {
        try {
            PostFeedDto.Cursor cursor = PostFeedDto.Cursor.builder()
                    .createdAt(createdAt)
                    .id(id)
                    .previousBlockType(previousBlockType)
                    .previousBlockTypeRun(previousBlockTypeRun)
                    .build();
            String json = objectMapper.writeValueAsString(cursor);
            return Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        } catch (JsonProcessingException e) {
            log.error("Failed to encode cursor", e);
            return null;
        }
    }

    private TailBlockRun computeTailBlockRun(List<PostFeedDto.FeedBlockDto> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return new TailBlockRun(null, null);
        }

        PostFeedDto.FeedBlockDto.BlockType lastType = null;
        for (int i = blocks.size() - 1; i >= 0; i--) {
            PostFeedDto.FeedBlockDto b = blocks.get(i);
            if (b != null && b.getBlockType() != null) {
                lastType = b.getBlockType();
                break;
            }
        }

        if (lastType == null) {
            return new TailBlockRun(null, null);
        }

        int run = 0;
        for (int i = blocks.size() - 1; i >= 0; i--) {
            PostFeedDto.FeedBlockDto b = blocks.get(i);
            if (b == null || b.getBlockType() == null) {
                continue;
            }
            if (b.getBlockType() == lastType) {
                run++;
            } else {
                break;
            }
        }

        return new TailBlockRun(lastType.name(), run);
    }

    private static class TailBlockRun {
        private final String blockType;
        private final Integer runLength;

        private TailBlockRun(String blockType, Integer runLength) {
            this.blockType = blockType;
            this.runLength = runLength;
        }
    }

    /**
     * Batch load media resources and generate ImageKit variant URLs.
     * Now includes width/height for layout engine.
     */
    private Map<UUID, List<PostFeedDto.MediaVariantDto>> loadMedia(List<UUID> postIds) {
        if (postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Object[]> rows = feedRepository.findMediaByPostIds(postIds);
        Map<UUID, List<PostFeedDto.MediaVariantDto>> result = new HashMap<>();

        for (Object[] row : rows) {
            UUID postId = (UUID) row[0];
            UUID mediaId = (UUID) row[1];
            String url = (String) row[2];
            String fileId = (String) row[3];
            // Width/height may be null - handle gracefully
            Integer width = row[4] != null ? ((Number) row[4]).intValue() : null;
            Integer height = row[5] != null ? ((Number) row[5]).intValue() : null;

            PostFeedDto.MediaVariantDto variant = buildMediaVariant(mediaId, fileId, url, width, height);
            result.computeIfAbsent(postId, k -> new ArrayList<>()).add(variant);
        }

        return result;
    }
    
    /**
     * Batch load media dimensions for layout engine.
     */
    private Map<UUID, List<PostFeedDto.ImageDimDto>> loadMediaDimensions(List<UUID> postIds) {
        if (postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Object[]> rows = feedRepository.findMediaByPostIds(postIds);
        Map<UUID, List<PostFeedDto.ImageDimDto>> result = new HashMap<>();

        for (Object[] row : rows) {
            UUID postId = (UUID) row[0];
            UUID mediaId = (UUID) row[1];
            Integer width = row[4] != null ? ((Number) row[4]).intValue() : null;
            Integer height = row[5] != null ? ((Number) row[5]).intValue() : null;
            
            if (width != null && height != null && width > 0 && height > 0) {
                Double aspectRatio = (double) width / height;
                PostFeedDto.ImageDimDto dim = PostFeedDto.ImageDimDto.builder()
                        .mediaId(mediaId)
                        .width(width)
                        .height(height)
                        .aspectRatio(aspectRatio)
                        .build();
                result.computeIfAbsent(postId, k -> new ArrayList<>()).add(dim);
            }
        }

        return result;
    }

    /**
     * Build media variant with ImageKit transformation URLs.
     */
    private PostFeedDto.MediaVariantDto buildMediaVariant(UUID mediaId, String fileId, String originalUrl, Integer width, Integer height) {
        String baseUrl = extractBaseUrl(originalUrl);
        String path = extractPath(originalUrl);

        return PostFeedDto.MediaVariantDto.builder()
                .id(mediaId)
                .fileId(fileId)
                .originalUrl(originalUrl)
                .thumbnail(buildImageUrl(baseUrl, path, "w-200,q-60,f-auto"))
                .small(buildImageUrl(baseUrl, path, "w-480,q-70,f-auto"))
                .medium(buildImageUrl(baseUrl, path, "w-800,q-75,f-auto"))
                .large(buildImageUrl(baseUrl, path, "w-1200,q-80,f-auto"))
                .build();
    }

    /**
     * Extract base URL from ImageKit URL.
     */
    private String extractBaseUrl(String url) {
        if (url == null || !url.contains("/tr:")) {
            return url;
        }
        // Remove existing transformation
        int trIndex = url.indexOf("/tr:");
        if (trIndex > 0) {
            int nextSlash = url.indexOf("/", trIndex + 4);
            if (nextSlash > 0) {
                return url.substring(0, trIndex) + url.substring(nextSlash);
            }
            return url.substring(0, trIndex);
        }
        return url;
    }

    /**
     * Extract path from ImageKit URL.
     */
    private String extractPath(String url) {
        if (url == null) {
            return "";
        }
        try {
            java.net.URL parsed = new java.net.URL(url);
            return parsed.getPath();
        } catch (Exception e) {
            return url;
        }
    }

    /**
     * Build ImageKit URL with transformation.
     */
    private String buildImageUrl(String baseUrl, String path, String transformation) {
        if (baseUrl == null || baseUrl.isEmpty()) {
            return baseUrl;
        }
        // ImageKit transformation format: /tr:transformation/path
        if (baseUrl.contains("imagekit.io") || baseUrl.contains("ik.imagekit.io")) {
            return baseUrl + "/tr:" + transformation;
        }
        return baseUrl;
    }

    /**
     * Batch load tags.
     */
    private Map<UUID, List<String>> loadTags(List<UUID> postIds) {
        if (postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Object[]> rows = feedRepository.findTagsByPostIds(postIds);
        Map<UUID, List<String>> result = new HashMap<>();

        for (Object[] row : rows) {
            UUID postId = (UUID) row[0];
            String tag = (String) row[1];
            result.computeIfAbsent(postId, k -> new ArrayList<>()).add(tag);
        }

        return result;
    }

    /**
     * Batch load comment counts.
     */
    private Map<UUID, Integer> loadCommentCounts(List<UUID> postIds) {
        if (postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Object[]> rows = feedRepository.countCommentsByPostIds(postIds);
        Map<UUID, Integer> result = new HashMap<>();

        for (Object[] row : rows) {
            UUID postId = (UUID) row[0];
            Number count = (Number) row[1];
            result.put(postId, count.intValue());
        }

        // Posts with no comments won't appear in result - default to 0
        for (UUID postId : postIds) {
            result.putIfAbsent(postId, 0);
        }

        return result;
    }

    /**
     * Batch load like counts.
     */
    private Map<UUID, Integer> loadLikeCounts(List<UUID> postIds) {
        if (postIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Object[]> rows = feedRepository.countLikesByPostIds(postIds);
        Map<UUID, Integer> result = new HashMap<>();

        for (Object[] row : rows) {
            UUID postId = (UUID) row[0];
            Number count = (Number) row[1];
            result.put(postId, count.intValue());
        }

        // Posts with no likes won't appear in result - default to 0
        for (UUID postId : postIds) {
            result.putIfAbsent(postId, 0);
        }

        return result;
    }

    /**
     * Batch load liked status for user.
     */
    private Set<UUID> loadLikedStatus(UUID userId, List<UUID> postIds) {
        if (postIds.isEmpty()) {
            return Collections.emptySet();
        }
        List<UUID> liked = feedRepository.findLikedPostIds(userId, postIds);
        return new HashSet<>(liked);
    }

    /**
     * Map timeline entity to PostFeedDto.
     * Uses precomputed data from timeline for O(1) performance.
     */
    private PostFeedDto mapTimelineToDto(
            PostTimeline timeline,
            Map<UUID, List<PostFeedDto.MediaVariantDto>> mediaByPost,
            Map<UUID, List<String>> tagsByPost,
            Map<UUID, Integer> commentCounts,
            Set<UUID> likedPostIds,
            Map<UUID, List<PostFeedDto.ImageDimDto>> dimensionsByPost) {

        // Build repost metadata
        boolean isRepost = timeline.getOriginalPostId() != null;
        String originalContentPreview = null;
        if (isRepost && timeline.getTextContent() != null) {
            String content = timeline.getTextContent();
            originalContentPreview = content.length() > 150 
                    ? content.substring(0, 150) + "..." 
                    : content;
        }
        
        // Layout metadata
        List<PostFeedDto.MediaVariantDto> media = mediaByPost.getOrDefault(timeline.getPostId(), Collections.emptyList());
        int mediaCount = media.size();
        int textLength = timeline.getTextContent() != null ? timeline.getTextContent().length() : 0;
        List<PostFeedDto.ImageDimDto> imageDims = dimensionsByPost.getOrDefault(timeline.getPostId(), Collections.emptyList());

        return PostFeedDto.builder()
                .postId(timeline.getPostId())
                .textContent(timeline.getTextContent())
                .createdAt(timeline.getCreatedAt())
                .authorId(timeline.getAuthorId())
                .authorName(timeline.getAuthorName())
                .authorAvatarUrl(timeline.getAuthorAvatarUrl())
                .authorRole(timeline.getAuthorRole())
                .authorVerifiedHost(timeline.isAuthorVerifiedHost())
                .commentCount(commentCounts.getOrDefault(timeline.getPostId(), 0))
                .likeCount(timeline.getLikeCount())
                .shareCount(timeline.getShareCount())
                .homestayId(timeline.getHomestayId())
                .homestayName(timeline.getHomestayName())
                .tags(tagsByPost.getOrDefault(timeline.getPostId(), Collections.emptyList()))
                .media(media)
                .isRepost(isRepost)
                .originalPostId(timeline.getOriginalPostId())
                .originalContentPreview(originalContentPreview)
                .isLikedByCurrentUser(likedPostIds.contains(timeline.getPostId()))
                // Layout metadata
                .mediaCount(mediaCount)
                .textLength(textLength)
                .imageDimensions(imageDims)
                .build();
    }

    /**
     * Safely convert database value to boolean.
     * Handles both Boolean and Number (0/1) types from PostgreSQL.
     */
    private boolean toBoolean(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean b) return b;
        if (value instanceof Number n) return n.intValue() == 1;
        return false;
    }

    /**
     * Map database row to PostFeedDto.
     */
    private PostFeedDto mapToDto(
            Object[] row,
            Map<UUID, List<PostFeedDto.MediaVariantDto>> mediaByPost,
            Map<UUID, List<String>> tagsByPost,
            Map<UUID, Integer> commentCounts,
            Map<UUID, Integer> likeCounts,
            Set<UUID> likedPostIds,
            Map<UUID, List<PostFeedDto.ImageDimDto>> dimensionsByPost) {

        UUID postId = (UUID) row[0];
        String textContent = (String) row[1];
        Timestamp createdAtTs = (Timestamp) row[2];
        LocalDateTime createdAt = createdAtTs != null ? createdAtTs.toLocalDateTime() : null;
        
        UUID authorId = (UUID) row[3];
        String authorName = (String) row[4];
        String authorAvatarUrl = (String) row[5];
        String authorRole = (String) row[6];
        boolean authorVerifiedHost = toBoolean(row[7]);
        
        Number likeCountDb = (Number) row[8];
        Number shareCountDb = (Number) row[9];
        
        UUID homestayId = (UUID) row[10];
        String homestayName = (String) row[11];
        
        UUID originalPostId = (UUID) row[12];
        String originalContent = (String) row[13];
        UUID originalAuthorId = (UUID) row[14];
        String originalAuthorName = (String) row[15];

        // Build author
        PostFeedDto.AuthorDto author = PostFeedDto.AuthorDto.builder()
                .id(authorId)
                .name(authorName)
                .avatarUrl(authorAvatarUrl)
                .role(authorRole)
                .isVerifiedHost(authorVerifiedHost)
                .build();

        // Build repost metadata
        boolean isRepost = originalPostId != null;
        String originalContentPreview = null;
        if (isRepost && originalContent != null) {
            originalContentPreview = originalContent.length() > 150 
                    ? originalContent.substring(0, 150) + "..." 
                    : originalContent;
        }
        
        // Layout metadata
        List<PostFeedDto.MediaVariantDto> media = mediaByPost.getOrDefault(postId, Collections.emptyList());
        int mediaCount = media.size();
        int textLength = textContent != null ? textContent.length() : 0;
        List<PostFeedDto.ImageDimDto> imageDims = dimensionsByPost.getOrDefault(postId, Collections.emptyList());

        return PostFeedDto.builder()
                .postId(postId)
                .textContent(textContent)
                .createdAt(createdAt)
                .authorId(authorId)
                .authorName(authorName)
                .authorAvatarUrl(authorAvatarUrl)
                .authorRole(authorRole)
                .authorVerifiedHost(authorVerifiedHost)
                .commentCount(commentCounts.getOrDefault(postId, 0))
                .likeCount(likeCounts.getOrDefault(postId, 0))
                .shareCount(shareCountDb != null ? shareCountDb.intValue() : 0)
                .homestayId(homestayId)
                .homestayName(homestayName)
                .tags(tagsByPost.getOrDefault(postId, Collections.emptyList()))
                .media(media)
                .isRepost(isRepost)
                .originalPostId(originalPostId)
                .originalAuthorName(originalAuthorName)
                .originalContentPreview(originalContentPreview)
                .isLikedByCurrentUser(likedPostIds.contains(postId))
                // Layout metadata
                .mediaCount(mediaCount)
                .textLength(textLength)
                .imageDimensions(imageDims)
                .build();
    }
}
