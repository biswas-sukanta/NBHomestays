# Social Platform Integrity Audit

Generated from repository code and live database inspection on 2026-03-15.

## Discovered issues

### 1. Viewer-sensitive frontend queries were keyed without viewer context

Affected code:

- `frontend/lib/queryKeys.ts`
- `frontend/app/profile/[id]/page.tsx`
- `frontend/app/community/page.tsx`
- `frontend/components/community/CreatePostModal.tsx`
- `frontend/components/community/PostCard.tsx`
- `frontend/components/community/PostInteractionBar.tsx`
- `frontend/components/community/RepostModal.tsx`

Root cause:

- Profile responses include `isFollowing`, which depends on the authenticated viewer.
- Feed and trending responses include viewer-specific fields such as `isLikedByCurrentUser`.
- Several React Query keys depended only on profile ID or feed scope and could be reused across different viewers in the same browser session.

Fix applied:

- Added viewer-aware query keys for:
  - `queryKeys.users.profile(id, viewerId)`
  - `queryKeys.community.feed(tag, scope, viewerId)`
  - `queryKeys.community.trending(viewerId)`
- Updated follow, repost, create-post, like, share, and feed/profile query invalidation paths to use viewer-aware keys or stable prefixes.

### 2. Concurrent follow requests could still surface a duplicate-key error

Affected code:

- `backend/src/main/java/com/nbh/backend/service/FollowService.java`

Root cause:

- `FollowService.followUser(...)` checked existence before insert, but two concurrent requests could still race between the existence check and insert.
- The composite primary key prevented duplicate rows, but the request could still fail with a `DataIntegrityViolationException`.

Fix applied:

- Kept the explicit existence check.
- Wrapped insert in `try/catch`.
- Treat concurrent duplicate inserts as idempotent success when the follow edge now exists.

### 3. Timeline feed path used denormalized author snapshot data

Affected code:

- `backend/src/main/java/com/nbh/backend/service/FeedService.java`

Root cause:

- Timeline rows store denormalized author fields, including `author_avatar_url`.
- Timeline feed mapping previously returned timeline snapshot values directly.
- Profile and direct-feed queries already source avatar/name from `users`, so the timeline path could drift from current user profile data.

Fix applied:

- Added current-author batch loading from `users`.
- Timeline feed DTO mapping now prefers current `users` values for:
  - author name
  - avatar URL
  - role
  - verified-host flag
- Timeline snapshot values remain as fallback only if the user row is unavailable.

## Database audit results

Verified against the live PostgreSQL schema:

- `user_follows` primary key exists on `(follower_user_id, followed_user_id)`.
- Foreign keys exist:
  - `follower_user_id -> users(id)`
  - `followed_user_id -> users(id)`
- `chk_user_follows_no_self_follow` exists.
- Duplicate follow edges: none found.
- Follow indexes exist:
  - `idx_user_follows_followed_user`
  - `idx_user_follows_follower_user`
- Post indexes exist:
  - `idx_posts_feed_sort`
  - `idx_posts_trending`
- Timestamp columns are `timestamp with time zone` for:
  - `posts.created_at`
  - `posts.trending_computed_at`
  - `comments.created_at`
  - `post_likes.liked_at`
  - `post_timelines_global.created_at`
  - `user_follows.created_at`

Database fixes applied:

- NOT FOUND IN CODEBASE

Reason:

- The schema audit found the database constraints, indexes, and timestamp types already in the expected state.

## Follow/profile verification

Verified in code:

- `UserFollowRepository.isFollowing(...)` uses:

```sql
SELECT EXISTS (
    SELECT 1
    FROM user_follows
    WHERE follower_user_id = :followerUserId
      AND followed_user_id = :followedUserId
)
```

- `ProfileService.getProfile(UUID userId, UUID viewerUserId)` computes:
  - `followersCount` via `countByFollowedUserId`
  - `followingCount` via `countByFollowerUserId`
  - `postCount` via `countByUser_IdAndIsDeletedFalse`
  - `isFollowing` via `userFollowRepository.isFollowing(viewerUserId, userId)`
- No profile cache keyed only by `profileId` was found in backend Caffeine/Redis cache annotations.

## Avatar source verification

Verified in code:

- `PostDto` author avatar comes from `users.avatar_url` through `PostService`.
- Direct feed queries source avatar from `users.avatar_url` through `FeedRepository`.
- Profile DTO avatar comes from `User.avatarUrl`.
- `posts.avatar_url`: NOT FOUND IN CODEBASE.

Current consistency after fix:

- Profile page and community feed now read avatar/name from the same source in active code paths: the `users` table.

## Final system verification

Build verification:

- `mvn clean install` passed.
- `npm run build` passed.

Backend integrity status:

- Follow graph constraints verified.
- Follow idempotency hardened for concurrent requests.
- Viewer-specific `isFollowing` computation verified.
- Viewer-unsafe backend profile cache: NOT FOUND IN CODEBASE.

Frontend integrity status:

- Profile query keys now include viewer context.
- Feed/trending query keys now include viewer context where the response is viewer-specific.
- Follow/like/repost/create-post cache invalidation paths were updated accordingly.
