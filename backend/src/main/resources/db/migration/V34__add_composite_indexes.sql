-- V34: Add composite index for the critical search WHERE clause
-- Covers: WHERE is_deleted = false AND status = 'APPROVED'
CREATE INDEX IF NOT EXISTS idx_homestays_status_deleted ON homestays (status, is_deleted);

-- Add index on destination_id for JOIN lookups
CREATE INDEX IF NOT EXISTS idx_homestays_destination_id ON homestays (destination_id);

-- Add index on owner_id for my-listings queries
CREATE INDEX IF NOT EXISTS idx_homestays_owner_id ON homestays (owner_id);
