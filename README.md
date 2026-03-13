# North Bengal Homestays

Full-stack monorepo for homestay discovery plus a Community feature (posts, comments, reposts, likes).

## Repository overview

- `backend/`: Spring Boot REST API (Java)
- `frontend/`: Next.js App Router UI

## Architecture summary

- The frontend calls backend routes via the Next.js rewrite layer under `/api/*`.
- Backend provides:
  - JWT auth (`/api/auth/*`)
  - Homestays + destinations/states
  - Community posts/comments/reposts/likes
  - Multipart image upload via `/api/images/upload-multiple`

## Local development

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Backend base URL:

- `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend base URL:

- `http://localhost:3000`

## Community test suite

Run the stable Community Playwright suite:

```bash
cd frontend
npm test -- tests/community
```

## Image upload architecture

Image uploads are handled server-side:

Browser -> Backend (`/api/images/upload-multiple`) -> ImageKit -> CDN URL

## Community Feed

The community feed features a premium editorial design inspired by Instagram/Airbnb:

- **Image-first layout**: 16:9 aspect ratio hero images
- **Post cards**: 18px radius, 24px padding, hover elevation
- **Responsive srcset**: Uses ImageKit transformations (small/medium/large variants)
- **Relative timestamps**: "Just now", "5 min ago", "2 hr ago", "Yesterday"
- **Lazy loading**: Images load on scroll with skeleton placeholders

Key components:
- `frontend/components/community/PostCardUnified.tsx` - Main post card
- `frontend/components/community/PostInteractionBar.tsx` - Like/comment/repost actions
- `frontend/lib/utils/feed-utils.ts` - Layout utilities and timestamp formatting

## AI-focused docs

- `docs/AI_PROJECT_CONTEXT.md` (canonical AI onboarding context)
- `docs/api-contract.md` (DTO/API contract reference)
- `docs/system-map.md` (high-level system map)
