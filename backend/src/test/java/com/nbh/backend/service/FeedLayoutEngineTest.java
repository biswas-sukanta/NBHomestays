package com.nbh.backend.service;

import com.nbh.backend.dto.PostFeedDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for FeedLayoutEngine.
 * Covers editorial layout generation, low-content scenarios, and edge cases.
 */
class FeedLayoutEngineTest {

    private FeedLayoutEngine layoutEngine;

    @BeforeEach
    void setUp() {
        layoutEngine = new FeedLayoutEngine();
    }

    @Nested
    @DisplayName("Empty and Null Input")
    class EmptyInputTests {
        
        @Test
        @DisplayName("null input returns placeholder block")
        void nullInput_returnsPlaceholder() {
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(null, 12);
            
            assertNotNull(blocks);
            assertEquals(1, blocks.size());
            assertEquals(PostFeedDto.FeedBlockDto.BlockType.PLACEHOLDER, blocks.get(0).getBlockType());
        }
        
        @Test
        @DisplayName("empty list returns placeholder block")
        void emptyList_returnsPlaceholder() {
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(Collections.emptyList(), 12);
            
            assertNotNull(blocks);
            assertEquals(1, blocks.size());
            assertEquals(PostFeedDto.FeedBlockDto.BlockType.PLACEHOLDER, blocks.get(0).getBlockType());
            assertTrue(blocks.get(0).getPostIds().isEmpty());
        }
    }

    @Nested
    @DisplayName("Low Content Scenarios")
    class LowContentTests {
        
