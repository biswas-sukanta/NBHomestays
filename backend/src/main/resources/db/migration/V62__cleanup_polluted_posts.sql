-- V62: Cleanup Polluted Posts
-- Removes AI prompt text that was accidentally inserted into posts.text_content
-- IMPORTANT: Must delete child records first to respect FK constraints

-- Step 1: Delete media_resources linked to polluted posts
DELETE FROM media_resources 
WHERE post_id IN (
    SELECT id FROM posts 
    WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
       OR text_content ILIKE '%You are working on a production repository%'
);

-- Step 2: Delete helpful_votes linked to polluted posts
DELETE FROM helpful_votes 
WHERE post_id IN (
    SELECT id FROM posts 
    WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
       OR text_content ILIKE '%You are working on a production repository%'
);

-- Step 3: Delete comments linked to polluted posts (if any)
DELETE FROM comments 
WHERE post_id IN (
    SELECT id FROM posts 
    WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
       OR text_content ILIKE '%You are working on a production repository%'
);

-- Step 4: Delete post_likes linked to polluted posts
DELETE FROM post_likes 
WHERE post_id IN (
    SELECT id FROM posts 
    WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
       OR text_content ILIKE '%You are working on a production repository%'
);

-- Step 5: Delete from post_tags (ElementCollection table)
DELETE FROM post_tags 
WHERE post_id IN (
    SELECT id FROM posts 
    WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
       OR text_content ILIKE '%You are working on a production repository%'
);

-- Step 6: Delete from post_images (ElementCollection table)
DELETE FROM post_images 
WHERE post_id IN (
    SELECT id FROM posts 
    WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
       OR text_content ILIKE '%You are working on a production repository%'
);

-- Step 7: Finally, delete the polluted posts
DELETE FROM posts 
WHERE text_content ILIKE '%HALLUCINATION GUARD%' 
   OR text_content ILIKE '%You are working on a production repository%';

-- Log the cleanup
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'V62: Cleaned up % polluted posts and their dependent records', deleted_count;
END $$;
