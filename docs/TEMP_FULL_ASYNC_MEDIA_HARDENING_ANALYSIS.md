# TEMP Full Async UX + Media Hardening Analysis (2026-03-08)

## Scope
Implement async media lifecycle hardening and optimistic UX with no API contract changes, no Redis, and only one schema addition (`async_jobs`).

## Current Findings
- Backend already has Java 21 virtual threads enabled in `application.yml`.
- Backend media operations are currently synchronous in:
  - `PostService`
  - `HomestayService`
  - `CommentService`
- `ImageUploadService` already supports folder parameter for upload but does not support move-by-fileId and 404-safe delete semantics explicitly.
- Upload endpoints still exist (`/api/upload`, `/api/images/upload-multiple`) and are in active use by frontend.
- Frontend has partial optimistic behavior:
  - Likes already optimistic.
  - Create/update post currently wait for upload + API before visible update.
  - Delete post currently non-optimistic (invalidate only).
  - Comments have partial optimistic for text-only create.
- Homestay create/edit currently blocks on full request completion in `HomestayForm`.

## Hardening Gaps
- No Postgres-backed async queue table/entity/repository/service.
- No background worker with `FOR UPDATE SKIP LOCKED` and retry.
- Service methods perform cloud deletion synchronously.
- Temporary debug prints (`System.out.println`) present in media delete/update paths.

## Implementation Plan
1. Add `async_jobs` Flyway migration.
2. Add async job domain:
   - entity + status/type enums
   - repository with lock query (`FOR UPDATE SKIP LOCKED`)
   - enqueue service
   - worker (`@Scheduled`) dispatching with `Executors.newVirtualThreadPerTaskExecutor()`
3. Extend `ImageUploadService`:
   - `deleteFileById` (404 treated as success)
   - `moveToFolder(fileId, folder)`
4. Integrate enqueue calls in `PostService`, `HomestayService`, `CommentService` for delete/update diff cleanup and folder move jobs.
5. Frontend optimistic improvements:
   - community create/edit/delete post optimistic cache strategy
   - host homestay form optimistic transition UX (non-blocking submit state and cache seed)
6. Cleanup temporary debug logs in modified files only.
7. Compile/test pass and summarize diffs.

## Notes
- Existing uncommitted files from earlier tasks are present and will be preserved.
- This doc is intentionally temporary and tracks execution details for this task.
