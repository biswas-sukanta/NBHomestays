-- V25__add_soft_deletes.sql
-- Adds the is_deleted flag for enterprise-grade soft deletes across core entities

ALTER TABLE posts ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE comments ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE homestays ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE homestay_questions ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE homestay_answers ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Performance Indexes for Soft Delete Queries
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);
CREATE INDEX idx_comments_is_deleted ON comments(is_deleted);
CREATE INDEX idx_homestays_is_deleted ON homestays(is_deleted);
CREATE INDEX idx_reviews_is_deleted ON reviews(is_deleted);
CREATE INDEX idx_homestay_questions_is_deleted ON homestay_questions(is_deleted);
CREATE INDEX idx_homestay_answers_is_deleted ON homestay_answers(is_deleted);
