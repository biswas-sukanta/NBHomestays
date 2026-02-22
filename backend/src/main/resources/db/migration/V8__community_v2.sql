-- ═══════════════════════════════════════════════════════════════
-- V8: Community Engine v2 — Non-destructive evolution
-- Adds TripBoardSave, threaded Comments, PostLikes,
-- enriched User profile fields, post-homestay linking,
-- and all performance indexes.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Enhanced User Profile ──────────────────────────────────
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT,
    ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- ── 2. Link posts to a specific homestay (already done in some cases) ──
ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS homestay_id UUID REFERENCES homestays(id) ON DELETE SET NULL;

-- ── 3. Trip Board Saves (server-side wishlist) ─────────────────
CREATE TABLE IF NOT EXISTS trip_board_saves (
    user_id     UUID NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    homestay_id UUID NOT NULL REFERENCES homestays(id) ON DELETE CASCADE,
    saved_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, homestay_id)
);

-- ── 4. Threaded Comments (Adjacency List) ─────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id    UUID        NOT NULL REFERENCES posts(id)     ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    parent_id  UUID                 REFERENCES comments(id) ON DELETE CASCADE,  -- NULL = top-level
    body       TEXT        NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── 5. Post Likes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
    user_id UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id)  ON DELETE CASCADE,
    liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- ── 6. Featured homestay flag ──────────────────────────────────
ALTER TABLE homestays
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 7. Performance Indexes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_homestay_id     ON posts (homestay_id)
    WHERE homestay_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_post_id      ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id    ON comments (parent_id)
    WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created_at   ON comments (created_at);

CREATE INDEX IF NOT EXISTS idx_trip_board_user       ON trip_board_saves (user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id    ON post_likes (post_id);

CREATE INDEX IF NOT EXISTS idx_homestays_status      ON homestays (status);
CREATE INDEX IF NOT EXISTS idx_homestays_featured    ON homestays (is_featured)
    WHERE is_featured = TRUE;
