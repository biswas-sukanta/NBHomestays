-- Add is_verified_host column to users table
ALTER TABLE users ADD COLUMN is_verified_host BOOLEAN DEFAULT FALSE;
