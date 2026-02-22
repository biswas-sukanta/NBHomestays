-- V12__fix_policies_json_array.sql
-- Description: Fixes the default JSONB structure for 'policies' to be an array instead of an object.
-- This prevents Jackson MismatchedInputException when mapping to java.util.List<String>.

ALTER TABLE homestays ALTER COLUMN policies SET DEFAULT '[]'::jsonb;
UPDATE homestays SET policies = '[]'::jsonb WHERE policies = '{}'::jsonb;
