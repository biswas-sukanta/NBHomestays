-- V42: Feed Performance Indexes for Cursor Pagination
-- Optimizes the community feed query for <300ms latency

-- Composite index for cursor pagination (keyset pagination)
-- Covers: ORDER BY created_at DESC, id DESC
-- Used by: findFeedWithCursor, findFeedByTagWithCursor
CREATE INDEX IF NOT EXISTS idx_posts_created_at_id_desc 
    ON posts (created_at DESC, id DESC);

-- Partial index for active posts only (excludes soft-deleted)
-- This is more efficient than filtering is_deleted = false each time
CREATE INDEX IF NOT EXISTS idx_posts_active_created_at_id_desc 
    ON posts (created_at DESC, id DESC) 
    WHERE is_deleted = false;

-- Index for user's posts (my-posts page)
CREATE INDEX IF NOT EXISTS idx_posts_user_created_at 
    ON posts (user_id, created_at DESC);

-- Index for original_post_id lookups (repost queries)
CREATE INDEX IF NOT EXISTS idx_posts_original_post_id 
    ON posts (original_post_id) 
    WHERE original_post_id IS NOT NULL;

-- Composite index for post_likes count aggregation
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id_user_id 
    ON post_likes (post_id, user_id);

-- Composite index for comments count aggregation
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at 
    ON comments (post_id, created_at);

-- EXPLAIN ANALYZE output for feed query (run manually to verify):
-- EXPLAIN ANALYZE
-- SELECT p.id, p.text_content, p.created_at, u.id, u.first_name, u.last_name, 
--        u.avatar_url, u.role, u.verified_host, p.love_count, p.share_count,
--        h.id, h.name, p.original_post_id
-- FROM posts p
-- INNER JOIN users u ON p.user_id = u.id
-- LEFT JOIN homestays h ON p.homestay_id = h.id
-- WHERE p.is_deleted = false
-- ORDER BY p.created_at DESC, p.id DESC
-- LIMIT 12;
--
-- Expected: Index Scan using idx_posts_active_created_at_id_desc
-- Cost: < 100 for 12 rows
