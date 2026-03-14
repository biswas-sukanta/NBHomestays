# Social Platform Architecture

Verified against repository code and database-backed verification documents on `2026-03-15`.

## 1. Architecture Overview

The community system is implemented as a social platform on top of the existing Spring Boot and Next.js application. The backend uses JPA entities, Flyway migrations, PostgreSQL, and scheduled Spring jobs. The frontend uses Next.js, React, React Query, and Tailwind. The feed architecture remains based on the timeline hot window, `FeedLayoutEngine`, and cursor pagination.

The social-platform implementation is additive. Existing post, profile, and feed routes remain in place, while follow graph support, trending computation, view tracking, taxonomy, and profile aggregation are layered onto the existing system.

## 2. Post Data Model

Verified in `backend/src/main/java/com/nbh/backend/model/Post.java`.

The `Post` entity includes:

- `id`
- `user`
- `originalPost` mapped to `original_post_id`
- `homestay`
- `destination`
- `locationName`
- `textContent`
- `mediaFiles`
- `legacyImageUrls`
- `tags`
- `createdAt` mapped as `Instant`
- `comments`
- `loveCount`
- `shareCount`
- `postType`
- `isEditorial`
- `isFeatured`
- `isPinned`
- `isTrending`
- `viewCount`
- `trendingScore`
- `trendingComputedAt`
- `editorialScore`

The `PostService` sets `isEditorial = true` for `ROLE_ADMIN` authors and validates submitted tags against `VibeTag`.

## 3. Tag Taxonomy

Verified in:

- `backend/src/main/java/com/nbh/backend/model/PostType.java`
- `backend/src/main/java/com/nbh/backend/model/VibeTag.java`
- `backend/src/main/java/com/nbh/backend/service/PostService.java`

`PostType` values:

- `QUESTION`
- `TRIP_REPORT`
- `REVIEW`
- `ALERT`
- `PHOTO`
- `STORY`

`VibeTag` values:

- `Hidden Gem`
- `Offbeat`
- `Sunrise`
- `Heritage`
- `Food`
- `Local Tips`
- `Transport`

Tag validation is implemented in `PostService.validatePostRequest(...)` using `VibeTag.isAllowed(...)`. Invalid submitted tags fail with `400 BAD_REQUEST`.

System flags are modeled as post fields, not as tags:

- `isEditorial`
- `isFeatured`
- `isPinned`
- `isTrending`

## 4. Social Graph

Verified in:

- `backend/src/main/resources/db/migration/V48__add_follow_system.sql`
- `backend/src/main/java/com/nbh/backend/model/UserFollow.java`
- `backend/src/main/java/com/nbh/backend/repository/UserFollowRepository.java`
- `backend/src/main/java/com/nbh/backend/service/FollowService.java`
- `backend/src/main/java/com/nbh/backend/controller/UserController.java`

The follow graph is stored in `user_follows` with:

- `follower_user_id`
- `followed_user_id`
- `created_at`

Composite primary key:

- `(follower_user_id, followed_user_id)`

Endpoints:

- `POST /api/users/{id}/follow`
- `DELETE /api/users/{id}/follow`

`FollowService` enforces:

- authenticated current user lookup
- no self-follow
- idempotent follow requests
- unfollow support
- follower/following count queries

## 5. Profile System

Verified in:

- `backend/src/main/java/com/nbh/backend/dto/HostProfileDto.java`
- `backend/src/main/java/com/nbh/backend/service/ProfileService.java`
- `frontend/app/profile/[id]/page.tsx`

`HostProfileDto` exposes:

- `id`
- `firstName`
- `lastName`
- `username`
- `avatar`
- `bio`
- `communityPoints`
- `badges`
- `verifiedHost`
- `followersCount`
- `followingCount`
- `postCount`
- `isFollowing`
- `homestays`
- `posts`

The public profile page renders:

- avatar
- username
- bio
- verified host badge
- followers count
- following count
- post count
- follow/unfollow button
- own-profile `Edit Profile` button

## 6. Feed Engine

Verified in:

- `backend/src/main/java/com/nbh/backend/service/FeedService.java`
- `backend/src/main/java/com/nbh/backend/service/FeedLayoutEngine.java`
- `backend/src/main/java/com/nbh/backend/service/TimelineService.java`
- `backend/src/main/java/com/nbh/backend/controller/PostController.java`

The feed engine preserves:

- timeline hot window
- `FeedLayoutEngine`
- cursor pagination

Supported feed scopes:

- `latest`
- `following`
- `trending`
- `global` alias mapped internally to `latest`

Feed endpoints:

