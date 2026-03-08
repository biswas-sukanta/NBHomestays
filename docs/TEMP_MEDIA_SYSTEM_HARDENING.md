# TEMP: Media System Hardening Implementation Notes

Date: 2026-03-08

## Scope Implemented
- Homestay create now uploads `files` and attaches `MediaResource` to the homestay.
- Post create/repost/update now support deterministic folder upload calls using post ID.
- Image upload service now supports folder parameter (`uploadFiles(files, folder)`).
- Comment update now performs media diff cleanup against retained `fileId` set.
- Community post edit modal now initializes existing media from `postData.images` (preserves `fileId`).

## Deterministic Folder Usage
- Homestay upload calls: `homestays/{homestayId}`
- Post upload calls: `posts/{postId}`
- Generic fallback remains `/uploads` for legacy callers.

## Verification Performed
- `mvn -q -DskipTests compile` in `backend` passed.

## Files Changed
- `backend/src/main/java/com/nbh/backend/service/ImageUploadService.java`
- `backend/src/main/java/com/nbh/backend/service/HomestayService.java`
- `backend/src/main/java/com/nbh/backend/service/PostService.java`
- `backend/src/main/java/com/nbh/backend/service/CommentService.java`
- `frontend/components/community/CreatePostModal.tsx`

## Notes
- `RepostModal.tsx` required no change for this pass.
- No API contract or schema changes were introduced.