        @Test
        @DisplayName("1 post gets HERO treatment")
        void singlePost_getsHeroBlock() {
            List<PostFeedDto> posts = createPosts(1, 0, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            assertEquals(1, blocks.size());
            assertEquals(PostFeedDto.FeedBlockDto.BlockType.HERO, blocks.get(0).getBlockType());
            assertEquals(posts.get(0).getPostId(), blocks.get(0).getPostIds().get(0));
        }
        
        @Test
        @DisplayName("2 posts get FEATURED + STANDARD")
        void twoPosts_getFeaturedAndStandard() {
            List<PostFeedDto> posts = createPosts(2, 0, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            assertEquals(2, blocks.size());
            assertEquals(PostFeedDto.FeedBlockDto.BlockType.FEATURED, blocks.get(0).getBlockType());
            assertEquals(PostFeedDto.FeedBlockDto.BlockType.STANDARD, blocks.get(1).getBlockType());
        }
    }

    @Nested
    @DisplayName("Standard Content Scenarios")
    class StandardContentTests {
        
        @Test
        @DisplayName("3 posts get balanced layout")
        void threePosts_getBalancedLayout() {
            List<PostFeedDto> posts = createPosts(3, 2, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            assertEquals(3, blocks.size());
            // Verify all posts are assigned
            Set<UUID> assignedIds = blocks.stream()
                    .flatMap(b -> b.getPostIds().stream())
                    .collect(Collectors.toSet());
            assertEquals(3, assignedIds.size());
        }
        
        @Test
        @DisplayName("5 posts follow editorial pattern")
        void fivePosts_followPattern() {
            List<PostFeedDto> posts = createPosts(5, 2, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            assertEquals(5, blocks.size());
            
            // Verify positions are sequential
            for (int i = 0; i < blocks.size(); i++) {
                assertEquals(i, blocks.get(i).getBlockPosition());
            }
        }
        
        @Test
        @DisplayName("7 posts complete full pattern cycle")
        void sevenPosts_completePattern() {
            List<PostFeedDto> posts = createPosts(7, 2, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            assertEquals(7, blocks.size());
            
            // Count block types
            Map<PostFeedDto.FeedBlockDto.BlockType, Long> typeCounts = blocks.stream()
                    .collect(Collectors.groupingBy(PostFeedDto.FeedBlockDto::getBlockType, Collectors.counting()));
            
            // Should have variety
            assertTrue(typeCounts.size() >= 3, "Expected at least 3 different block types");
        }
        
        @Test
        @DisplayName("12 posts get full layout")
        void twelvePosts_getFullLayout() {
            List<PostFeedDto> posts = createPosts(12, 2, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            assertEquals(12, blocks.size());
            
            // Verify all posts assigned
            Set<UUID> assignedIds = blocks.stream()
                    .flatMap(b -> b.getPostIds().stream())
                    .collect(Collectors.toSet());
            assertEquals(12, assignedIds.size());
        }
    }

    @Nested
    @DisplayName("Image-Heavy Posts")
    class ImageHeavyTests {
        
        @Test
        @DisplayName("post with 2+ images eligible for COLLAGE")
        void postWithMultipleImages_canGetCollage() {
            List<PostFeedDto> posts = createPosts(7, 3, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            // At least one should be collage (pattern position 3)
            boolean hasCollage = blocks.stream()
                    .anyMatch(b -> b.getBlockType() == PostFeedDto.FeedBlockDto.BlockType.COLLAGE);
            assertTrue(hasCollage, "Expected at least one COLLAGE block for posts with 3 images");
        }
        
        @Test
        @DisplayName("post with 1 image not eligible for COLLAGE - falls back to STANDARD")
        void postWithOneImage_notCollage() {
            List<PostFeedDto> posts = createPosts(7, 1, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            // No collage should appear since all posts have only 1 image
            boolean hasCollage = blocks.stream()
                    .anyMatch(b -> b.getBlockType() == PostFeedDto.FeedBlockDto.BlockType.COLLAGE);
            assertFalse(hasCollage, "COLLAGE should not appear when posts have only 1 image");
        }
    }

    @Nested
    @DisplayName("Text-Heavy Posts")
    class TextHeavyTests {
        
        @Test
        @DisplayName("short text eligible for PHOTO")
        void shortText_canGetPhoto() {
            List<PostFeedDto> posts = createPosts(7, 1, 50); // 50 chars < 100 threshold
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            // Pattern position 5 is PHOTO - should appear with short text
            boolean hasPhoto = blocks.stream()
                    .anyMatch(b -> b.getBlockType() == PostFeedDto.FeedBlockDto.BlockType.PHOTO);
            assertTrue(hasPhoto, "Expected PHOTO for posts with short text");
        }
        
        @Test
        @DisplayName("long text not eligible for PHOTO")
        void longText_notPhoto() {
            List<PostFeedDto> posts = createPosts(7, 1, 500); // 500 chars > 100 threshold
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            // No PHOTO should appear with long text
            boolean hasPhoto = blocks.stream()
                    .anyMatch(b -> b.getBlockType() == PostFeedDto.FeedBlockDto.BlockType.PHOTO);
            assertFalse(hasPhoto, "PHOTO should not appear with long text posts");
        }
    }

    @Nested
    @DisplayName("Render Hints")
    class RenderHintsTests {
        
        @Test
        @DisplayName("FEATURED block has correct aspect ratio")
        void featuredBlock_hasCorrectAspectRatio() {
            List<PostFeedDto> posts = createPosts(2, 1, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            PostFeedDto.FeedBlockDto featured = blocks.stream()
                    .filter(b -> b.getBlockType() == PostFeedDto.FeedBlockDto.BlockType.FEATURED)
                    .findFirst()
                    .orElse(null);
            
            assertNotNull(featured);
            assertEquals("16/9", featured.getRenderHints().getAspectRatio());
            assertEquals(460, featured.getRenderHints().getMaxImageHeight());
        }
        
        @Test
        @DisplayName("HERO block has correct render hints")
        void heroBlock_hasCorrectRenderHints() {
            List<PostFeedDto> posts = createPosts(1, 1, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            PostFeedDto.FeedBlockDto hero = blocks.get(0);
            assertEquals(PostFeedDto.FeedBlockDto.BlockType.HERO, hero.getBlockType());
            assertEquals("16/9", hero.getRenderHints().getAspectRatio());
            assertEquals(500, hero.getRenderHints().getMaxImageHeight());
        }
        
        @Test
        @DisplayName("COLLAGE block with 2 images has grid-2 layout mode")
        void collageBlock_hasCorrectLayoutMode() {
            List<PostFeedDto> posts = createPosts(7, 2, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            PostFeedDto.FeedBlockDto collage = blocks.stream()
                    .filter(b -> b.getBlockType() == PostFeedDto.FeedBlockDto.BlockType.COLLAGE)
                    .findFirst()
                    .orElse(null);
            
            if (collage != null) {
                assertEquals("grid-2", collage.getRenderHints().getLayoutMode());
            }
        }
    }

    @Nested
    @DisplayName("Deterministic Behavior")
    class DeterministicTests {
        
        @Test
        @DisplayName("same input produces same output")
        void sameInput_sameOutput() {
            List<PostFeedDto> posts = createPosts(7, 2, 100);
            
            List<PostFeedDto.FeedBlockDto> blocks1 = layoutEngine.generateLayout(posts, 12);
            List<PostFeedDto.FeedBlockDto> blocks2 = layoutEngine.generateLayout(posts, 12);
            
            assertEquals(blocks1.size(), blocks2.size());
            for (int i = 0; i < blocks1.size(); i++) {
                assertEquals(blocks1.get(i).getBlockType(), blocks2.get(i).getBlockType());
                assertEquals(blocks1.get(i).getPostIds(), blocks2.get(i).getPostIds());
            }
        }
    }

    @Nested
    @DisplayName("No Consecutive Same Types")
    class NoConsecutiveTests {
        
        @Test
        @DisplayName("no consecutive same block types (except STANDARD)")
        void noConsecutiveSameTypes() {
            List<PostFeedDto> posts = createPosts(12, 3, 50);
            
            List<PostFeedDto.FeedBlockDto> blocks = layoutEngine.generateLayout(posts, 12);
            
            for (int i = 1; i < blocks.size(); i++) {
                PostFeedDto.FeedBlockDto.BlockType prev = blocks.get(i - 1).getBlockType();
                PostFeedDto.FeedBlockDto.BlockType curr = blocks.get(i).getBlockType();
                
                // STANDARD can repeat, others shouldn't
                if (prev != PostFeedDto.FeedBlockDto.BlockType.STANDARD) {
                    assertNotEquals(prev, curr, 
                            "Consecutive " + prev + " blocks at positions " + (i-1) + " and " + i);
                }
            }
        }
    }

    // Helper methods
    
    private List<PostFeedDto> createPosts(int count, int mediaCount, int textLength) {
        List<PostFeedDto> posts = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            posts.add(createPost(i, mediaCount, textLength));
        }
        return posts;
    }
    
    private PostFeedDto createPost(int index, int mediaCount, int textLength) {
        UUID postId = UUID.randomUUID();
        
        // Create media list
        List<PostFeedDto.MediaVariantDto> media = new ArrayList<>();
        for (int i = 0; i < mediaCount; i++) {
            media.add(PostFeedDto.MediaVariantDto.builder()
                    .id(UUID.randomUUID())
                    .fileId("file-" + index + "-" + i)
                    .originalUrl("https://example.com/image-" + index + "-" + i + ".jpg")
                    .thumbnail("https://example.com/thumb-" + index + "-" + i + ".jpg")
                    .small("https://example.com/small-" + index + "-" + i + ".jpg")
                    .medium("https://example.com/medium-" + index + "-" + i + ".jpg")
                    .large("https://example.com/large-" + index + "-" + i + ".jpg")
                    .build());
        }
        
        // Create text content
        String textContent = "x".repeat(textLength);
        
        // Create image dimensions
        List<PostFeedDto.ImageDimDto> imageDims = new ArrayList<>();
        for (int i = 0; i < mediaCount; i++) {
            imageDims.add(PostFeedDto.ImageDimDto.builder()
                    .mediaId(media.get(i).getId())
                    .width(800)
                    .height(600)
                    .aspectRatio(800.0 / 600)
                    .build());
        }
        
        return PostFeedDto.builder()
                .postId(postId)
                .textContent(textContent)
                .createdAt(LocalDateTime.now().minusHours(index))
                .authorId(UUID.randomUUID())
                .authorName("Author " + index)
                .authorAvatarUrl("https://example.com/avatar-" + index + ".jpg")
                .authorRole("TRAVELER")
                .authorVerifiedHost(index % 3 == 0)
                .commentCount(index * 2)
                .likeCount(index * 10)
                .shareCount(index)
                .tags(List.of("Tag" + index))
                .media(media)
                .mediaCount(mediaCount)
                .textLength(textLength)
                .imageDimensions(imageDims)
                .isLikedByCurrentUser(false)
                .build();
    }
}