- `GET /api/posts/feed`
- `GET /api/posts/feed?scope=latest`
- `GET /api/posts/feed?scope=following`
- `GET /api/posts/feed?scope=trending`
- `GET /api/posts/feed?scope=global`

`latest` is the default feed scope.

## 7. Trending Algorithm

Verified in:

- `backend/src/main/java/com/nbh/backend/service/TrendingService.java`
- `backend/src/main/java/com/nbh/backend/job/TrendingScoreJob.java`
- `backend/src/main/resources/db/migration/V53__add_trending_computed_at.sql`
- `backend/src/main/resources/db/migration/V55__post_trending_history.sql`

Trending score is recalculated by `TrendingService.refreshTrendingScores()` and scheduled by `TrendingScoreJob`.

Trending inputs used in code:

- love count
- comment count
- share count
- view count
- recency decay from post age

Trending fields stored on `posts`:

- `trending_score`
- `trending_computed_at`
- `is_trending`

Trending endpoint:

- `GET /api/posts/trending`

Optional analytics history is stored in `post_trending_history`:

- `id`
- `post_id`
- `trending_score`
- `computed_at`

This history table does not participate in feed queries.

## 8. Database Schema

Verified across the community schema migrations and readiness documents.

Core community tables:

- `posts`
- `comments`
- `post_likes`
- `post_tags`
- `post_timelines_global`
- `user_follows`
- `post_trending_history`

Community timestamp safety is implemented with `TIMESTAMP WITH TIME ZONE` for:

- `posts.created_at`
- `posts.trending_computed_at`
- `comments.created_at`
- `post_likes.liked_at`
- `post_timelines_global.created_at`
- `user_follows.created_at`
- `post_trending_history.computed_at`

Community entities use `Instant` in:

- `Post`
- `Comment`
- `PostLike`
- `PostTimeline`
- `PostTrendingHistory`

## 9. Flyway Migrations

Verified social-platform migration sequence:

- `V47__align_posts_schema.sql`
- `V48__add_follow_system.sql`
- `V49__add_post_type_editorial.sql`
- `V50__add_view_counter.sql`
- `V51__add_trending_score.sql`
- `V52__destination_link.sql`
- `V53__add_trending_computed_at.sql`
- `V54__community_timestamp_timezone.sql`
- `V55__post_trending_history.sql`

Migration outcomes:

- post schema aligned with code
- follow system introduced
- taxonomy and editorial fields added
- view counter added
- trending score and timestamp added
- destination link fields added
- community timestamps converted to timezone-safe storage
- trending history snapshots added

## 10. API Design

Verified active backend endpoints:

- `GET /api/posts`
- `GET /api/posts/feed`
- `GET /api/posts/trending`
- `GET /api/posts/{id}`
- `POST /api/posts`
- `PUT /api/posts/{id}`
- `DELETE /api/posts/{id}`
- `POST /api/posts/{id}/like`
- `DELETE /api/posts/{id}/like`
- `POST /api/posts/{id}/share`
- `POST /api/posts/{id}/repost`
- `GET /api/users/{id}/profile`
- `PUT /api/users/profile`
- `POST /api/users/{id}/follow`
- `DELETE /api/users/{id}/follow`

Frontend community trending uses `GET /api/posts/trending`.

Frontend PostCard behavior includes:

- avatar links to `/profile/[id]`
- username links to `/profile/[id]`
- editorial badge
- homestay link

## 11. Performance Indexes

Verified indexes:

- `idx_posts_feed_sort` on `posts (created_at DESC, id DESC)`
- `idx_posts_trending` on `posts (trending_score DESC, created_at DESC)`
- `idx_user_follows_followed_user` on `user_follows (followed_user_id, created_at DESC)`
- `idx_user_follows_follower_user` on `user_follows (follower_user_id, created_at DESC)`
- `idx_post_trending_history_post_id_computed_at` on `post_trending_history (post_id, computed_at DESC)`
- `idx_post_trending_history_computed_at` on `post_trending_history (computed_at DESC)`

These indexes support:

- feed sort order
- trending sort order
- follower/following lookups
- trending-history analytics lookups

## 12. Deployment Checklist

Verified deployment-ready checks:

- `mvn clean install` passed
- `npm run build` passed
- Flyway migrations through `V55` applied
- `post_trending_history` exists
- `scope=global` alias resolves to `latest`
- community timestamps use `TIMESTAMP WITH TIME ZONE`
- frontend trending section calls `GET /api/posts/trending`
- profile page renders followers, following, post count, and follow button
- PostCard renders profile links, editorial badge, and homestay link

Optional improvements still `NOT FOUND IN CODEBASE`:

- retention policy for `post_trending_history`
- dedicated read API for trending-history analytics
- automated tests for `scope=global` alias and trending snapshot persistence
