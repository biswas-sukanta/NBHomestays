# System Architecture

Verified against repository code on 2026-03-15.

## 1. System Overview

North Bengal Homestays is a monorepo for a homestay discovery and community platform focused on North Bengal and nearby eastern Himalayan regions.

**Main applications:**
- `backend/`: Spring Boot REST API (Java 21)
- `frontend/`: Next.js App Router UI (React 19)

**Supporting folders:**
- `docker/`: Docker configurations (NOT used for local development)
- `deployment/`: Deployment configurations
- `.github/workflows/`: CI/CD pipelines
- `docs/`: Documentation
- `scripts/`: Utility scripts

## 2. Backend Architecture

### 2.1 Tech Stack

- **Java 21** with **Spring Boot 3.3.5**
- Spring starters: Web, Data JPA, Security, Validation, Cache, Redis
- **PostgreSQL** with **Flyway** migrations
- **JWT** authentication (jjwt 0.11.5)
- **Redis** for caching
- **ImageKit** for media storage and CDN

### 2.2 Package Structure

```
backend/src/main/java/com/nbh/backend/
├── config/          # Security, CORS, Cache, ImageKit config
├── controller/      # REST routes
├── service/         # Business logic
├── model/           # JPA entities
├── repository/      # Spring Data repos + custom impl
├── dto/             # Data Transfer Objects
├── security/        # JWT filter, auth service
└── job/             # Scheduled jobs (VibeScoreJob, TrendingScoreJob)
```

### 2.3 Core Entities

| Entity | Description |
|--------|-------------|
| `User` | Identity, roles, host profile, gamification |
| `Homestay` | Listing with geo, JSONB metadata, destination |
| `Post` | Community content with media, tags, reposts |
| `Comment` | Threaded comments with media |
| `Review` | Overall + categorical ratings |
| `Destination` / `State` | Geography hierarchy |
| `MediaResource` | Unified media table |
| `UserFollow` | Follow graph (follower/followed) |
| `PostLike` | Post likes (composite PK) |
| `PostTimeline` | Timeline hot window entries |

### 2.4 Security Model

- Stateless JWT authentication
- Public routes: `/api/auth/**`, `/api/homestays/**`, `/api/posts/**`, `/api/destinations/**`
- Protected routes: `/api/admin/**` (requires `ROLE_ADMIN`)
- CORS allowed origins: `https://nb-homestays.vercel.app`, `http://localhost:3000`

## 3. Frontend Architecture

### 3.1 Tech Stack

- **Next.js 16.1.6** with App Router
- **React 19.2.3** with TypeScript 5.9.3
- **Tailwind CSS 4**
- **TanStack Query 5** for server state
- **Zustand 5** for client state
- **Framer Motion** for animations
- **Leaflet** for map views
- **Playwright** for E2E testing

