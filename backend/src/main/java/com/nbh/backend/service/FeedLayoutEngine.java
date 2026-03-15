package com.nbh.backend.service;

import com.nbh.backend.dto.PostFeedDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Editorial layout engine for community feed.
 * Generates FeedBlockDto assignments based on post metadata.
 * 
 * Design principles:
 * - Deterministic: same input produces same output
 * - Balanced: avoid consecutive same block types
 * - Adaptive: handle low-content scenarios gracefully
 * - Performance: O(n) algorithm
 */
@Service
@Slf4j
public class FeedLayoutEngine {

    // PHOTO block type: for single-image posts (renamed from PHOTO_STORY for clarity)
    private static final int PHOTO_MAX_TEXT_LENGTH = 100;
    private static final int COLLAGE_MIN_IMAGES = 2;

    private static final int MAX_POSTS_PER_AUTHOR = 2;
    private static final int MAX_CONSECUTIVE_BLOCK_TYPE = 2;
    private static final int MAX_SAME_TAG_CLUSTER = 3;
    
    // Editorial pattern for balanced visual rhythm
    private static final PostFeedDto.FeedBlockDto.BlockType[] EDITORIAL_PATTERN = {
        PostFeedDto.FeedBlockDto.BlockType.FEATURED,
        PostFeedDto.FeedBlockDto.BlockType.STANDARD,
        PostFeedDto.FeedBlockDto.BlockType.STANDARD,
        PostFeedDto.FeedBlockDto.BlockType.COLLAGE,
        PostFeedDto.FeedBlockDto.BlockType.STANDARD,
        PostFeedDto.FeedBlockDto.BlockType.PHOTO,
        PostFeedDto.FeedBlockDto.BlockType.STANDARD,
    };

    /**
     * Generate layout blocks from posts.
     * 
     * @param posts List of posts with layout metadata populated
     * @param pageSize Requested page size (used for low-content detection)
     * @return List of FeedBlockDto representing the editorial layout
     */
    public List<PostFeedDto.FeedBlockDto> generateLayout(List<PostFeedDto> posts, int pageSize) {
        return generateLayout(posts, pageSize, null, null);
    }

