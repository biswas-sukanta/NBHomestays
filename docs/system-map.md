# System Map

*Auto-Updated Document*: This represents the end-to-end architecture pipeline for North Bengal Homestays.

## Full System Architecture

1. **Frontend (Next.js)**
   - Responsible for React SSR, UI rendering, routing, and user interaction.
   - Hosted on: **Vercel**

2. **Backend (Spring Boot)**
   - Business logic, JWT authentication, and data validation.
   - Hosted on: **Koyeb**

3. **Database (PostgreSQL)**
   - Stores Users, Homestays, Posts, Reviews, and Geographic metadata.

4. **Media Storage Pipeline (ImageKit)**
   - CDN URLs are retained in PostgreSQL under `media_resources`.

## Data Flow Examples

### 1. Explore Page (Search/Filter)
`Frontend (Search Query)` -> `GET /api/homestays?search=...&tags=...` -> `Backend (JPA Specification)` -> `PostgreSQL` -> `Result JSON` -> `Frontend Grid`.

### 2. Homestay Details
`Frontend (slug/id)` -> `GET /api/homestays/{id}` -> `Backend` -> `Aggregates Ratings from Reviews Cache` -> `Returns HomestayDto + Reviews` -> `Frontend Details Page`.

### 3. Community Posting
`Frontend (Text + Files)` -> `POST /api/posts` (Multipart) -> `Backend` -> `ImageKit (Upload)` -> `PostgreSQL (Save URL)` -> `Returns PostDto.Response`.

### 4. Authentication Flow
`Frontend (Email/Pass)` -> `POST /api/auth/authenticate` -> `Backend (Spring Security)` -> `JWT Token Generation` -> `Returns Access Token` -> `Frontend Authorizes headers`.

