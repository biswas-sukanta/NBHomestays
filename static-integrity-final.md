# Static Integrity Final

Date: 2026-03-22

## Migration List

- `V1__baseline.sql` - VALID
- `V2__seed_states.sql` - VALID
- `V3__normalize_states_seed.sql` - VALID
- `V4__normalize_homestay_extended_fields.sql` - VALID

Migration chain result:

- Versions present exactly: `V1`, `V2`, `V3`, `V4`
- No `V5+` files in [db/migration](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration)
- No seed, cleanup, delete, or stray migration scripts outside the expected chain

## Baseline Validation Summary

Verified in [V1__baseline.sql](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration/V1__baseline.sql):

- `review_photos.review_id` uses `ON DELETE CASCADE`
- `users.id`, `states.id`, `destinations.id`, `homestays.id`, `reviews.id`, `media_resources.id`, and `media_uploads.id` have UUID defaults
- Core boolean and counter fields such as `users.is_deleted`, `users.enabled`, `users.is_verified_host`, and `comments.helpful_count` are aligned with `NOT NULL` and defaults
- legacy post media join table is absent
- legacy comment media join table is absent
- `homestay_photos` is absent
- legacy saved-items table is absent
- `bookings` is absent

## Entity Alignment Result

Static alignment checks passed for these critical entities and fields:

- [User.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/User.java)
  - `id` uses UUID generation
  - `isDeleted`, `enabled`, `isVerifiedHost`, and `totalXp` align with the baseline schema
- [Comment.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/Comment.java)
  - `id` uses UUID generation
  - `helpfulCount` aligns with `comments.helpful_count`
  - legacy comment media mapping removed
- [Post.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/Post.java)
  - `id` uses UUID generation
  - legacy post media mapping removed
- [State.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/State.java)
  - `id` uses UUID generation
- [Destination.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/Destination.java)
  - `id` uses UUID generation
- [MediaResource.java](/C:/Users\biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/MediaResource.java)
  - `id` uses UUID generation
- [MediaUpload.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/MediaUpload.java)
  - string `id` aligns with `gen_random_uuid()::text`

## Java Code Integrity

Static grep across `backend/src/main/java` and [V1__baseline.sql](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration/V1__baseline.sql) found no remaining references to the removed legacy media and save-table identifiers.

Verified code cleanup:

- [CommentRepository.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/repository/CommentRepository.java) no longer contains native deletes against the removed legacy comment-media table
- [CommentService.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/service/CommentService.java) no longer contains legacy image fallback logic
- [PostService.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/service/PostService.java) no longer executes deletes against removed legacy comment-media data and no longer uses legacy image fallback logic
- Active media handling is through `media_resources`

## Build Result

- `mvn clean compile` - SUCCESS
- `npm run build` - SUCCESS

## Files Changed

Consistency-fix files:

- [V1__baseline.sql](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration/V1__baseline.sql)
- [Comment.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/Comment.java)
- [Post.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/model/Post.java)
- [CommentRepository.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/repository/CommentRepository.java)
- [CommentService.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/service/CommentService.java)
- [PostService.java](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/java/com/nbh/backend/service/PostService.java)
- [static-integrity-final.md](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/static-integrity-final.md)

Removed temp files:

- `frontend/tmp-feature-visibility-capture.js`
- `frontend/tmp-feature-visibility-inspect.js`
- `frontend/tmp-feature-visibility-payload-json.js`
- `frontend/tmp-feature-visibility-payload.js`
- `frontend/tmp-feature-visibility-put.js`
- `frontend/tmp-offer-probe.js`
- `frontend/tmp-offer-probe2.js`

Worktree note:

- The repository still contains unrelated modified files from earlier work. They must not be swept into this commit.

## Push Decision

Static consistency checks for this task pass.

Push is safe only as a selective commit containing the consistency-fix files above and the temp file deletions, excluding unrelated worktree changes.
