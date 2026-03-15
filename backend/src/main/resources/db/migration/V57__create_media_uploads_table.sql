-- V57: Create media_uploads table for orphan tracking
-- Tracks uploaded files to detect and clean up orphaned media

CREATE TABLE IF NOT EXISTS media_uploads (
    id VARCHAR(36) PRIMARY KEY,
    file_id VARCHAR(255) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attached_at TIMESTAMP WITH TIME ZONE,
    attached_entity_type VARCHAR(50),
    attached_entity_id VARCHAR(36)
);

-- Indexes for orphan cleanup job queries
CREATE INDEX IF NOT EXISTS idx_media_uploads_status ON media_uploads(status);
CREATE INDEX IF NOT EXISTS idx_media_uploads_created_at ON media_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_media_uploads_file_id ON media_uploads(file_id);

COMMENT ON TABLE media_uploads IS 'Tracks media uploads for orphan detection and cleanup';
COMMENT ON COLUMN media_uploads.status IS 'PENDING, ATTACHED, or ORPHANED_DELETED';
COMMENT ON COLUMN media_uploads.attached_entity_type IS 'POST, HOMESTAY, or COMMENT';
