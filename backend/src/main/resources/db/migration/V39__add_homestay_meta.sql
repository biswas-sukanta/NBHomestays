-- Add flexible metadata JSONB column to support editorial fields and future dynamic content 
-- without requiring constant schema changes.
ALTER TABLE homestays
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';
