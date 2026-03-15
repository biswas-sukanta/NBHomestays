# North Bengal Homestays - AI Project Context (Single Source)

This file is the canonical onboarding context for AI coding agents working in this repository.
It consolidates backend, frontend, DB, infrastructure, integrations, tests, and known pitfalls.

## 1. Project Identity

- Monorepo for a homestay discovery/community platform focused on North Bengal + nearby eastern Himalayan regions.
- Main apps:
  - `backend/`: Spring Boot API (`com.nbh.backend`)
  - `frontend/`: Next.js App Router UI
- Supporting folders:
  - `docker/`, `deployment/`, `.github/workflows/`, `docs/`, `scripts/`

## 2. ZERO-HALLUCINATION: Local Development & UI Automation Cheatsheet

**CRITICAL: AI agents MUST follow these exact commands. Never guess ports, startup sequences, or test commands.**

### 2.1 Prerequisites (Environment)

**Single Source of Truth:** All local configuration is centralized in the `.env` file at the project root (`NorthBengalHomestays/.env`).

This file contains:
- Direct Supabase PostgreSQL connection strings (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`)
- ImageKit public/private keys and endpoints (`IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`)
- JWT Secrets (`JWT_SECRET_KEY`)
- Redis disable flags (`APP_CACHE_REDIS_ENABLED=false`, `app.cache.redis.enabled=false`)
- Test user credentials (Admin, Host, Guest)

**DO NOT run Docker.** Redis, Loki, and MailDev are explicitly disabled for local runs.

### 2.2 Backend Startup Sequence

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build the project (wait for `BUILD SUCCESS`):
   ```bash
   mvn clean install
   ```

3. Start the Spring Boot server with the local profile (wait for `Tomcat started on port 8080`):
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=local
   ```

Backend runs at: `http://localhost:8080`

### 2.3 Frontend Startup Sequence

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server (wait for `server ready on port 3000`):
   ```bash
   npm run dev
   ```

Frontend runs at: `http://localhost:3000`

### 2.4 UI Automation (Playwright) Execution

**RULE: Backend and frontend MUST be running locally first.**

**EXECUTION RULE:** Before starting the backend or running UI automation tests, the AI must ensure the variables from the root `NorthBengalHomestays/.env` file are loaded into its environment context.

Run the full community test suite:

```bash
cd frontend
npx playwright test tests/community
```

### 2.5 Test Credentials Pointer

**For all E2E tests and manual logins, you MUST read `docs/AI_TEST_CREDENTIALS.md` for the exact Admin, Host, and Guest credentials. Never invent users.**

---

## 3. High-Level Architecture

- Frontend (Next.js) calls backend REST via `/api/*` rewrite in `frontend/next.config.ts`.
- Backend is JWT-secured Spring Boot with PostgreSQL (Flyway migrations), Redis cache, and ImageKit for media.
- Domain pillars:
  - Homestays and destination discovery
  - Community posts/comments/reposts/likes
  - Reviews and vibe scoring
  - Host listing workflows
  - Admin moderation and seeding

Data flow (typical):
1. UI issues request to frontend-relative `/api/*`
2. Next rewrite proxies to backend base URL (`NEXT_PUBLIC_API_URL` or `http://localhost:8080`)
3. Spring controllers/services execute with DB + cache + media pipeline
4. Response returns to UI via axios/fetch + React Query

## 4. Tech Stack and Versions

## Backend (`backend/pom.xml`)

- Java 21
- Spring Boot 3.3.5
- Spring starters: Web, Data JPA, Security, Validation, Cache, Redis
- Flyway + PostgreSQL driver (`42.7.10`)
- JWT: `jjwt 0.11.5`
- OpenAPI docs: `springdoc-openapi-starter-webmvc-ui 2.5.0`
- Caching: Redis + Jackson serializer + optional disable kill switch
- ImageKit:
  - dependency `com.github.imagekit-developer:imagekit-java:2.0.1`
  - vendored JAR at `backend/libs/imagekit-java-2.0.1.jar`
  - installed via Maven install plugin during `initialize`

## Frontend (`frontend/package.json`)

- Next.js `16.1.6`
- React `19.2.3`
- TypeScript `5.9.3`
- Tailwind CSS 4
- TanStack Query 5
- Zustand 5
- Framer Motion
- Leaflet + marker clustering for map views
- Sentry Next.js SDK
- Playwright for E2E/API tests
- OpenAPI generator (typescript-axios) output under `frontend/src/lib/api`

## 5. Repository Structure (Important Paths)

- `backend/src/main/java/com/nbh/backend/`
  - `controller/`: REST routes
  - `service/`: business logic
  - `model/`: JPA entities
  - `repository/`: Spring Data repos/custom query impl
  - `security/` + `config/`: auth/security/cors/cache/imagekit/etc
  - `job/`: scheduled vibe score job
- `backend/src/main/resources/`
  - `application*.yml`
  - `db/migration/*.sql` (Flyway source of truth)
  - `seed/destinations.json`
  - `logback-spring.xml`
- `frontend/app/`: Next App Router pages
- `frontend/components/`: feature/UI components
- `frontend/lib/api/`: manual API wrappers
- `frontend/lib/api-client.ts`: axios instance + JWT interceptor + apiFetch helper
- `frontend/src/lib/api/`: generated OpenAPI client/models
- `frontend/context/AuthContext.tsx`: client auth state
- `frontend/tests/`: Playwright suites (UI and API style)

## 6. Backend Deep Context

## 6.1 Runtime Config

- Main config: `backend/src/main/resources/application.yml`
- Default active profile: `dev`
- Datasource envs are required (fail fast):
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
- JWT secret required: `JWT_SECRET_KEY`
- Redis config from env with defaults:
  - `SPRING_DATA_REDIS_HOST` default `localhost`
  - `SPRING_DATA_REDIS_PORT` default `6379`
  - `SPRING_DATA_REDIS_PASSWORD` optional
  - `SPRING_DATA_REDIS_SSL_ENABLED` default `false`

Profiles:
- `application-dev.yml`: Flyway `out-of-order: true`
- `application-prod.yml`: Flyway `out-of-order: false`

## 6.2 Security Model

- Stateless JWT auth via:
  - `JwtAuthenticationFilter`
  - `SecurityFilterChain` in `SecurityConfig`
- Public routes include:
  - `/api/auth/**`
  - `/api/health/ping`
  - `/api/homestays/**`
  - `/api/posts/**`
  - `/api/destinations/**`
  - `/api/states/**`
  - `/api/diagnostics` (GET only)
  - `/api/reviews/homestay/**`
  - `/v3/api-docs/**`, `/swagger-ui/**`
- Protected examples:
  - `/api/admin/**` -> `ROLE_ADMIN`
  - `/api/reviews/**` (non-public paths) -> authenticated
- CORS allowed origins:
  - `https://nb-homestays.vercel.app`
  - `http://localhost:3000`

JWT specifics:
- Access token exp default 24h
- Refresh token exp default 7d
- Claims include `role` and `userId` (set in `AuthenticationService`)

## 6.3 Core Entities (Current Model Layer)

- `User`: identity + roles + host profile bits + gamification fields + soft delete
- `Homestay`: listing core + geo + JSONB metadata + status + featured + destination + meal/meta JSON
- `Post`: community feed content with media/tags/reposts + soft delete
- `Comment`: threaded comments + media + soft delete
- `Review`: overall + categorical ratings + soft delete
- `Destination` + `State`: browse hierarchy
- `MediaResource`: unified media table linking to post/homestay/comment
- `TripBoardSave`: saved homestays (composite PK)
- `PostLike`: likes (composite PK)
- `HomestayQuestion` + `HomestayAnswer`: Q&A with soft delete

## 6.4 Controllers and Route Surface

Main controllers:
- `AuthController`: register/authenticate/login/refresh
- `HomestayController`: create/update/delete/search/lookup/detail/my listings/admin moderation
- `PostController`: feed/search/detail/create/update/delete/like/share/repost/my posts
- `CommentController`: list/create/reply/update/delete comments
- `ReviewController`: add review + get homestay reviews
- `DestinationController` and `StateController`: geography browsing
- `HomestayQuestionController`: Q&A CRUD
- `TripBoardController`: save/unsave/check/list saved homestays
- `UploadController` and `ImageController`: multipart media upload
- `AdminController` + `AdminDataController` + `AdminDatabaseController`: stats/moderation/seed/purge
- `DiagnosticsController`: integration checks + admin cache clear
- `UserController`: profile endpoints

Health endpoint:
- `/api/health/ping`

## 6.5 Caching and Async/Scheduled Work

- Redis cache config in `RedisConfig`:
  - cache kill switch: `app.cache.redis.enabled` (default true)
  - if false -> `NoOpCacheManager` (all `@Cacheable` no-op)
- Key cached domains:
  - homestay details/search
  - posts list/detail
  - comments
  - Q&A
  - reviews
  - state/destination lookups
  - admin stats
- Vibe score:
  - hourly scheduled job (`VibeScoreJob`)
  - async recalculation path in `VibeService.updateVibeScoreAsync`

## 6.6 Media / ImageKit Integration

- SDK init in `ImageKitConfig` from:
  - `IMAGEKIT_PUBLIC_KEY`
  - `IMAGEKIT_PRIVATE_KEY`
  - `IMAGEKIT_URL_ENDPOINT`
- Upload service: `ImageUploadService`
  - uploads to ImageKit folder `/homestays`
  - stores `url` and `fileId` in `MediaResource`
  - delete is best-effort non-blocking
- Endpoints:
  - `POST /api/upload` (authenticated roles)
  - `POST /api/images/upload-multiple` (authenticated)

## 6.6.1 Media pipeline notes (practical)

Key behavior:

- Upload endpoints return `MediaResource` metadata (`url`, `fileId`) but do not automatically persist those rows to entities.
- Persistence happens when callers submit create/update requests containing `request.media`.

Known pitfalls:

- Homestay create flows that send only `files` but omit `request.media` can result in homestays without persisted media.
- Community post edit flows must retain `fileId` values when re-submitting media; `fileId` is the stable identifier used for media retention logic.

Upload architecture (production-safe default):

Browser -> Backend (`/api/images/upload-multiple`) -> ImageKit -> CDN URL

Notes:

- ImageKit credentials (`IMAGEKIT_URL_ENDPOINT`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`) remain backend-only.
- Frontend should not depend on any ImageKit keys; it uploads files to the backend endpoint.

## 6.7 Diagnostics / Logging / Observability

- Infra startup check (`InfrastructureHealthCheck`) logs Redis + ImageKit status.
- Runtime diagnostics endpoint:
  - `GET /api/diagnostics`
  - `DELETE /api/diagnostics/cache` (admin)
- Request logging filter:
  - `ApiLoggingFilter` logs method/URI/status/latency/payload (non-multipart)
- Logback:
  - console appender
  - Loki appender configured via
    - `GRAFANA_LOKI_URL`
    - `GRAFANA_LOKI_USER`
    - `GRAFANA_LOKI_TOKEN`

## 7. Frontend Deep Context

## 7.1 App Routing (Next App Router)

Major pages under `frontend/app`:
- `/` home
- `/search`
- `/community`
- `/homestays/[id]`
- `/destination/[slug]`
- `/state/[slug]`
- `/host/dashboard`
- `/host/add-homestay`
- `/host/edit-homestay/[id]`
- `/admin`
- `/profile`, `/profile/[id]`
- `/login`, `/register`
- `/bookings` (see known drift below)

## 7.2 Frontend State + Data Strategy

- Auth: `AuthContext` + localStorage token/refreshToken
- API:
  - axios singleton in `lib/api-client.ts` with bearer header interceptor
  - `apiFetch` helper for fetch-style calls
- Server calls mostly via React Query in client pages/components
- Local feature state:
  - compare store: `store/useCompareStore.ts`
  - trip board store: `store/useTripBoard.ts`

## 7.3 API Wiring Layers

- Manual wrappers:
  - `frontend/lib/api/auth.ts`
  - `frontend/lib/api/homestays.ts`
  - `frontend/lib/api/posts.ts`
  - `frontend/lib/api/destinations.ts`
  - `frontend/lib/api/adminApi.ts`
  - `frontend/lib/api/users.ts`
  - `frontend/lib/api/images.ts`
- Generated OpenAPI client:
  - `frontend/src/lib/api/*`
  - generated via `npm run gen:api` (requires backend `/v3/api-docs`)

Rewrite behavior:
- In `next.config.ts`, `/api/:path*` -> `${NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/:path*`

## 7.4 Key Feature Components

- Search/discovery/map:
  - `HomestayMapView`, `HomestayCard`, `emoji-category-filter`, destination/state pages
- Host listing lifecycle:
  - `components/host/HomestayForm.tsx` (multi-step create/edit)
- Community:
  - `CreatePostModal`, `PostCard`, comments sections, repost modal
- Admin:
  - dashboard + `components/admin/AdminDataManagement.tsx`

## 7.5 Frontend Env + Monitoring

Observed frontend env keys:
- `NEXT_PUBLIC_API_URL`
- `BACKEND_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` (build/source map upload)
- `PLAYWRIGHT_TEST_BASE_URL`
- `CI`

Sentry:
- configured in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- verify script: `npm run sentry:verify`

## 8. Database, Migrations, and Schema Evolution

## 8.1 Source of Truth

- Flyway migration files in:
  - `backend/src/main/resources/db/migration`
- Current latest migration file present: `V39__add_homestay_meta.sql`

## 8.2 Notable Schema Evolution

- Initial homestays/users/reviews + geo indexes
- Auth schema (`users`)
- Community expansion (`posts`, comments, likes, trip board saves)
- Soft deletes added across major entities
- Media normalized into `media_resources` (legacy media tables dropped)
- Categorical review ratings + homestay aggregates
- Destination and state geography model
- Meal configuration JSONB and additional homestay meta JSONB
- Legacy `bookings` table dropped in `V23__Drop_Bookings_And_Constraints.sql`

## 8.3 Deployment SQL Files

- `deployment/supabase_schema.sql` and `deployment/supabase_setup.sql` exist but represent older schema snapshots (include bookings and legacy tables).
- Treat Flyway migrations as authoritative for current runtime schema.

## 9. CI/CD and Deployment

- GitHub workflow: `.github/workflows/deploy.yml`
  - On push/PR to `main`
  - Backend job:
    - setup Java 21
    - `mvn -B clean package -DskipTests`
  - Frontend job:
    - setup Node 20
    - `npm ci`
    - `npm run build`

Backend Dockerfile:
- multi-stage Maven build + JRE runtime
- installs vendored ImageKit JAR before package
- tuned JVM flags for constrained memory container

`vercel.json`:
- rewrites all requests to `/frontend/$1` (verify this behavior if deploying monorepo root on Vercel).

## 10. Testing Surface

Refer to Section 2 (Zero-Hallucination Cheatsheet) for all startup and execution commands.

### 10.1 Backend Tests

Located in `backend/src/test/java/com/nbh/backend`:
- integration tests for auth/homestay/search/reviews/audit
- repository and seeder/service tests
- multiple test configs in `backend/src/test/resources`

### 10.2 Frontend Tests

- Playwright config: `frontend/playwright.config.ts`
- test base URL defaults to deployed site (`https://nb-homestays.vercel.app`) unless overridden
- extensive suites in `frontend/tests/` including:
  - auth
  - API contract/security-style tests
  - CRUD and admin flows
  - visual/regression scenarios

### 10.3 Community Suite Location

Stable Community Playwright suite lives under `frontend/tests/community/`.

## 11. Known Drift / Pitfalls (Important for AI Agents)

1. Bookings are removed in backend migrations (`V23` dropped table), and there is no booking controller in backend Java code.
2. Frontend still has `/bookings` page calling `GET /bookings/my-bookings`, which is likely stale/incompatible.
3. Generated OpenAPI client under `frontend/src/lib/api` includes `booking-controller-api.ts`, indicating stale or mixed contract generation state.
4. In `frontend/app/host/dashboard/page.tsx`, `homestayApi` is imported from `@/lib/api-client` (generated controller instance) but code calls wrapper-style methods (`getMyListings`, `deleteHomestay`) that belong to `frontend/lib/api/homestays.ts`. This is a likely bug hotspot.
5. Deployment SQL files under `deployment/` are not synchronized with latest Flyway migrations; avoid treating them as canonical schema.

## 12. AI Agent Working Guide (Recommended Edits by Concern)

- New backend endpoint:
  1. add/modify controller in `backend/.../controller`
  2. implement service logic in `backend/.../service`
  3. update DTO/model/repository if needed
  4. add migration for schema changes
  5. update/verify frontend wrapper in `frontend/lib/api/*`
  6. regenerate OpenAPI client if using generated paths (`npm run gen:api`)

- New frontend feature:
  1. route in `frontend/app`
  2. feature components in `frontend/components`
  3. data calls in manual wrappers (`frontend/lib/api/*`) or generated client consistently
  4. cache/query logic via React Query

- Schema change:
  1. create new Flyway migration `VXX__*.sql`
  2. adjust JPA model fields and DTO mapping
  3. update any filtering/index logic

- Media/Image handling:
  - Use backend upload endpoints and persist `MediaResource` references.
  - Do not persist raw binary; only CDN URL + fileId metadata.

## 13. Environment Variable Checklist

## Backend critical

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET_KEY`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

## Backend optional/ops

- `SPRING_DATA_REDIS_HOST`
- `SPRING_DATA_REDIS_PORT`
- `SPRING_DATA_REDIS_PASSWORD`
- `SPRING_DATA_REDIS_SSL_ENABLED`
- `app.cache.redis.enabled`
- `GRAFANA_LOKI_URL`
- `GRAFANA_LOKI_USER`
- `GRAFANA_LOKI_TOKEN`

## Frontend critical

- `NEXT_PUBLIC_API_URL`

## Frontend optional/ops

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `PLAYWRIGHT_TEST_BASE_URL`
- `BACKEND_URL`

## 14. Current Reality Snapshot (As of 2026-03-08)

- Repository contains both mature feature flows and legacy/stale artifacts.
- Core active systems are homestays, destinations/states, community, admin, uploads, reviews, and caching.
- Booking-related pieces appear deprecated in backend but partially present in frontend/generated client.
- When making changes, prefer:
  - Flyway migrations + live Java model/controller reality
  - manual frontend API wrappers in `frontend/lib/api/*` (unless intentionally migrating fully to generated client)
  - explicit validation against actual backend route map before editing UI flows

