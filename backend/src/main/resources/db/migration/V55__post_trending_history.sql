CREATE TABLE IF NOT EXISTS post_trending_history (
    id BIGSERIAL PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    trending_score DOUBLE PRECISION NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_trending_history_post_id_computed_at
    ON post_trending_history (post_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_trending_history_computed_at
    ON post_trending_history (computed_at DESC);
