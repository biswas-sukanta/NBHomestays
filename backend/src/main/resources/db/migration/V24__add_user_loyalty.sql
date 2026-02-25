-- V24: Add User Loyalty Schema
-- Adds community_points to users table and creates user_badges collection table.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS community_points INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge   VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, badge)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
