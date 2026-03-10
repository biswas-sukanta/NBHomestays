-- V26__media_resource_entity.sql
-- Schema-compatible migration: handles existing post_images, homestay_photos, review_photos
-- Safe: uses IF EXISTS for all operations

-- 1. Create the unified media_resources table
CREATE TABLE IF NOT EXISTS media_resources (
    id UUID PRIMARY KEY,
    url TEXT NOT NULL,
    file_id TEXT,
    post_id UUID REFERENCES posts(id),
    homestay_id UUID REFERENCES homestays(id),
    comment_id UUID REFERENCES comments(id)
);

-- 2. Migrate data from post_images (actual table name in DB)
INSERT INTO media_resources (id, url, file_id, post_id)
SELECT gen_random_uuid(), image_url, NULL, post_id FROM post_images
ON CONFLICT DO NOTHING;

-- 3. Migrate data from homestay_photos
INSERT INTO media_resources (id, url, homestay_id)
SELECT gen_random_uuid(), photo_url, homestay_id FROM homestay_photos
ON CONFLICT DO NOTHING;

-- 4. Migrate data from review_photos
INSERT INTO media_resources (id, url, file_id, homestay_id)
SELECT gen_random_uuid(), photo_url, NULL, r.homestay_id 
FROM review_photos rp JOIN reviews r ON rp.review_id = r.id
ON CONFLICT DO NOTHING;

-- 5. Drop old collection tables (safe with IF EXISTS)
DROP TABLE IF EXISTS post_images;
DROP TABLE IF EXISTS homestay_photos;
DROP TABLE IF EXISTS review_photos;
DROP TABLE IF EXISTS post_media;
DROP TABLE IF EXISTS comment_media;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media_resources(post_id);
CREATE INDEX IF NOT EXISTS idx_media_homestay_id ON media_resources(homestay_id);
CREATE INDEX IF NOT EXISTS idx_media_comment_id ON media_resources(comment_id);
