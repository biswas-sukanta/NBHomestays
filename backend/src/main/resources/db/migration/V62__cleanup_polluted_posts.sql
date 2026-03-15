-- V62: Cleanup Polluted Posts
-- Removes AI prompt text that was accidentally inserted into posts.text_content

-- Delete posts where text_content contains AI prompt markers
DELETE FROM posts 
WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
   OR text_content ILIKE '%You are working on a production repository%';

-- Log the cleanup
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'V62: Cleaned up % polluted posts', deleted_count;
END $$;