    /**
     * Generate layout blocks with pagination stability context.
     * 
     * @param previousBlockType Name of the last blockType from previous page (nullable)
     * @param previousBlockTypeRun Consecutive run length of previousBlockType at end of previous page (nullable)
     */
    public List<PostFeedDto.FeedBlockDto> generateLayout(
            List<PostFeedDto> posts,
            int pageSize,
            String previousBlockType,
            Integer previousBlockTypeRun) {
        if (posts == null || posts.isEmpty()) {
            return generateEmptyLayout();
        }

        int postCount = posts.size();
        log.debug("Generating layout for {} posts (pageSize={}, previousBlockType={}, previousRun={})",
                postCount, pageSize, previousBlockType, previousBlockTypeRun);

        // Handle low-content scenarios
        if (postCount < 3) {
            return generateLowContentLayout(posts);
        }

        PostFeedDto.FeedBlockDto.BlockType lastAssigned = parseBlockType(previousBlockType);
        int consecutiveTypeRun = previousBlockTypeRun != null ? previousBlockTypeRun : 0;
        String lastPrimaryTag = null;
        int sameTagRun = 0;

        Map<UUID, Integer> authorCounts = new HashMap<>();

        // Score posts deterministically
        List<ScoredPost> candidates = posts.stream()
                .map(this::scorePost)
                .sorted(Comparator
                        .comparingInt(ScoredPost::getScore).reversed()
                        .thenComparing((ScoredPost sp) -> sp.getPost().getCreatedAt(), Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ScoredPost::getPostId, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toCollection(ArrayList::new));

        List<PostFeedDto.FeedBlockDto> blocks = new ArrayList<>();

        int position = 0;
        while (!candidates.isEmpty()) {
            PostFeedDto.FeedBlockDto.BlockType preferred = EDITORIAL_PATTERN[position % EDITORIAL_PATTERN.length];

            ScoredPost picked = pickNextCandidate(candidates, authorCounts, lastPrimaryTag, sameTagRun);
            if (picked == null) {
                // Should not happen, but fail safe: pick next remaining
                picked = candidates.remove(0);
            }

            PostFeedDto.FeedBlockDto.BlockType assignedType = selectBlockType(picked, preferred, lastAssigned);

            // Enforce max consecutive block type
            if (lastAssigned != null && assignedType == lastAssigned && consecutiveTypeRun >= MAX_CONSECUTIVE_BLOCK_TYPE) {
                assignedType = forceDifferentBlockType(picked.getPost(), assignedType);
            }

            PostFeedDto.FeedBlockDto block = createBlock(picked.getPost(), assignedType, blocks.size());
            blocks.add(block);

            // Update diversity counters
            UUID authorId = picked.getPost().getAuthorId();
            if (authorId != null) {
                authorCounts.put(authorId, authorCounts.getOrDefault(authorId, 0) + 1);
            }

            String primaryTag = getPrimaryTag(picked.getPost());
            if (primaryTag != null && primaryTag.equals(lastPrimaryTag)) {
                sameTagRun++;
            } else {
                lastPrimaryTag = primaryTag;
                sameTagRun = primaryTag != null ? 1 : 0;
            }

            if (lastAssigned != null && assignedType == lastAssigned) {
                consecutiveTypeRun++;
            } else {
                lastAssigned = assignedType;
                consecutiveTypeRun = 1;
            }

            position++;
        }

        // Ensure positions are sequential
        for (int i = 0; i < blocks.size(); i++) {
            PostFeedDto.FeedBlockDto block = blocks.get(i);
            if (block.getBlockPosition() != i) {
                blocks.set(i, PostFeedDto.FeedBlockDto.builder()
                        .blockId(block.getBlockId())
                        .blockType(block.getBlockType())
                        .blockPosition(i)
                        .blockPriority(block.getBlockPriority())
                        .postIds(block.getPostIds())
                        .renderHints(block.getRenderHints())
                        .build());
            }
        }

        log.debug("Generated {} blocks with types: {}", blocks.size(),
                blocks.stream().map(b -> b.getBlockType().name()).collect(Collectors.toList()));

        return blocks;
    }
    
    /**
     * Score a post for priority assignment.
     * Higher score = more likely to get featured/collage treatment.
     */
    private ScoredPost scorePost(PostFeedDto post) {
        // Deterministic scoring formula (no randomness)
        int likeCount = post.getLikeCount();
        int commentCount = post.getCommentCount();
        int shareCount = post.getShareCount();
        int helpfulCount = post.getHelpfulCount() != null ? post.getHelpfulCount() : 0;
        int mediaCount = post.getMediaCount() != null ? post.getMediaCount() :
                (post.getMedia() != null ? post.getMedia().size() : 0);
        int postPriority = post.getPostPriority() != null ? post.getPostPriority() : 0;

        // Updated formula with helpfulCount (weight 3.0)
        int score = (likeCount * 2)
                + (commentCount * 3)
                + (shareCount * 4)
                + (helpfulCount * 3)
                + (mediaCount * 2)
                + postPriority;

        return new ScoredPost(post, score);
    }
    
    /**
     * Select block type based on post characteristics and editorial rules.
     */
    private PostFeedDto.FeedBlockDto.BlockType selectBlockType(
            ScoredPost scored, 
            PostFeedDto.FeedBlockDto.BlockType preferred,
            PostFeedDto.FeedBlockDto.BlockType lastAssigned) {
        
        PostFeedDto post = scored.getPost();
        int mediaCount = post.getMediaCount() != null ? post.getMediaCount() : 
                (post.getMedia() != null ? post.getMedia().size() : 0);
        int textLength = post.getTextLength() != null ? post.getTextLength() : 
                (post.getTextContent() != null ? post.getTextContent().length() : 0);
        
        // COLLAGE requires multiple images
        if (preferred == PostFeedDto.FeedBlockDto.BlockType.COLLAGE && mediaCount < COLLAGE_MIN_IMAGES) {
            return PostFeedDto.FeedBlockDto.BlockType.STANDARD;
        }
        
        // PHOTO requires short text (image-focused posts)
        if (preferred == PostFeedDto.FeedBlockDto.BlockType.PHOTO && textLength > PHOTO_MAX_TEXT_LENGTH) {
            return PostFeedDto.FeedBlockDto.BlockType.STANDARD;
        }
        
        // FEATURED/HERO are allowed for highest-scoring posts; preferred determines the rhythm.
        
        // Avoid consecutive same types (except STANDARD)
        if (preferred == lastAssigned && preferred != PostFeedDto.FeedBlockDto.BlockType.STANDARD) {
            // Try to find alternative
            if (mediaCount >= COLLAGE_MIN_IMAGES) {
                return PostFeedDto.FeedBlockDto.BlockType.COLLAGE;
            }
            if (textLength <= PHOTO_MAX_TEXT_LENGTH && mediaCount > 0) {
                return PostFeedDto.FeedBlockDto.BlockType.PHOTO;
            }
            return PostFeedDto.FeedBlockDto.BlockType.STANDARD;
        }
        
        return preferred;
    }

    private PostFeedDto.FeedBlockDto.BlockType parseBlockType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return PostFeedDto.FeedBlockDto.BlockType.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String getPrimaryTag(PostFeedDto post) {
        if (post == null || post.getTags() == null || post.getTags().isEmpty()) {
            return null;
        }
        return post.getTags().get(0);
    }

    private ScoredPost pickNextCandidate(
            List<ScoredPost> candidates,
            Map<UUID, Integer> authorCounts,
            String lastPrimaryTag,
            int sameTagRun) {
        for (int i = 0; i < candidates.size(); i++) {
            ScoredPost sp = candidates.get(i);
            PostFeedDto post = sp.getPost();

            UUID authorId = post.getAuthorId();
            int authorCount = authorId != null ? authorCounts.getOrDefault(authorId, 0) : 0;
            if (authorId != null && authorCount >= MAX_POSTS_PER_AUTHOR) {
                continue;
            }

            String primaryTag = getPrimaryTag(post);
            if (primaryTag != null && primaryTag.equals(lastPrimaryTag) && sameTagRun >= MAX_SAME_TAG_CLUSTER) {
                continue;
            }

            return candidates.remove(i);
        }

        // If all violate constraints, relax and pick next best
        return candidates.isEmpty() ? null : candidates.remove(0);
    }

    private PostFeedDto.FeedBlockDto.BlockType forceDifferentBlockType(
            PostFeedDto post,
            PostFeedDto.FeedBlockDto.BlockType current) {
        int mediaCount = post.getMediaCount() != null ? post.getMediaCount() :
                (post.getMedia() != null ? post.getMedia().size() : 0);
        int textLength = post.getTextLength() != null ? post.getTextLength() :
                (post.getTextContent() != null ? post.getTextContent().length() : 0);

        if (current != PostFeedDto.FeedBlockDto.BlockType.COLLAGE && mediaCount >= COLLAGE_MIN_IMAGES) {
            return PostFeedDto.FeedBlockDto.BlockType.COLLAGE;
        }
        if (current != PostFeedDto.FeedBlockDto.BlockType.PHOTO
                && textLength <= PHOTO_MAX_TEXT_LENGTH
                && mediaCount > 0) {
            return PostFeedDto.FeedBlockDto.BlockType.PHOTO;
        }
        if (current != PostFeedDto.FeedBlockDto.BlockType.FEATURED) {
            return PostFeedDto.FeedBlockDto.BlockType.FEATURED;
        }
        return PostFeedDto.FeedBlockDto.BlockType.STANDARD;
    }
    
    /**
     * Create a block for a post.
     */
    private PostFeedDto.FeedBlockDto createBlock(PostFeedDto post, PostFeedDto.FeedBlockDto.BlockType type, int position) {
        String blockId = "block-" + post.getPostId() + "-" + position;
        
        PostFeedDto.FeedBlockDto.RenderHints hints = createRenderHints(post, type);
        
        int priority = post.getPostPriority() != null ? post.getPostPriority() : 0;
        
        return PostFeedDto.FeedBlockDto.builder()
                .blockId(blockId)
                .blockType(type)
                .blockPosition(position)
                .blockPriority(priority)
                .postIds(List.of(post.getPostId()))
                .renderHints(hints)
                .build();
    }
    
    /**
     * Create render hints based on post and block type.
     */
    private PostFeedDto.FeedBlockDto.RenderHints createRenderHints(PostFeedDto post, PostFeedDto.FeedBlockDto.BlockType type) {
        int mediaCount = post.getMediaCount() != null ? post.getMediaCount() : 
                (post.getMedia() != null ? post.getMedia().size() : 0);
        
        String aspectRatio = computeAspectRatio(type);
        Integer maxHeight = computeMaxHeight(type);
        Boolean showExcerpt = shouldShowExcerpt(type, post);
        String layoutMode = computeLayoutMode(type, mediaCount);
        
        return PostFeedDto.FeedBlockDto.RenderHints.builder()
                .aspectRatio(aspectRatio)
                .maxImageHeight(maxHeight)
                .showExcerpt(showExcerpt)
                .layoutMode(layoutMode)
                .build();
    }
    
    /**
     * Compute aspect ratio based on block type.
     * FIXED aspect ratios for consistent feed visual rhythm.
     * Do NOT modify aspect ratio dynamically based on image dimensions.
     */
    private String computeAspectRatio(PostFeedDto.FeedBlockDto.BlockType type) {
        // FIXED aspect ratios by block type - no dynamic modification
        return switch (type) {
            case FEATURED -> "16/9";  // Wide cinematic
            case HERO -> "16/9";      // Wide cinematic (changed from 21/9)
            case PLACEHOLDER -> "16/9";
            case PHOTO -> "4/5";      // Portrait photo-focused
            case COLLAGE -> "4/5";    // Portrait grid container
            case STANDARD -> "4/5";   // Portrait standard
        };
    }
    
    /**
     * Compute max image height based on block type.
     */
    private Integer computeMaxHeight(PostFeedDto.FeedBlockDto.BlockType type) {
        return switch (type) {
            case FEATURED -> 460;
            case HERO -> 500;
            case PHOTO -> 420;
            case COLLAGE -> 300;
            case STANDARD -> 420;
            case PLACEHOLDER -> 300;
        };
    }
    
    /**
     * Determine if excerpt should be shown.
     */
    private Boolean shouldShowExcerpt(PostFeedDto.FeedBlockDto.BlockType type, PostFeedDto post) {
        int textLength = post.getTextLength() != null ? post.getTextLength() : 
                (post.getTextContent() != null ? post.getTextContent().length() : 0);
        
        return type != PostFeedDto.FeedBlockDto.BlockType.PHOTO && textLength > 50;
    }
    
    /**
     * Compute layout mode for frontend.
     */
    private String computeLayoutMode(PostFeedDto.FeedBlockDto.BlockType type, int mediaCount) {
        return switch (type) {
            case COLLAGE -> mediaCount == 2 ? "grid-2" : "grid-3";
            case FEATURED, HERO -> "single-wide";
            default -> "single";
        };
    }
    
    /**
     * Generate layout for empty feed.
     */
    private List<PostFeedDto.FeedBlockDto> generateEmptyLayout() {
        return List.of(
                PostFeedDto.FeedBlockDto.builder()
                        .blockId("block-placeholder-0")
                        .blockType(PostFeedDto.FeedBlockDto.BlockType.PLACEHOLDER)
                        .blockPosition(0)
                        .blockPriority(0)
                        .postIds(Collections.emptyList())
                        .renderHints(PostFeedDto.FeedBlockDto.RenderHints.builder()
                                .aspectRatio("16/9")
                                .maxImageHeight(300)
                                .showExcerpt(false)
                                .layoutMode("single")
                                .build())
                        .build()
        );
    }
    
    /**
     * Generate layout for low-content scenarios (1-2 posts).
     */
    private List<PostFeedDto.FeedBlockDto> generateLowContentLayout(List<PostFeedDto> posts) {
        List<PostFeedDto.FeedBlockDto> blocks = new ArrayList<>();
        
        if (posts.size() == 1) {
            // Single post: STANDARD if no media, otherwise HERO
            PostFeedDto post = posts.get(0);
            int mediaCount = post.getMediaCount() != null ? post.getMediaCount() :
                    (post.getMedia() != null ? post.getMedia().size() : 0);
            PostFeedDto.FeedBlockDto.BlockType blockType = mediaCount > 0 
                    ? PostFeedDto.FeedBlockDto.BlockType.HERO 
                    : PostFeedDto.FeedBlockDto.BlockType.STANDARD;
            blocks.add(PostFeedDto.FeedBlockDto.builder()
                    .blockId("block-" + (mediaCount > 0 ? "hero" : "standard") + "-" + post.getPostId())
                    .blockType(blockType)
                    .blockPosition(0)
                    .blockPriority(mediaCount > 0 ? 100 : 50)
                    .postIds(List.of(post.getPostId()))
                    .renderHints(createRenderHints(post, blockType))
                    .build());
        } else if (posts.size() == 2) {
            // Two posts: FEATURED + STANDARD
            blocks.add(PostFeedDto.FeedBlockDto.builder()
                    .blockId("block-featured-" + posts.get(0).getPostId())
                    .blockType(PostFeedDto.FeedBlockDto.BlockType.FEATURED)
                    .blockPosition(0)
                    .blockPriority(80)
                    .postIds(List.of(posts.get(0).getPostId()))
                    .renderHints(createRenderHints(posts.get(0), PostFeedDto.FeedBlockDto.BlockType.FEATURED))
                    .build());
            blocks.add(PostFeedDto.FeedBlockDto.builder()
                    .blockId("block-standard-" + posts.get(1).getPostId())
                    .blockType(PostFeedDto.FeedBlockDto.BlockType.STANDARD)
                    .blockPosition(1)
                    .blockPriority(50)
                    .postIds(List.of(posts.get(1).getPostId()))
                    .renderHints(createRenderHints(posts.get(1), PostFeedDto.FeedBlockDto.BlockType.STANDARD))
                    .build());
        }
        
        return blocks;
    }
    
    /**
     * Internal class for scored posts.
     */
    private static class ScoredPost {
        private final PostFeedDto post;
        private final int score;
        
        public ScoredPost(PostFeedDto post, int score) {
            this.post = post;
            this.score = score;
        }
        
        public PostFeedDto getPost() { return post; }
        public int getScore() { return score; }
        public UUID getPostId() { return post.getPostId(); }
    }
}
