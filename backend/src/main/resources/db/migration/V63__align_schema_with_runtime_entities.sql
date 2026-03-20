-- Align runtime schema with active entity expectations.
-- Scope intentionally limited to:
-- 1. review_photos deletion safety
-- 2. UUID defaults for active entity IDs
-- 3. Critical NOT NULL/default alignment for booleans and counters

-- Backfill nullable values before tightening constraints
UPDATE users SET is_deleted = FALSE WHERE is_deleted IS NULL;
UPDATE users SET enabled = TRUE WHERE enabled IS NULL;
UPDATE users SET is_verified_host = FALSE WHERE is_verified_host IS NULL;
UPDATE users SET total_xp = 0 WHERE total_xp IS NULL;
UPDATE comments SET helpful_count = 0 WHERE helpful_count IS NULL;

-- Make review photo rows cascade with their parent reviews
ALTER TABLE review_photos
DROP CONSTRAINT IF EXISTS review_photos_review_id_fkey;

ALTER TABLE review_photos
ADD CONSTRAINT fk_review_photos_review
FOREIGN KEY (review_id)
REFERENCES reviews(id)
ON DELETE CASCADE;

-- Add UUID defaults for entity-generated identifiers
ALTER TABLE reviews
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE destinations
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE states
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE media_resources
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE media_uploads
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Align critical nullability/defaults with entity expectations
ALTER TABLE users
ALTER COLUMN is_deleted SET DEFAULT FALSE,
ALTER COLUMN is_deleted SET NOT NULL,
ALTER COLUMN enabled SET DEFAULT TRUE,
ALTER COLUMN enabled SET NOT NULL,
ALTER COLUMN is_verified_host SET DEFAULT FALSE,
ALTER COLUMN is_verified_host SET NOT NULL,
ALTER COLUMN total_xp SET DEFAULT 0,
ALTER COLUMN total_xp SET NOT NULL;

ALTER TABLE comments
ALTER COLUMN helpful_count SET DEFAULT 0,
ALTER COLUMN helpful_count SET NOT NULL;
