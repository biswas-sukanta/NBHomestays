-- Add tags column to homestays as JSONB
ALTER TABLE homestays
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- Optional: Add an index on tags if not performance heavy, GIN index is good for JSONB arrays.
CREATE INDEX IF NOT EXISTS idx_homestays_tags ON homestays USING GIN (tags);
