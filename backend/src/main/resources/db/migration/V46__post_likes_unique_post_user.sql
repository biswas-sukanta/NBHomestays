-- Ensure idempotent like upsert conflict target exists on (post_id, user_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_post_likes_post_user ON post_likes (post_id, user_id);
