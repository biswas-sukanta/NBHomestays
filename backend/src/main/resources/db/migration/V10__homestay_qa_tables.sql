-- ═══════════════════════════════════════════════════════════════
-- V10: Homestay Q&A — Threaded Questions & Answers
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Questions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homestay_questions (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    homestay_id UUID        NOT NULL REFERENCES homestays(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    text        TEXT        NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── 2. Answers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homestay_answers (
    id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID        NOT NULL REFERENCES homestay_questions(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    text        TEXT        NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── 3. Performance Indexes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hq_homestay_id ON homestay_questions (homestay_id);
CREATE INDEX IF NOT EXISTS idx_hq_created_at  ON homestay_questions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ha_question_id ON homestay_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_ha_created_at  ON homestay_answers (created_at DESC);
