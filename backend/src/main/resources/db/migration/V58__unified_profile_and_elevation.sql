-- V58: Unified Profile & Elevation Engine - Phase 1
-- Creates badge system, XP tracking, helpful votes, and frictionless profile fields

-- ============================================================================
-- 1. Rename legacy user_badges table to avoid Flyway collision
-- ============================================================================
ALTER TABLE IF EXISTS user_badges RENAME TO user_badges_legacy;

-- ============================================================================
-- 2. Add frictionless profile fields to users table
-- ============================================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS location VARCHAR(255),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS languages TEXT[],
    ADD COLUMN IF NOT EXISTS interests TEXT[],
    ADD COLUMN IF NOT EXISTS traveller_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Index for profile search by location
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
-- GIN index for JSONB social_links queries
CREATE INDEX IF NOT EXISTS idx_users_social_links ON users USING GIN (social_links);
-- Index for verification status filtering
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- ============================================================================
-- 3. Add XP tracking fields to posts table
-- ============================================================================
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS helpful_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_computed_xp INTEGER NOT NULL DEFAULT 0;

-- Index for sorting by helpful count
CREATE INDEX IF NOT EXISTS idx_posts_helpful_count ON posts(helpful_count DESC);

-- ============================================================================
-- 4. Create badge_definitions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    badge_type VARCHAR(50) NOT NULL,
    icon_url TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    stage_number INTEGER,
    min_xp_threshold INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Index for badge lookup by slug
CREATE INDEX IF NOT EXISTS idx_badge_definitions_slug ON badge_definitions(slug);
-- Index for active badges by stage
CREATE INDEX IF NOT EXISTS idx_badge_definitions_stage ON badge_definitions(stage_number, is_active);

-- ============================================================================
-- 5. Create new user_badges table (replaces legacy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE RESTRICT,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    award_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- Index for user's badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
-- Index for pinned badges display
CREATE INDEX IF NOT EXISTS idx_user_badges_pinned ON user_badges(user_id, is_pinned) WHERE is_pinned = TRUE;

-- ============================================================================
-- 6. Create user_xp_history table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    xp_delta INTEGER NOT NULL,
    reason TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user's XP history
CREATE INDEX IF NOT EXISTS idx_user_xp_history_user_id ON user_xp_history(user_id, created_at DESC);
-- Index for XP source tracking
CREATE INDEX IF NOT EXISTS idx_user_xp_history_source ON user_xp_history(source_type, source_id);

-- ============================================================================
-- 7. Create helpful_votes table (composite PK)
-- ============================================================================
CREATE TABLE IF NOT EXISTS helpful_votes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Index for user's helpful votes
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_id ON helpful_votes(user_id, voted_at DESC);

-- ============================================================================
-- 8. Comments for documentation
-- ============================================================================
COMMENT ON TABLE badge_definitions IS 'Defines available badges and elevation stages for gamification';
COMMENT ON COLUMN badge_definitions.badge_type IS 'Type: STAGE, ACHIEVEMENT, SPECIAL';
COMMENT ON COLUMN badge_definitions.stage_number IS 'For STAGE badges: the elevation stage number';
COMMENT ON COLUMN badge_definitions.min_xp_threshold IS 'Minimum XP required to earn this badge';

COMMENT ON TABLE user_badges IS 'Awards badges to users with metadata and pin status';
COMMENT ON COLUMN user_badges.is_pinned IS 'User has pinned this badge to their profile';
COMMENT ON COLUMN user_badges.metadata IS 'Additional context about badge award (e.g., post_id that earned it)';

COMMENT ON TABLE user_xp_history IS 'Immutable log of XP changes for audit and history';
COMMENT ON COLUMN user_xp_history.source_type IS 'POST_HELPFUL, BADGE_AWARD, COMMUNITY_CONTRIBUTION, etc.';
COMMENT ON COLUMN user_xp_history.balance_after IS 'User total XP after this transaction';

COMMENT ON TABLE helpful_votes IS 'Tracks which users marked posts as helpful';
COMMENT ON COLUMN posts.helpful_count IS 'Denormalized count of helpful votes for this post';
COMMENT ON COLUMN posts.last_computed_xp IS 'XP value computed during last scoring run';
