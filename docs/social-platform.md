# Social Platform Features

Verified against repository code on 2026-03-15.

## 1. Post Taxonomy

### 1.1 PostType Enum

Posts have a canonical type stored in `post_type` column:

| Value | Description |
|-------|-------------|
| `QUESTION` | Ask the community for advice |
| `TRIP_REPORT` | Share travel experience |
| `REVIEW` | Rate a homestay or destination |
| `ALERT` | Safety or travel warning |
| `PHOTO` | Photo-focused post |
| `STORY` | General story (default) |

**Entity:** `backend/src/main/java/com/nbh/backend/model/PostType.java`

**Database:** `posts.post_type VARCHAR(20) DEFAULT 'STORY'`

### 1.2 VibeTag Enum

Posts can have up to 3 vibe tags for categorization:

| Value | Description |
|-------|-------------|
| `Hidden Gem` | Undiscovered spot |
| `Offbeat` | Unconventional destination |
| `Sunrise` | Sunrise viewpoint |
| `Heritage` | Heritage site |
| `Food` | Food-related |
| `Local Tips` | Local advice |
| `Transport` | Transportation info |

**Entity:** `backend/src/main/java/com/nbh/backend/model/VibeTag.java`

**Validation:** `PostService.validatePostRequest()` rejects invalid tags with `400 BAD_REQUEST`

**Frontend:** Tags selected in `CreatePostModal.tsx` from predefined list

### 1.3 System Flags

System flags are stored as boolean columns, not as tags:

| Flag | Description |
|------|-------------|
| `isEditorial` | Admin-authored post |
| `isFeatured` | Featured content |
| `isPinned` | Pinned to top |
| `isTrending` | Currently trending |

**Auto-set:** `isEditorial = true` when author has `ROLE_ADMIN`

## 2. Editorial Posts

### 2.1 Editorial Flag

Editorial posts are authored by admins and receive special treatment:

- Auto-flagged via `PostService` when author role is `ROLE_ADMIN`
- Displayed with editorial badge in frontend
- Eligible for featured/hero block types in `FeedLayoutEngine`

### 2.2 Editorial Score

Optional `editorialScore` field for admin-curated ranking:
- Range: 0-100
- Set manually by admins
- Used for editorial feed sorting

## 3. Follow Graph

### 3.1 Database Schema

```sql
CREATE TABLE user_follows (
    follower_user_id UUID NOT NULL REFERENCES users(id),
    followed_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_user_id, followed_user_id),
    CONSTRAINT chk_no_self_follow CHECK (follower_user_id <> followed_user_id)
);
```

### 3.2 Entity

**Entity:** `backend/src/main/java/com/nbh/backend/model/UserFollow.java`

**Repository:** `backend/src/main/java/com/nbh/backend/repository/UserFollowRepository.java`

**Service:** `backend/src/main/java/com/nbh/backend/service/FollowService.java`

### 3.3 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/{id}/follow` | Follow a user |
| `DELETE` | `/api/users/{id}/follow` | Unfollow a user |

### 3.4 Business Rules

- No self-follow (enforced by DB constraint and service)
- Idempotent follow requests
- Follower/following counts maintained on `users` table

## 4. Profile System

### 4.1 HostProfileDto Fields

```json
{
  "id": "UUID",
  "firstName": "String",
  "lastName": "String",
  "username": "String",
  "avatar": "String",
  "bio": "String",
  "communityPoints": "int",
  "badges": ["String"],
  "verifiedHost": "boolean",
  "followersCount": "long",
  "followingCount": "long",
  "postCount": "long",
  "isFollowing": "boolean",
  "homestays": ["HomestayDto.Response"],
  "posts": ["PostDto.Response"]
}
```

### 4.2 Profile Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/{id}/profile` | Get public profile |
| `PUT` | `/api/users/profile` | Update own profile |

### 4.3 Frontend Profile Page

**Location:** `frontend/app/profile/[id]/page.tsx`

**Features:**
- Avatar display
- Username and bio
- Verified host badge
- Followers/following/post counts
- Follow/unfollow button
- Edit profile button (own profile)

