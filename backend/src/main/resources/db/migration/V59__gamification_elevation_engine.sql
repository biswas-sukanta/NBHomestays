-- V59: Gamification Elevation Engine Tables
-- Adds tables for XP tracking, badges, and helpful votes

-- Add total_xp column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- Create badge_definitions table
CREATE TABLE IF NOT EXISTS badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    badge_type VARCHAR(50) NOT NULL DEFAULT 'ACHIEVEMENT',
    xp_reward INTEGER DEFAULT 0,
    stage_number INTEGER,
    min_xp_threshold INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_pinned BOOLEAN DEFAULT FALSE,
    award_reason TEXT,
    UNIQUE(user_id, badge_id)
);

-- Create user_xp_history table
CREATE TABLE IF NOT EXISTS user_xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_delta INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    reason TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create helpful_votes table
CREATE TABLE IF NOT EXISTS helpful_votes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_pinned ON user_badges(user_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_user_xp_history_user_id ON user_xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_history_created_at ON user_xp_history(created_at);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_post_id ON helpful_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_id ON helpful_votes(user_id);

-- Add helpful_count column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_computed_xp INTEGER DEFAULT 0;

-- Insert default stage badges
INSERT INTO badge_definitions (name, slug, description, badge_type, stage_number, min_xp_threshold, icon_url)
VALUES 
    ('Newcomer', 'newcomer', 'Welcome to the community!', 'STAGE', 1, 0, '/icons/stages/newcomer.svg'),
    ('The Wayfarer', 'explorer', 'Reached 100 XP', 'STAGE', 2, 100, '/icons/stages/wayfarer.svg'),
    ('The Dooars Ranger', 'guide', 'Reached 500 XP', 'STAGE', 3, 500, '/icons/stages/ranger.svg'),
    ('Mountain Guide', 'expert', 'Reached 1500 XP', 'STAGE', 4, 1500, '/icons/stages/guide.svg'),
    ('Himalayan Sage', 'mentor', 'Reached 5000 XP', 'STAGE', 5, 5000, '/icons/stages/sage.svg')
ON CONFLICT (slug) DO NOTHING;

-- Insert default merit badges
INSERT INTO badge_definitions (name, slug, description, badge_type, xp_reward, icon_url)
VALUES 
    ('Helper', 'helper-20', 'Received 20+ helpful marks on comments', 'ACHIEVEMENT', 50, '/icons/badges/helper.svg'),
    ('Reviewer', 'reviewer-5', 'Wrote 5+ reviews', 'ACHIEVEMENT', 30, '/icons/badges/reviewer.svg'),
    ('Contributor', 'contributor-50', 'Created 50+ posts', 'ACHIEVEMENT', 100, '/icons/badges/contributor.svg')
ON CONFLICT (slug) DO NOTHING;
