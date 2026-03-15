# Community Feed System

**Single source of truth for the feed architecture.** Verified against codebase on 2026-03-15.

---

## 1. Feed Architecture

### 1.1 Feed Scopes

| Scope | Description | Data Source | Ordering |
|-------|-------------|-------------|----------|
| `latest` | All posts, newest first | `post_timelines_global` (hot window) → fallback to `posts` | `created_at DESC` |
| `following` | Posts from followed users | `posts` + `user_follows` join | `created_at DESC` |
| `trending` | Trending posts | `posts` direct | `trending_score DESC` |
| `global` | Alias for `latest` | Same as latest | Same as latest |

### 1.2 Timeline Hot Window

The feed uses a precomputed timeline table for performance:

```
post_timelines_global
├── post_id (FK to posts)
├── created_at (post creation time)
└── score (computed relevance)
```

**Behavior:**
- Max 1000 posts in hot window
- Pruned every 100 inserts
- Backfilled on startup if empty (`InfrastructureHealthCheck`)
- Falls back to direct `posts` query if timeline is empty

### 1.3 Cursor Pagination

Feed uses cursor-based pagination for infinite scroll:

**Cursor format:** Base64-encoded JSON `{id, createdAt, trendingScore?, previousBlockType?}`

**Request:**
```
GET /api/posts/feed?cursor=eyJpZCI6IjEyMyIsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMDEifQ==&limit=12
```

**Response:**
```json
{
  "posts": ["PostFeedDto"],
  "nextCursor": "ey...",
  "hasMore": true,
  "blocks": ["FeedBlockDto"]
}
```

---

## 2. SQL Queries (Canonical)

### 2.1 Latest Feed

**First page (timeline):**
```sql
SELECT t FROM PostTimeline t
WHERE t.isDeleted = false
ORDER BY t.createdAt DESC, t.postId DESC
LIMIT 13
```

**With cursor:**
```sql
SELECT t FROM PostTimeline t
WHERE t.isDeleted = false
  AND (t.createdAt < :cursorCreatedAt
       OR (t.createdAt = :cursorCreatedAt AND t.postId < :cursorId))
ORDER BY t.createdAt DESC, t.postId DESC
LIMIT 13
```

**Fallback (posts direct):**
```sql
SELECT p.id, p.text_content, p.created_at, ...
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.is_deleted = false
ORDER BY p.created_at DESC, p.id DESC
LIMIT :limit
```

### 2.2 Following Feed

```sql
SELECT p.id, p.text_content, p.created_at, ...
FROM posts p
INNER JOIN users u ON p.user_id = u.id
LEFT JOIN homestays h ON p.homestay_id = h.id
LEFT JOIN posts op ON p.original_post_id = op.id
LEFT JOIN users ou ON op.user_id = ou.id
INNER JOIN user_follows uf ON uf.followed_user_id = p.user_id
WHERE p.is_deleted = false
  AND uf.follower_user_id = :viewerUserId
ORDER BY p.created_at DESC, p.id DESC
LIMIT :limit
```

**Join condition:** `uf.followed_user_id = p.user_id` ✅

### 2.3 Trending Feed

```sql
SELECT p.id, p.text_content, p.created_at, ...
FROM posts p
INNER JOIN users u ON p.user_id = u.id
WHERE p.is_deleted = false
  AND p.trending_score IS NOT NULL
ORDER BY p.trending_score DESC, p.created_at DESC, p.id DESC
LIMIT :limit
```

---

## 3. Trending Algorithm

### 3.1 Score Formula

```
engagement = (loveCount * 3.0) + (commentCount * 4.0) + (shareCount * 5.0) + (viewCount * 0.2)
recencyBoost = 24.0 / max(ageHours, 1.0)
score = engagement + recencyBoost
```

**Weight rationale:**
- Shares (5.0) - highest: content worth spreading
- Comments (4.0) - high: active discussion
- Likes (3.0) - moderate: passive engagement
- Views (0.2) - low: passive consumption
- Recency boost ensures newer posts get visibility

### 3.2 Computation Triggers

| Trigger | Method |
|---------|--------|
| Startup | `InfrastructureHealthCheck` → `TrendingService.refreshTrendingScores()` |
| Like event | `PostService.like()` → `TrendingService.updatePostTrendingScore()` |
| Unlike event | `PostService.unlike()` → `TrendingService.updatePostTrendingScore()` |
| Share event | `PostService.incrementShare()` → `TrendingService.updatePostTrendingScore()` |
| Scheduled | `TrendingScoreJob` every 15 min (`@Scheduled(cron = "0 */15 * * * *")`) |

### 3.3 Trending Fields

| Field | Type | Description |
|-------|------|-------------|
| `trendingScore` | `double` | Computed score |
| `trendingComputedAt` | `Instant` | Last computation time |
| `isTrending` | `boolean` | Whether in top 20 by score |

---

## 4. Engagement Counters

### 4.1 Source of Truth

All counters stored in `posts` table (no dynamic aggregation):

| Counter | Column | Type |
|---------|--------|------|
| `likeCount` | `posts.love_count` | `INTEGER` |
| `commentCount` | `posts.comment_count` | `INTEGER` |
| `shareCount` | `posts.share_count` | `INTEGER` |
| `viewCount` | `posts.view_count` | `INTEGER` |

### 4.2 Consistency Guarantee

Same post shows identical counters across all feeds (latest, trending, following).

---

## 5. FeedLayoutEngine

### 5.1 Block Types

| Block | Aspect Ratio | Description |
|-------|--------------|-------------|
| `FEATURED` | 16:9 | Wide cinematic |
| `HERO` | 16:9 | Large hero post |
| `STANDARD` | 4:5 | Standard post |
| `COLLAGE` | 4:5 | Multi-image grid |
| `PHOTO` | 4:5 | Photo-focused short text |

