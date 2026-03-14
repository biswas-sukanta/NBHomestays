# Social Platform Integrity Audit v2

Generated from repository code and live schema verification on 2026-03-15.

## Issues discovered

### 1. Backend DTOs returned nullable avatar URLs instead of a single resolved source

Affected code before fix:

- `backend/src/main/java/com/nbh/backend/service/ProfileService.java`
- `backend/src/main/java/com/nbh/backend/service/PostService.java`
- `backend/src/main/java/com/nbh/backend/service/CommentService.java`
- `backend/src/main/java/com/nbh/backend/service/FeedService.java`

Root cause:

- Avatar values were sourced from `users.avatar_url`, but if that column was null the services returned null directly.
- Profile page and community UI then used separate fallback behavior.

Fix:

- Added centralized backend resolver:
  - `backend/src/main/java/com/nbh/backend/service/AvatarUrlResolver.java`
- Profile, post, feed, and comment mappings now resolve:
  - `users.avatar_url`
  - or deterministic fallback avatar generated from `userId`

### 2. Frontend had multiple independent fallback avatar paths

Verified before fix:

- `frontend/app/profile/[id]/page.tsx` used a hardcoded `AVATAR_FALLBACK` URL.
- `frontend/lib/adapters/normalizePost.ts` used `"/images/default-avatar.webp"`.
- `frontend/components/comments-section.tsx` ignored comment `author.avatarUrl` and always rendered initials for comment rows.

Root cause:

- Avatar fallback logic was not centralized.
- Server DTOs and frontend rendering paths were not aligned.

Fix:

- Added shared frontend utility:
  - `frontend/lib/avatar.ts`
- Updated:
  - `frontend/app/profile/[id]/page.tsx`
  - `frontend/lib/adapters/normalizePost.ts`
  - `frontend/components/comments-section.tsx`
  - `frontend/components/community/CreatePostModal.tsx`
  - `frontend/components/community/sidebar.tsx`
- Profile page and community feed now use the same deterministic fallback path.

### 3. Timeline feed path still depended on denormalized author snapshot data

Verified in code:

- `post_timelines_global.author_avatar_url` exists in:
  - `backend/src/main/java/com/nbh/backend/model/PostTimeline.java`
  - `backend/src/main/java/com/nbh/backend/repository/TimelineRepository.java`

Root cause:

- Timeline storage contains denormalized author snapshot data for hot-window performance.
- The feed DTO path previously had fallback behavior that could use timeline snapshot values.

Fix:

- Added `UserRepository.findSocialAuthorsByIds(...)` native query so feed author identity is loaded from the `users` table.
- `FeedService` now resolves author avatar through `AvatarUrlResolver` using user-table data.

Current status:

- `post_timelines_global.author_avatar_url` still exists as denormalized storage.
- Feed DTO mapping no longer relies on it as the primary avatar source.

## Verified findings

### Avatar source audit

Verified from repository code:

- `users.avatar_url`: EXISTS IN CODEBASE
- `posts.author_avatar`: NOT FOUND IN CODEBASE
- `posts.author_avatar_url`: NOT FOUND IN CODEBASE
- `PostDto.authorAvatar` stored independently: NOT FOUND IN CODEBASE
- `HostProfileDto.avatar`: EXISTS IN CODEBASE
- `PostFeedDto.authorAvatarUrl`: EXISTS IN CODEBASE
- `CommentDto.author.avatarUrl`: EXISTS IN CODEBASE through nested `AuthorDto`

### Single-source avatar rule

Current effective source:

- Backend social DTOs now resolve avatar from `users.avatar_url`
- If null, backend returns deterministic fallback generated from `userId`

### Follow system integrity

Verified:

- `user_follows` composite primary key exists on `(follower_user_id, followed_user_id)`
- foreign keys exist for:
  - `follower_user_id`
  - `followed_user_id`
- follow lookup is viewer/profile specific in:
  - `UserFollowRepository.isFollowing(...)`
  - `ProfileService.getProfile(UUID userId, UUID viewerUserId)`
- profile follow state is not cached in a viewer-unsafe backend cache

### Cache audit

Verified in code:

- No backend profile cache keyed only by `profileId` was found.
- Feed cache key includes `userId` in `FeedCacheService.generateKey(...)`.
- Frontend React Query keys now include viewer context for:
  - profile
  - community feed
  - community trending

### DTO consistency

Verified after fix:

- `PostDto.Response.author.id`, `.name`, `.avatarUrl` are sourced from the user relationship or SQL join on `users`
- `PostFeedDto.authorId`, `.authorName`, `.authorAvatarUrl` are sourced from `users`
- `CommentDto.author.id`, `.name`, `.avatarUrl` are sourced from `users`
- `HostProfileDto.avatar` is sourced from `users`

### Counter integrity

Verified in code:

- `followersCount` from `UserFollowRepository.countByFollowedUserId(...)`
- `followingCount` from `UserFollowRepository.countByFollowerUserId(...)`
- `postCount` from `PostRepository.countByUser_IdAndIsDeletedFalse(...)`
- `viewCount` persisted in `posts.view_count` and incremented by `ViewTrackingService`
- feed `likeCount` comes from persisted counts / aggregation queries

## Code fixes applied

- Added `backend/src/main/java/com/nbh/backend/service/AvatarUrlResolver.java`
- Updated `backend/src/main/java/com/nbh/backend/repository/UserRepository.java`
- Updated `backend/src/main/java/com/nbh/backend/service/ProfileService.java`
- Updated `backend/src/main/java/com/nbh/backend/service/PostService.java`
- Updated `backend/src/main/java/com/nbh/backend/service/CommentService.java`
- Updated `backend/src/main/java/com/nbh/backend/service/FeedService.java`
- Added `frontend/lib/avatar.ts`
- Updated `frontend/lib/adapters/normalizePost.ts`
- Updated `frontend/app/profile/[id]/page.tsx`
- Updated `frontend/components/comments-section.tsx`
- Updated `frontend/components/community/CreatePostModal.tsx`
- Updated `frontend/components/community/sidebar.tsx`

## Verification steps

Schema checks:

- verified `posts.author_avatar` and `posts.author_avatar_url` are absent in the live schema
- verified `user_follows` PK/FK/indexes in the live schema

Build checks:

- `mvn clean install`
- `npm run build`

Result:

- both builds passed
