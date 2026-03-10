-- V42: Feed Performance Indexes for Cursor Pagination
-- Optimizes the community feed query for <300ms latency
-- Defensive: uses IF NOT EXISTS and checks for column existence

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
-- Only create if column exists (added in later migration)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'posts' AND column_name = 'original_post_id') THEN
        CREATE INDEX IF NOT EXISTS idx_posts_original_post_id 
            ON posts (original_post_id) 
            WHERE original_post_id IS NOT NULL;
    END IF;
END $$;

-- Composite index for post_likes count aggregation
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id_user_id 
    ON post_likes (post_id, user_id);

-- Composite index for comments count aggregation
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at 
    ON comments (post_id, created_at);
