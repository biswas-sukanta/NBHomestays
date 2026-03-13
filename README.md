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
mvn spring-boot:run
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

## AI-focused docs

- `docs/AI_PROJECT_CONTEXT.md` (canonical AI onboarding context)
- `docs/api-contract.md` (DTO/API contract reference)
- `docs/system-map.md` (high-level system map)
