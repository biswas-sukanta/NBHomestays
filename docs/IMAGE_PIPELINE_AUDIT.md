# Image Upload -> Storage -> API -> Rendering Audit

Date: 2026-03-08
Scope: Read-only system audit (no code changes)

## 1) Pipeline Architecture

Flow:
1. Frontend selects files and uploads via multipart endpoint.
2. Backend upload controller calls `ImageUploadService`.
3. `ImageUploadService` uploads to ImageKit and returns `MediaResource` objects containing `url` + `fileId`.
4. Frontend includes returned media metadata in entity create/update payload (`request.media`).
5. Entity services map `request.media` into `MediaResource` rows linked by FK (`post_id`, `homestay_id`, `comment_id`).
6. Service DTO mapping returns `media[]` to frontend.
7. Frontend renders images from `media[]` (community) or homestay `media[]`.

Primary files:
- `backend/src/main/java/com/nbh/backend/controller/UploadController.java`
- `backend/src/main/java/com/nbh/backend/controller/ImageController.java`
- `backend/src/main/java/com/nbh/backend/service/ImageUploadService.java`
- `backend/src/main/java/com/nbh/backend/model/MediaResource.java`
- `backend/src/main/resources/db/migration/V26__media_resource_entity.sql`

## 2) Upload Pipeline Audit Findings

### Upload success + metadata return
- Confirmed: upload service returns `url` and `fileId` from ImageKit.
- Confirmed: upload endpoints return `List<MediaResource>` JSON to frontend.

### Persistence behavior
- Important: Upload endpoints do **not** persist DB rows themselves. They only return metadata.
- Persistence occurs only when the caller later submits entity create/update with `request.media`.

## 3) Database Storage Audit

`media_resources` stores:
- `id`
- `url`
- `file_id`
- `post_id`
- `homestay_id`
- `comment_id`

Entity relationship model is FK-based (post/homestay/comment), not polymorphic `entityType/entityId`.

## 4) DTO Mapping Audit

DTO media presence:
- `PostDto.Response.media`
- `CommentDto.media`
- `HomestayDto.Response.media`

Service mapping:
- `PostService.mapToResponse` maps `MediaResource -> MediaDto` with legacy fallback.
- `CommentService.toDto` maps `MediaResource -> MediaDto` with legacy fallback.
- `HomestayService.mapToResponse` maps `MediaResource -> MediaDto`.
- Search path (`searchCards`) maps only one cover URL into a single-item `media[]`.

## 5) Repository Query Audit

Homestays:
- Details and some destination methods use `JOIN FETCH` for media.
- Search-card query uses projection + subquery:
  - `(SELECT mr.url FROM media_resources mr WHERE mr.homestay_id = h.id ORDER BY mr.id ASC LIMIT 1) AS cover_image_url`

Posts/comments:
- Repositories do not `JOIN FETCH` media in list methods.
- Mapping still accesses media in service layer; this can cause extra lazy-loading overhead but not necessarily missing data by itself.

## 6) Frontend Rendering Audit

Homestays:
- Card/detail consume `homestay.media` and use first item as cover/display.

Community posts:
- Backend `media[]` is normalized in `normalizePost` to:
  - `imageUrl = media[0]?.url`
  - `images = media`
- `PostCard` renders from `post.imageUrl` / `post.images`.

Comments:
- `comments-section` renders `comment.media` via collage/lightbox.

## 7) ImageKit URL Usage Audit

- Frontend loads ImageKit URLs directly (`ik.imagekit.io`) and appends transform params client-side.
- No backend media proxy layer found.

## 8) Missing / Risky Cover Image Logic

- Cover selection for homestay search is implicit by `ORDER BY mr.id ASC`.
- No `isCover=true` semantics in schema.
- Result: cover image may not match intended hero image.

## 9) Discovered Inconsistencies (Root Causes)

### A. Homestay create ignores uploaded files (critical)
- `createHomestay(..., files, ...)` accepts files but does not call `uploadFiles(files)`.
- It only maps `request.media`.
- Frontend sends files in FormData, so create flow can produce homestays without persisted media rows.
- Symptom match: images appear uploaded in UX flow but missing in cards/details.

### B. Community post edit can lose existing media (critical)
- Edit modal initializes existing media from only `postData.imageUrl` (single URL), not full `postData.images` with `fileId`.
- Backend update retention logic is `fileId`-based.
- Missing `fileId` in update payload can cause old media deletion/orphan cleanup.
- Symptom match: images disappear after editing posts.

### C. Schema expectation mismatch
- Requested audit expected `entityType/entityId`, but implementation uses FK columns.
- Not a bug by itself; document alignment needed.

## 10) Recommended Fix Plan (Not Applied)

1. `HomestayService.createHomestay`
- If `files` present, call `imageUploadService.uploadFiles(files)`.
- Set `res.setHomestay(homestay)` and merge into `homestay.mediaFiles` before save.

2. `CreatePostModal`
- Initialize `existingMedia` from full `postData.images` (include `fileId`) instead of only `postData.imageUrl`.
- Submit full retained media array on edit.

3. Cover image determinism
- Introduce explicit cover indicator (`is_cover`) or dedicated cover reference.
- Replace `ORDER BY mr.id ASC` heuristic.

4. Optional performance hardening
- Evaluate fetch strategy for posts/comments media under pagination to reduce lazy-load churn.

## 11) Files Involved

Backend:
- `backend/src/main/java/com/nbh/backend/controller/UploadController.java`
- `backend/src/main/java/com/nbh/backend/controller/ImageController.java`
- `backend/src/main/java/com/nbh/backend/service/ImageUploadService.java`
- `backend/src/main/java/com/nbh/backend/service/HomestayService.java`
- `backend/src/main/java/com/nbh/backend/service/PostService.java`
- `backend/src/main/java/com/nbh/backend/service/CommentService.java`
- `backend/src/main/java/com/nbh/backend/repository/HomestayRepositoryImpl.java`
- `backend/src/main/java/com/nbh/backend/model/MediaResource.java`
- `backend/src/main/resources/db/migration/V26__media_resource_entity.sql`

Frontend:
- `frontend/components/host/HomestayForm.tsx`
- `frontend/components/community/CreatePostModal.tsx`
- `frontend/components/community/RepostModal.tsx`
- `frontend/components/comments-section.tsx`
- `frontend/components/community/PostCard.tsx`
- `frontend/lib/adapters/normalizePost.ts`
- `frontend/components/homestay-card.tsx`
- `frontend/app/homestays/[id]/page.tsx`
- `frontend/components/ui/optimized-image.tsx`
- `frontend/next.config.ts`

---
No code changes were applied as part of this audit.
