ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_destination_id
    ON posts (destination_id);