### 5.2 Scoring Formula

```
score = (likeCount * 2) + (commentCount * 3) + (shareCount * 4) + (mediaCount * 2) + postPriority
```

### 5.3 Diversity Rules

- Max 2 consecutive same block types
- Max 2 posts per author in sequence
- Max 3 same-tag cluster

---

## 6. API Endpoints

### 6.1 Feed Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts/feed` | Get feed (default: latest) |
| `GET` | `/api/posts/feed?scope=latest` | Latest posts |
| `GET` | `/api/posts/feed?scope=following` | Following feed (requires auth) |
| `GET` | `/api/posts/feed?scope=trending` | Trending feed |
| `GET` | `/api/posts/trending` | Dedicated trending endpoint |

### 6.2 Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cursor` | String | null | Pagination cursor |
| `limit` | Integer | 12 | Page size |
| `scope` | String | latest | Feed scope |
| `tag` | String | null | Filter by vibe tag |

---

## 7. Frontend Components

### 7.1 File Locations

```
frontend/
├── app/community/page.tsx          # Feed page with infinite scroll
├── components/community/
│   ├── PostCardUnified.tsx         # Main post card (avatar/username clickable)
│   ├── PostInteractionBar.tsx      # Like/comment/share actions
│   ├── ImageCarousel.tsx           # Multi-image carousel
│   ├── ImageLightbox.tsx           # Full-screen image viewer
│   └── CreatePostModal.tsx         # Post creation
├── lib/api/feed.ts                 # Feed API client
├── lib/api-client.ts               # Axios instance + JWT interceptor
└── lib/adapters/normalizePost.ts  # API response normalization
```

### 7.2 PostCardUnified Features

- Avatar links to `/profile/[authorId]` (clickable on all post types)
- Username links to `/profile/[authorId]` (clickable on all post types)
- Editorial badge for admin posts
- Homestay link when tagged
- Image lightbox for multi-image posts
- Interaction bar (like, comment, repost, share)

### 7.3 Feed Scope Buttons

**Implementation:** Plain `<button>` elements (NOT `role="tab"`)

**Selectors:**
```typescript
page.getByRole('button', { name: 'Latest' })
page.getByRole('button', { name: 'Trending' })
page.getByRole('button', { name: 'Following' })
```

### 7.4 Empty State

Following feed shows empty state when no followed users or no posts:

**Selector:** `getByText(/Deep silence|No stories found/)`

---

## 8. Authentication Requirements

### 8.1 Public Endpoints

- `GET /api/posts/feed?scope=latest`
- `GET /api/posts/feed?scope=trending`
- `GET /api/posts/{id}`

### 8.2 Authenticated Endpoints

- `GET /api/posts/feed?scope=following` - Requires auth to identify viewer
- `POST /api/posts` - Create post
- `POST /api/posts/{id}/like` - Like post
- `DELETE /api/posts/{id}/like` - Unlike post
- `POST /api/posts/{id}/share` - Share post
- `POST /api/posts/{id}/repost` - Repost

### 8.3 Known Issue (Fixed)

**Bug:** Following feed returned empty despite correct API results.

**Root Cause:** `/api/posts` was in `PUBLIC_ENDPOINTS` array in `api-client.ts`, preventing auth headers from being sent.

**Fix:** Removed `/api/posts` from public endpoints array.

---

## 9. Database Indexes

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_posts_feed_sort` | `posts` | Feed sort order |
| `idx_posts_trending` | `posts` | Trending sort |
| `idx_user_follows_followed_user` | `user_follows` | Follower lookups |
| `idx_user_follows_follower_user` | `user_follows` | Following lookups |

---

## 10. Timestamp Safety

Community tables use `TIMESTAMP WITH TIME ZONE` for UTC-safe storage:

| Table | Column |
|-------|--------|
| `posts` | `created_at`, `trending_computed_at` |
| `comments` | `created_at` |
| `post_likes` | `liked_at` |
| `post_timelines_global` | `created_at` |
| `user_follows` | `created_at` |

Java entities use `Instant` for these fields.

---

## 11. Troubleshooting

### 11.1 Following Feed Empty

**SQL is correct.** Empty results indicate:
1. User has no follow relationships in `user_follows`
2. Followed users have no posts
3. Posts from followed users are soft-deleted

**Diagnostic query:**
```sql
SELECT uf.follower_user_id, uf.followed_user_id, COUNT(p.id) as post_count
FROM user_follows uf
LEFT JOIN posts p ON p.user_id = uf.followed_user_id AND p.is_deleted = false
GROUP BY uf.follower_user_id, uf.followed_user_id;
```

### 11.2 Latest Feed Shows Fewer Posts Than Trending

**Cause:** Timeline table partially populated.

**Solution:** Timeline backfill runs on startup. Verify `InfrastructureHealthCheck` logs.

### 11.3 Trending Feed Identical to Latest

**Cause:** All posts have `trending_score = 0`.

**Solution:** Trending scores computed on startup and engagement events. Verify `TrendingScoreJob` is running.

---

## 12. Test Verification

**Test file:** `frontend/tests/community/community-canonical-feed.spec.ts`

**Run command:**
```bash
cd frontend
npx playwright test tests/community/community-canonical-feed.spec.ts
```

**Scenarios covered:**
1. Admin creates post, appears in Latest feed
2. Following tab shows posts from followed users / empty state
3. Feed scope buttons switch correctly
4. Engagement counters display on posts
5. Trending feed shows posts with high trending scores
6. Following feed filters by follow relationships
7. Follow/unfollow via profile page UI
8. Like interactions persist across tab switches
9. Unfollow reflects immediately in Following feed
