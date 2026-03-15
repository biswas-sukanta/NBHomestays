-- Add comment_count column to posts table for engagement consistency
-- This column stores the pre-computed comment count for each post

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

-- Backfill comment_count from comments table
UPDATE posts p SET comment_count = (
    SELECT COUNT(*) 
    FROM comments c 
    WHERE c.post_id = p.id
);

-- Create index for comment count queries (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_posts_comment_count ON posts (comment_count DESC)
    WHERE comment_count > 0;
