-- V26__media_resource_entity.sql
-- 1. Create the unified media_resources table
CREATE TABLE media_resources (
    id UUID PRIMARY KEY,
    url TEXT NOT NULL,
    file_id TEXT,
    post_id UUID REFERENCES posts(id),
    homestay_id UUID REFERENCES homestays(id),
    comment_id UUID REFERENCES comments(id)
);

-- 2. Migrate data from post_media element collection
INSERT INTO media_resources (id, url, file_id, post_id)
SELECT gen_random_uuid(), url, file_id, post_id FROM post_media;

-- 3. Migrate data from homestay_photos element collection
INSERT INTO media_resources (id, url, homestay_id)
SELECT gen_random_uuid(), photo_url, homestay_id FROM homestay_photos;

-- 4. Migrate data from comment_media element collection
INSERT INTO media_resources (id, url, file_id, comment_id)
SELECT gen_random_uuid(), url, file_id, comment_id FROM comment_media;

-- 5. Drop old collection tables
DROP TABLE post_media;
DROP TABLE homestay_photos;
DROP TABLE comment_media;

-- 6. Indexes for performance
CREATE INDEX idx_media_post_id ON media_resources(post_id);
CREATE INDEX idx_media_homestay_id ON media_resources(homestay_id);
CREATE INDEX idx_media_comment_id ON media_resources(comment_id);
