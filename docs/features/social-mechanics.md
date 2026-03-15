# Social Mechanics

**Single source of truth for social interactions.** Verified against codebase on 2026-03-15.

---

## 1. Follow System

### 1.1 Database Schema

```sql
CREATE TABLE user_follows (
    follower_user_id UUID NOT NULL REFERENCES users(id),
    followed_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_user_id, followed_user_id),
    CONSTRAINT chk_no_self_follow CHECK (follower_user_id <> followed_user_id)
);
```

### 1.2 Entity & Repository

**Entity:** `backend/src/main/java/com/nbh/backend/model/UserFollow.java`

**Repository:** `backend/src/main/java/com/nbh/backend/repository/UserFollowRepository.java`

**Service:** `backend/src/main/java/com/nbh/backend/service/FollowService.java`

### 1.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/{id}/follow` | Follow a user |
| `DELETE` | `/api/users/{id}/follow` | Unfollow a user |

### 1.4 Response Format

```json
{
  "isFollowing": true,
  "followersCount": 42,
  "followingCount": 15
}
```

### 1.5 Business Rules

- No self-follow (enforced by DB constraint and service)
- Idempotent follow requests (duplicate requests return success)
- Follower/following counts computed on demand (not stored on users table)

### 1.6 Concurrent Request Handling

**Issue:** Concurrent follow requests could cause duplicate-key error.

**Solution:**
1. Explicit existence check before insert
2. Insert wrapped in try/catch
3. Concurrent duplicate inserts treated as idempotent success

```java
// FollowService.java
try {
    userFollowRepository.save(follow);
} catch (DataIntegrityViolationException e) {
    // Concurrent insert - check if follow now exists
    if (userFollowRepository.existsByFollowerAndFollowed(followerId, followedId)) {
        return; // Idempotent success
    }
    throw e;
}
```

---

## 2. Like System

### 2.1 Database Schema

```sql
CREATE TABLE post_likes (
    post_id UUID NOT NULL REFERENCES posts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    liked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);
```

### 2.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/{id}/like` | Like a post |
| `DELETE` | `/api/posts/{id}/like` | Unlike a post |

### 2.3 Response Format

```json
{
  "liked": true,
  "likeCount": 42
}
```

### 2.4 Counter Management

- `posts.love_count` incremented on like
- `posts.love_count` decremented on unlike (min 0)
- Triggers trending score recalculation

---

## 3. Share System

### 3.1 API Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/{id}/share` | Record share and increment count |

### 3.2 Response Format

```json
{
  "shareCount": 15
}
```

### 3.3 Counter Management

- `posts.share_count` incremented on share
- Triggers trending score recalculation

---

## 4. Repost System

### 4.1 API Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/{id}/repost` | Create a repost with optional quote |

### 4.2 Request Body

```json
{
  "textContent": "Optional quote/comment"
}
```

### 4.3 Response

Returns new `PostDto.Response` for the repost.

### 4.4 Repost Structure

Reposts create a new `Post` with:
- `originalPostId` referencing the original
- `textContent` containing the quote/comment
- Author is the reposter, not original author

---

## 5. Comment System

