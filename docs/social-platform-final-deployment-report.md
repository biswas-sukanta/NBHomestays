# Social Platform Final Deployment Report

Verified against repository code, live database metadata, and local builds on `2026-03-15`.

## Final architecture summary

- Community posts use the `Post` entity with social fields for reposts, counts, taxonomy, editorial flags, view tracking, and trending metadata.
- Feed delivery remains built on the timeline hot window, `FeedLayoutEngine`, and cursor pagination.
- Feed scopes supported by the backend are:
  - `latest`
  - `following`
  - `trending`
  - `global` alias mapped internally to `latest`
- Trending refresh remains a scheduled Spring job and now also writes append-only analytics snapshots to `post_trending_history`.

## Database schema summary

Verified Flyway migrations:

- `V47__align_posts_schema.sql`
- `V48__add_follow_system.sql`
- `V49__add_post_type_editorial.sql`
- `V50__add_view_counter.sql`
- `V51__add_trending_score.sql`
- `V52__destination_link.sql`
- `V53__add_trending_computed_at.sql`
- `V54__community_timestamp_timezone.sql`
- `V55__post_trending_history.sql`

Verified key tables and columns:

- `posts`
  - `original_post_id`
  - `love_count`
  - `share_count`
  - `post_type`
  - `is_editorial`
  - `is_featured`
  - `is_pinned`
  - `is_trending`
  - `view_count`
  - `trending_score`
  - `trending_computed_at`
  - `editorial_score`
- `user_follows`
- `post_trending_history`
  - `id`
  - `post_id`
  - `trending_score`
  - `computed_at`

Verified timestamp safety:

- `posts.created_at` = `TIMESTAMP WITH TIME ZONE`
- `comments.created_at` = `TIMESTAMP WITH TIME ZONE`
- `post_likes.liked_at` = `TIMESTAMP WITH TIME ZONE`
- `post_timelines_global.created_at` = `TIMESTAMP WITH TIME ZONE`
- `user_follows.created_at` = `TIMESTAMP WITH TIME ZONE`
- `post_trending_history.computed_at` = `TIMESTAMP WITH TIME ZONE`

## API summary

- `GET /api/posts/feed`
- `GET /api/posts/feed?scope=latest`
- `GET /api/posts/feed?scope=following`
- `GET /api/posts/feed?scope=trending`
- `GET /api/posts/feed?scope=global`
- `GET /api/posts/trending`
- `GET /api/posts/{id}`
- `POST /api/users/{id}/follow`
- `DELETE /api/users/{id}/follow`
- `GET /api/users/{id}/profile`

## Feed engine summary

- timeline hot window remains active in `FeedService` and `TimelineRepository`
- `FeedLayoutEngine` remains active for block generation
- cursor pagination remains active for feed and trending requests
- `scope=global` now resolves to the same backend path as `scope=latest`
- trending history snapshots do not participate in feed reads

## Changes applied

- Added `scope=global` alias support in `FeedService` by normalizing it to `latest`
- Added `V55__post_trending_history.sql`
- Added `PostTrendingHistory` entity
- Added `PostTrendingHistoryRepository`
- Updated `TrendingService` to persist snapshot rows each time scores are recomputed
- Added this deployment report

## Deployment checklist

- `mvn clean install` passed
- `npm run build` passed
- Flyway `V55` applied successfully
- `post_trending_history` table exists
- existing feed scopes remain unchanged
- `scope=global` alias added without changing `latest`, `following`, or `trending`
- PostCard profile links, editorial badge, and homestay link remain present
- profile page still shows followers, following, post count, and follow button
- community trending section still calls `GET /api/posts/trending`

## Optional improvements

- retention policy for `post_trending_history`:
  - NOT FOUND IN CODEBASE
- dedicated read API for trending history analytics:
  - NOT FOUND IN CODEBASE
- automated tests for `scope=global` alias and trending snapshot writes:
  - NOT FOUND IN CODEBASE
