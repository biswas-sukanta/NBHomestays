# North Bengal Homestays

Full-stack monorepo for homestay discovery and community platform focused on North Bengal and nearby eastern Himalayan regions.

## Project Overview

- **Homestay Discovery**: Browse and search homestays with map views, filters, and detailed listings
- **Community Platform**: Share travel stories, ask questions, post reviews, and connect with other travelers
- **Host Dashboard**: List and manage homestays with media uploads and booking inquiries
- **Social Features**: Follow users, like posts, repost content, and build a travel community

## Tech Stack

### Backend
- **Java 21** with **Spring Boot 3.3.5**
- **PostgreSQL** with **Flyway** migrations
- **Redis** for caching
- **JWT** authentication
- **ImageKit** for media storage and CDN

### Frontend
- **Next.js 16.1.6** with App Router
- **React 19.2.3** with TypeScript 5.9.3
- **Tailwind CSS 4**
- **TanStack Query 5** for server state
- **Framer Motion** for animations
- **Leaflet** for map views
- **Playwright** for E2E testing

## Key Features

### Homestay Discovery
- Search with filters (price, amenities, location)
- Map-based exploration
- Detailed homestay pages with reviews
- Save to trip board

### Community Feed
- Post stories, questions, trip reports, and alerts
- Image galleries with lightbox
- Vibe tags for categorization
- Like, comment, repost, and share
- Follow users and see following feed
- Trending posts algorithm

### Host Features
- Create and manage listings
- Multi-step homestay form
- Image upload with cropping
- View inquiries and reviews

### Profile System
- Public host profiles
- Follower/following counts
- Post history
- Verified host badges

## System Architecture Summary

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (Next.js)     │     │  (Spring Boot)  │     │   (Supabase)    │
│   Vercel        │     │   Koyeb         │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    Redis        │
                        │   (Cache)       │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   ImageKit      │
                        │   (Media CDN)   │
                        └─────────────────┘
```

## Local Development

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Backend runs at `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### Docker Services

```bash
docker-compose up -d
```

Provides PostgreSQL, Redis, and MailDev for local development.

## Testing

### Community Test Suite

```bash
cd frontend
npm test -- tests/community
```

### Backend Tests

```bash
cd backend
mvn test
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture, tech stack, entities, caching, media pipeline |
| [Social Platform](docs/social-platform.md) | Post taxonomy, follow graph, trending algorithm, feed scopes |
| [API Contract](docs/api-contract.md) | REST API endpoints and DTO structures |
| [Deployment](docs/deployment.md) | Flyway migrations, indexes, build commands, deployment checklist |
| [AI Context](docs/AI_PROJECT_CONTEXT.md) | Canonical onboarding context for AI coding agents |
| [Community Feed Design](docs/frontend/community-feed.md) | Frontend feed component design specifications |

## Environment Variables

### Backend Required
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET_KEY`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

### Frontend Required
- `NEXT_PUBLIC_API_URL`

## License

Private repository. All rights reserved.
