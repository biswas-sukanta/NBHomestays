-- V9: Add featured flag to homestays for admin management
ALTER TABLE homestays ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast featured feed query
CREATE INDEX IF NOT EXISTS idx_homestays_featured ON homestays (featured) WHERE featured = TRUE;