### 3.2 Key Pages

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/search` | Homestay search/discovery |
| `/community` | Community feed |
| `/homestays/[id]` | Homestay details |
| `/destination/[slug]` | Destination page |
| `/state/[slug]` | State page |
| `/host/dashboard` | Host listings management |
| `/profile`, `/profile/[id]` | User profiles |
| `/admin` | Admin dashboard |

### 3.3 API Wiring

- Manual wrappers in `frontend/lib/api/*` (auth, homestays, posts, users, etc.)
- Generated OpenAPI client in `frontend/src/lib/api/*`
- Axios instance with JWT interceptor in `frontend/lib/api-client.ts`
- Next.js rewrite: `/api/*` → backend URL

## 4. Feed Engine Design

### 4.1 Timeline Hot Window

The feed uses a precomputed timeline table (`post_timelines_global`) for performance:

```
post_timelines_global
├── post_id (FK to posts)
├── created_at (post creation time)
└── score (computed relevance)
```

**Hot window behavior:**
- Recent posts are pre-indexed in the timeline
- Feed queries hit the timeline table first
- Falls back to direct `posts` query if timeline is empty

### 4.2 FeedLayoutEngine

`FeedLayoutEngine` generates editorial-style feed blocks:

**Block types:**
- `FEATURED` - Wide cinematic (16:9 aspect ratio)
- `HERO` - Large hero post (16:9)
- `STANDARD` - Standard post (4:5 aspect ratio)
- `COLLAGE` - Multi-image grid (4:5)
- `PHOTO` - Photo-focused short text (4:5)

**Scoring formula:**
```
score = (likeCount * 2) + (commentCount * 3) + (shareCount * 4) + (mediaCount * 2) + postPriority
```

**Diversity rules:**
- Max 2 consecutive same block types
- Max 2 posts per author in sequence
- Max 3 same-tag cluster

### 4.3 Cursor Pagination

Feed uses cursor-based pagination for infinite scroll:

**Request:**
```
GET /api/posts/feed?cursor=eyJpZCI6IjEyMyIsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMDEifQ==&limit=12
```

**Cursor encoding:**
- Base64-encoded JSON: `{id, createdAt}`
- Decoded in `FeedService.decodeCursor()`

**Response:**
```json
{
  "posts": [...],
  "nextCursor": "ey...",
  "hasMore": true,
  "blocks": [...]
}
```

## 5. Database Model Overview

### 5.1 Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles, profile data |
| `homestays` | Homestay listings with geo, metadata |
| `posts` | Community posts with media, tags |
| `comments` | Threaded comments |
| `post_likes` | Post likes (composite PK) |
| `post_tags` | Post tags (ElementCollection) |
| `media_resources` | Unified media storage |
| `destinations` | Destination hierarchy |
| `states` | State hierarchy |
| `reviews` | Homestay reviews |
| `user_follows` | Follow graph |
| `post_timelines_global` | Timeline hot window |
| `post_trending_history` | Trending score snapshots |

### 5.2 Timestamps

Community tables use `TIMESTAMP WITH TIME ZONE` for UTC-safe storage:
- `posts.created_at`
- `posts.trending_computed_at`
- `comments.created_at`
- `post_likes.liked_at`
- `post_timelines_global.created_at`
- `user_follows.created_at`

Java entities use `Instant` for these fields.

## 6. Caching Strategy

### 6.1 Redis Cache

- Configurable via `app.cache.redis.enabled` (default: true)
- If disabled, falls back to `NoOpCacheManager`

**Cached domains:**
- Homestay details and search results
- Posts list and detail
- Comments
- Q&A
- Reviews
- State/destination lookups
- Admin stats

### 6.2 Cache Invalidation

- Manual clear via `DELETE /api/diagnostics/cache` (admin)
- Automatic invalidation on entity updates via `@CacheEvict`

## 7. Media Pipeline

### 7.1 Upload Flow

```
Browser → POST /api/images/upload-multiple → ImageKit → CDN URL
```

**ImageKit integration:**
- Credentials stored backend-only
- Images uploaded to `/homestays` folder
- Returns `url` and `fileId`

### 7.2 Media Storage

- `MediaResource` entity stores `url` and `fileId`
- Linked to `Post`, `Homestay`, or `Comment` via polymorphic relations
- ImageKit transformations for responsive images

## 8. Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `VibeScoreJob` | Hourly | Calculates homestay vibe scores |
| `TrendingScoreJob` | Hourly | Calculates post trending scores |

## 9. Performance Indexes

Key indexes for feed and social queries:

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_posts_feed_sort` | `posts` | Feed sort order |
| `idx_posts_trending` | `posts` | Trending sort |
| `idx_user_follows_followed_user` | `user_follows` | Follower lookups |
| `idx_user_follows_follower_user` | `user_follows` | Following lookups |
| `idx_post_trending_history_post_id_computed_at` | `post_trending_history` | Analytics |

## 10. Environment Variables

### Backend Required

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET_KEY`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

### Backend Optional

- `SPRING_DATA_REDIS_HOST` (default: localhost)
- `SPRING_DATA_REDIS_PORT` (default: 6379)
- `SPRING_DATA_REDIS_PASSWORD`
- `SPRING_DATA_REDIS_SSL_ENABLED`
- `app.cache.redis.enabled`
- `GRAFANA_LOKI_URL`
- `GRAFANA_LOKI_USER`
- `GRAFANA_LOKI_TOKEN`

### Frontend Required

- `NEXT_PUBLIC_API_URL`

### Frontend Optional

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `PLAYWRIGHT_TEST_BASE_URL`
