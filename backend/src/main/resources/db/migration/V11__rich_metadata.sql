-- V11__rich_metadata.sql
-- Description: Adds JSONB columns to the homestays table for Airbnb-tier rich metadata.
-- Author: Antigravity

ALTER TABLE homestays
ADD COLUMN policies JSONB DEFAULT '{}'::jsonb,
ADD COLUMN quick_facts JSONB DEFAULT '{}'::jsonb,
ADD COLUMN host_details JSONB DEFAULT '{}'::jsonb;

-- Add GIN indexes for efficient querying of these JSONB columns if needed in the future
CREATE INDEX idx_homestays_policies ON homestays USING GIN (policies);
CREATE INDEX idx_homestays_quick_facts ON homestays USING GIN (quick_facts);
CREATE INDEX idx_homestays_host_details ON homestays USING GIN (host_details);
