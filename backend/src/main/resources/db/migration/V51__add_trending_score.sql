ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS trending_score DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_posts_trending
    ON posts (trending_score DESC, created_at DESC);

