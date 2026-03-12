-- V40: Performance indexes for slow API endpoints
-- These indexes target the N+1 query patterns and common filter conditions

-- Posts: Support cursor pagination and ordering
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts (is_deleted);

-- Post tags: Support tag filtering
CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags (tag);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags (post_id);

-- Comments: Support comment count aggregation
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

-- Post likes: Support like count aggregation and user like status
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes (user_id, post_id);

-- Media resources: Support batch loading by post
CREATE INDEX IF NOT EXISTS idx_media_resources_post_id ON media_resources (post_id);

-- Destinations: Support state lookup and ordering
CREATE INDEX IF NOT EXISTS idx_destinations_state_id ON destinations (state_id);
CREATE INDEX IF NOT EXISTS idx_destinations_slug ON destinations (slug);

-- Homestays: Support destination lookup and filtering
CREATE INDEX IF NOT EXISTS idx_homestays_destination_id ON homestays (destination_id);
CREATE INDEX IF NOT EXISTS idx_homestays_is_deleted ON homestays (is_deleted);

-- Timeline: Support feed pagination (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_timeline') THEN
        CREATE INDEX IF NOT EXISTS idx_post_timeline_created_at_desc ON post_timeline (created_at DESC, post_id DESC);
    END IF;
END $$;