## 5. View Tracking

### 5.1 View Counter

Posts track view counts for trending calculation:

**Database:** `posts.view_count INTEGER DEFAULT 0`

**Entity:** `Post.viewCount`

### 5.2 View Increment

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/{id}/view` | Increment view count |

**Service:** `backend/src/main/java/com/nbh/backend/service/ViewTrackingService.java`

## 6. Trending Algorithm

### 6.1 Trending Score Calculation

**Formula:**
```
engagement = (loveCount * 3.0) + (commentCount * 4.0) + (shareCount * 5.0) + (viewCount * 0.2)
recencyBoost = 24.0 / max(ageHours, 1.0)
score = engagement + recencyBoost
```

**Weight Rationale:**
- Comments weighted highest (4.0) as they indicate active discussion
- Shares weighted high (5.0) as they indicate content worth spreading
- Loves weighted moderately (3.0) as passive engagement
- Views weighted low (0.2) as passive consumption
- Recency boost ensures newer posts get visibility boost

### 6.2 Scheduled Job

**Job:** `backend/src/main/java/com/nbh/backend/job/TrendingScoreJob.java`

**Schedule:** Hourly (`@Scheduled(cron = "0 0 * * * *")`)

**Service:** `backend/src/main/java/com/nbh/backend/service/TrendingService.java`

### 6.3 Trending Fields

| Field | Type | Description |
|-------|------|-------------|
| `trendingScore` | `double` | Computed trending score |
| `trendingComputedAt` | `Instant` | Last computation time |
| `isTrending` | `boolean` | Whether post is in top 20 by score |

### 6.4 Trending History

Optional analytics stored in `post_trending_history`:

```sql
CREATE TABLE post_trending_history (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    trending_score INTEGER,
    computed_at TIMESTAMP WITH TIME ZONE
);
```

## 7. Feed Scopes

### 7.1 Supported Scopes

| Scope | Description | Implementation |
|-------|-------------|----------------|
| `latest` | All posts, newest first | Default, uses timeline hot window |
| `following` | Posts from followed users | Filters by followed user IDs |
| `trending` | Trending posts | Sorts by trending score |
| `global` | Alias for `latest` | Maps internally to `latest` |

### 7.2 Feed Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts/feed` | Get feed (default: latest) |
| `GET` | `/api/posts/feed?scope=latest` | Latest posts |
| `GET` | `/api/posts/feed?scope=following` | Following feed |
| `GET` | `/api/posts/feed?scope=trending` | Trending feed |
| `GET` | `/api/posts/feed?scope=global` | Global feed (alias for latest) |
| `GET` | `/api/posts/trending` | Dedicated trending endpoint |

### 7.3 Feed Response

```json
{
  "posts": ["PostFeedDto"],
  "nextCursor": "String|null",
  "hasMore": "boolean",
  "blocks": ["FeedBlockDto"]
}
```

## 8. Post Interactions

### 8.1 Like/Unlike

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/{id}/like` | Like a post |
| `DELETE` | `/api/posts/{id}/like` | Unlike a post |

### 8.2 Share

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/{id}/share` | Record share and increment count |

### 8.3 Repost

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/posts/{id}/repost` | Create a repost with optional quote |

## 9. Frontend Components

### 9.1 PostCardUnified

**Location:** `frontend/components/community/PostCardUnified.tsx`

**Features:**
- Avatar links to `/profile/[id]`
- Username links to `/profile/[id]`
- Editorial badge for admin posts
- Homestay link when tagged
- Image lightbox
- Interaction bar (like, comment, repost, share)

### 9.2 CreatePostModal

**Location:** `frontend/components/community/CreatePostModal.tsx`

**Features:**
- Text content input
- Image upload with crop
- Location input
- Homestay tagging
- Vibe tag selection (max 3)
- Optimistic updates

### 9.3 Community Feed Page

**Location:** `frontend/app/community/page.tsx`

**Features:**
- Feed scope tabs (latest, trending, following)
- Tag filter
- Infinite scroll with cursor pagination
- Skeleton loading