### 5.1 Database Schema

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES posts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES comments(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

### 5.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts/{id}/comments` | List comments |
| `POST` | `/api/posts/{id}/comments` | Create comment |
| `POST` | `/api/comments/{id}/reply` | Reply to comment |
| `PUT` | `/api/comments/{id}` | Update comment |
| `DELETE` | `/api/comments/{id}` | Delete comment |

### 5.3 Threaded Comments

- Comments have optional `parentId` for replies
- Replies nested under parent comment
- `replyCount` stored on parent

### 5.4 Counter Management

- `posts.comment_count` incremented on comment
- `posts.comment_count` decremented on comment delete

---

## 6. Profile System

### 6.1 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/{id}/profile` | Get public profile |
| `PUT` | `/api/users/profile` | Update own profile |

### 6.2 HostProfileDto

```json
{
  "id": "UUID",
  "firstName": "String",
  "lastName": "String",
  "username": "String",
  "avatar": "String",
  "bio": "String",
  "communityPoints": 150,
  "badges": ["Explorer", "Contributor"],
  "verifiedHost": true,
  "followersCount": 42,
  "followingCount": 15,
  "postCount": 23,
  "isFollowing": false,
  "homestays": ["HomestayDto.Response"],
  "posts": ["PostDto.Response"]
}
```

### 6.3 Frontend Profile Page

**Location:** `frontend/app/profile/[id]/page.tsx`

**Features:**
- Avatar display
- Username and bio
- Verified host badge
- Followers/following/post counts
- Follow/unfollow button
- Edit profile button (own profile)

### 6.4 Follow Button States

| State | Button Text | Variant |
|-------|-------------|---------|
| Not following | "Follow" | Primary |
| Following | "Following" | Secondary |
| Pending (loading) | "..." | Disabled |

---

## 7. Viewer-Sensitive Data

### 7.1 Issue: Cross-User Data Pollution

**Root Cause:** React Query keys were not viewer-aware, causing cache reuse across different authenticated users in the same browser session.

**Affected Fields:**
- `isFollowing` on profile responses
- `isLikedByCurrentUser` on feed/post responses

### 7.2 Fix: Viewer-Aware Query Keys

```typescript
// queryKeys.ts
export const queryKeys = {
  users: {
    profile: (id: string, viewerId?: string) => ['users', 'profile', id, viewerId] as const,
  },
  community: {
    feed: (tag: string, scope: string, viewerId?: string) => ['community', 'feed', tag, scope, viewerId] as const,
    trending: (viewerId?: string) => ['community', 'trending', viewerId] as const,
  },
};
```

### 7.3 Cache Invalidation

On follow/unfollow/like/unlike:
- Invalidate with viewer-aware keys
- Or use stable prefix for bulk invalidation

---

## 8. Avatar Consistency

### 8.1 Issue: Timeline Feed Avatar Drift

**Root Cause:** Timeline rows stored denormalized author snapshot including `author_avatar_url`. Profile changes wouldn't reflect in timeline feed.

### 8.2 Fix: Prefer Current User Data

Timeline feed mapping now:
1. Batch loads current author data from `users` table
2. Prefers current values for: name, avatar URL, role, verified-host flag
3. Falls back to timeline snapshot only if user row unavailable

---

## 9. Top Contributors Sidebar

### 9.1 API Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/community/top-contributors` | Get top contributors |

### 9.2 Query Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 3 | Number of contributors |

### 9.3 SQL Query

```sql
SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.role, 
       u.is_verified_host, COUNT(p.id) AS postCount
FROM users u
INNER JOIN posts p ON p.user_id = u.id AND p.is_deleted = false
GROUP BY u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.role, u.is_verified_host
ORDER BY postCount DESC
LIMIT :limit
```

### 9.4 Independence

Sidebar data is independent of feed data:
- Separate API call
- Not affected by feed scope or filters
- Cached separately

---

## 10. Frontend Components

### 10.1 Follow Button

**Location:** `frontend/app/profile/[id]/page.tsx`

**Selector:** `getByRole('button', { name: /^Follow$/ })` or `getByRole('button', { name: /Following/ })`

### 10.2 Like Button

**Location:** `frontend/components/community/PostInteractionBar.tsx`

**Selector:** First button in post card interaction bar

### 10.3 PostCardUnified

**Location:** `frontend/components/community/PostCardUnified.tsx`

**Features:**
- Avatar links to `/profile/[authorId]` (clickable on all post types)
- Username links to `/profile/[authorId]` (clickable on all post types)
- Interaction bar with like, comment, repost, share

---

## 11. Database Indexes

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_user_follows_followed_user` | `user_follows` | Follower lookups |
| `idx_user_follows_follower_user` | `user_follows` | Following lookups |
| `idx_post_likes_post_user` | `post_likes` | Like existence check |

---

## 12. Testing

### 12.1 Follow Flow Test

1. Navigate to user profile `/profile/{id}`
2. Click "Follow" button
3. Verify button changes to "Following"
4. Navigate to Following feed
5. Verify user's posts appear

### 12.2 Unfollow Flow Test

1. Navigate to user profile of followed user
2. Click "Following" button
3. Verify button changes to "Follow"
4. Navigate to Following feed
5. Verify user's posts no longer appear
6. Verify empty state if no other follows

### 12.3 Like Flow Test

1. Find post in feed
2. Click like button (heart icon)
3. Verify counter increments
4. Switch tabs, return
5. Verify like state persists

---

## 13. Known Issues (Fixed)

### 13.1 Following Feed Empty Despite Follows

**Cause:** `/api/posts` was in `PUBLIC_ENDPOINTS` array, preventing auth headers.

**Fix:** Removed from public endpoints in `frontend/lib/api-client.ts`.

### 13.2 Avatar Not Clickable on Text-Only Posts

**Cause:** `TextOnlyCard` component didn't wrap avatar/username in Link components.

**Fix:** Added `authorId` prop and wrapped elements in `<Link href="/profile/${authorId}">`.

### 13.3 Cross-User Cache Pollution

**Cause:** Query keys not viewer-aware.

**Fix:** Added `viewerId` parameter to profile, feed, and trending query keys.
