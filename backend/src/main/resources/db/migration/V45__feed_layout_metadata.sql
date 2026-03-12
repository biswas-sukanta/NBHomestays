-- V45: Feed layout metadata columns (additive, non-breaking)
-- Adds columns required by backend-driven FeedBlock layout engine.

-- Media resources: image dimensions
ALTER TABLE media_resources
    ADD COLUMN IF NOT EXISTS width INTEGER,
    ADD COLUMN IF NOT EXISTS height INTEGER;

-- Posts: editorial/layout metadata
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS post_priority INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS text_length INTEGER,
    ADD COLUMN IF NOT EXISTS media_count INTEGER,
    ADD COLUMN IF NOT EXISTS post_category VARCHAR(64);
