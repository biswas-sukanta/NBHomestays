# Deployment Guide

Verified against repository code on 2026-03-15.

## 1. Flyway Migrations

### 1.1 Migration Sequence

Social platform migrations (V47-V55):

| Migration | Description |
|-----------|-------------|
| `V47__align_posts_schema.sql` | Align posts table with entity model |
| `V48__add_follow_system.sql` | Add user_follows table and counters |
| `V49__add_post_type_editorial.sql` | Add postType, editorial flags, trending score |
| `V50__add_view_counter.sql` | Add view_count column |
| `V51__add_trending_score.sql` | Add trending_score column |
| `V52__destination_link.sql` | Add destination_id foreign key |
| `V53__add_trending_computed_at.sql` | Add trending_computed_at timestamp |
| `V54__community_timestamp_timezone.sql` | Convert community timestamps to timezone-safe |
| `V55__post_trending_history.sql` | Add trending history analytics table |

### 1.2 Migration Best Practices

- All migrations are additive (no DROP, no breaking ALTER)
- All new columns have DEFAULT values
- Migrations are idempotent where possible
- Run `mvn clean install` before deployment to verify

### 1.3 Verifying Migrations

```sql
-- Check applied migrations
SELECT version, description, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 10;

-- Verify community tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'user_follows', 'post_trending_history');

-- Verify timestamp columns are timezone-aware
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('created_at', 'trending_computed_at');
```

## 2. Database Indexes

### 2.1 Feed Indexes

```sql
-- Feed sort order
CREATE INDEX idx_posts_feed_sort ON posts (created_at DESC, id DESC);

-- Trending sort order
CREATE INDEX idx_posts_trending ON posts (trending_score DESC, created_at DESC);
```

### 2.2 Social Graph Indexes

```sql
-- Follower lookups
CREATE INDEX idx_user_follows_followed_user ON user_follows (followed_user_id, created_at DESC);

-- Following lookups
CREATE INDEX idx_user_follows_follower_user ON user_follows (follower_user_id, created_at DESC);
```

### 2.3 Analytics Indexes

```sql
-- Trending history lookups
CREATE INDEX idx_post_trending_history_post_id_computed_at ON post_trending_history (post_id, computed_at DESC);
CREATE INDEX idx_post_trending_history_computed_at ON post_trending_history (computed_at DESC);
```

## 3. Timestamp Safety

### 3.1 Community Tables

Community tables use `TIMESTAMP WITH TIME ZONE` for UTC-safe storage:

| Table | Column | Type |
|-------|--------|------|
| `posts` | `created_at` | `TIMESTAMP WITH TIME ZONE` |
| `posts` | `trending_computed_at` | `TIMESTAMP WITH TIME ZONE` |
| `comments` | `created_at` | `TIMESTAMP WITH TIME ZONE` |
| `post_likes` | `liked_at` | `TIMESTAMP WITH TIME ZONE` |
| `post_timelines_global` | `created_at` | `TIMESTAMP WITH TIME ZONE` |
| `user_follows` | `created_at` | `TIMESTAMP WITH TIME ZONE` |
| `post_trending_history` | `computed_at` | `TIMESTAMP WITH TIME ZONE` |

### 3.2 Java Entity Types

Java entities use `Instant` for these fields:

- `Post.createdAt`
- `Post.trendingComputedAt`
- `Comment.createdAt`
- `PostLike.likedAt`
- `PostTimeline.createdAt`
- `UserFollow.createdAt`
- `PostTrendingHistory.computedAt`

## 4. Build Commands

### 4.1 Backend Build

```bash
cd backend
mvn clean install
```

**Build artifacts:**
- `target/*.jar` - Executable JAR

**Build verification:**
- Unit tests run automatically
- Integration tests run with `mvn verify`

### 4.2 Frontend Build

```bash
cd frontend
npm install
npm run build
```

**Build artifacts:**
- `.next/` - Next.js build output

**Build verification:**
- TypeScript compilation
- ESLint checks
- Static page generation

### 4.3 Docker Build (Backend)

```bash
cd backend
docker build -t nbh-backend:latest .
```

**Dockerfile features:**
- Multi-stage build (Maven + JRE)
- Vendored ImageKit JAR installation
- JVM flags for constrained memory

## 5. Deployment Checklist

### 5.1 Pre-Deployment

- [ ] All migrations tested locally
- [ ] `mvn clean install` passes
- [ ] `npm run build` passes
- [ ] Environment variables configured
- [ ] Database backup taken

### 5.2 Database Verification

- [ ] Flyway migrations applied through V55
- [ ] `post_trending_history` table exists
- [ ] `user_follows` table exists
- [ ] Community timestamps use timezone
- [ ] Indexes created

### 5.3 Backend Verification

- [ ] Health endpoint responds: `GET /api/health/ping`
- [ ] Diagnostics endpoint works: `GET /api/diagnostics`
- [ ] Feed endpoint works: `GET /api/posts/feed`
- [ ] Trending endpoint works: `GET /api/posts/trending`
- [ ] Profile endpoint works: `GET /api/users/{id}/profile`

### 5.4 Frontend Verification

- [ ] Community page loads: `/community`
- [ ] Profile page loads: `/profile/{id}`
- [ ] Feed scope tabs work (latest, trending, following)
- [ ] PostCard links to profile
- [ ] Follow button works

### 5.5 Post-Deployment

- [ ] Monitor logs for errors
- [ ] Verify scheduled jobs running (VibeScoreJob, TrendingScoreJob)
- [ ] Check Redis cache connectivity
- [ ] Verify ImageKit uploads working

## 6. Environment Configuration

### 6.1 Backend Required

| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL |
| `SPRING_DATASOURCE_USERNAME` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `JWT_SECRET_KEY` | JWT signing key |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit CDN endpoint |

### 6.2 Backend Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_DATA_REDIS_HOST` | `localhost` | Redis host |
| `SPRING_DATA_REDIS_PORT` | `6379` | Redis port |
| `SPRING_DATA_REDIS_PASSWORD` | - | Redis password |
| `SPRING_DATA_REDIS_SSL_ENABLED` | `false` | Redis SSL |
| `app.cache.redis.enabled` | `true` | Enable Redis cache |
| `GRAFANA_LOKI_URL` | - | Loki URL for logging |
| `GRAFANA_LOKI_USER` | - | Loki username |
| `GRAFANA_LOKI_TOKEN` | - | Loki token |

### 6.3 Frontend Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

### 6.4 Frontend Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `PLAYWRIGHT_TEST_BASE_URL` | Test base URL |

## 7. CI/CD Pipeline

### 7.1 GitHub Workflow

**File:** `.github/workflows/deploy.yml`

**Triggers:**
- Push to `main`
- Pull requests to `main`

**Backend Job:**
- Setup Java 21
- `mvn -B clean package -DskipTests`
- Docker build and push

**Frontend Job:**
- Setup Node 20
- `npm ci`
- `npm run build`
- Vercel deployment

## 8. Rollback Procedures

### 8.1 Database Rollback

Flyway does not support automatic rollback. Manual rollback requires:

1. Identify migration to revert
2. Write inverse SQL
3. Update `flyway_schema_history` manually
4. Apply inverse SQL

### 8.2 Application Rollback

- Backend: Deploy previous JAR/Docker image
- Frontend: Vercel automatic rollback or redeploy previous commit
