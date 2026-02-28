-- V31__sync_soft_deletes_fix.sql
-- Consolidated, Idempotent Soft Delete Migration

-- 1. Safely add columns (PostgreSQL 9.6+ supports IF NOT EXISTS for columns)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE saved_items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE homestay_questions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE homestay_answers ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE homestays ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. Add idempotent indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_saved_items_is_deleted ON saved_items(is_deleted);
CREATE INDEX IF NOT EXISTS idx_reviews_is_deleted ON reviews(is_deleted);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_homestay_questions_is_deleted ON homestay_questions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_homestay_answers_is_deleted ON homestay_answers(is_deleted);
CREATE INDEX IF NOT EXISTS idx_homestays_is_deleted ON homestays(is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);
