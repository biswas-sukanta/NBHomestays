# Backend System Architecture

*Auto-Updated Document*: This file is strictly derived from the backend source code (`com.nbh.backend.model.*`, etc.).

## Framework
**Spring Boot** (Java)

## Project Architecture Tree
```text
backend
├── config       (Spring configurations: Security, Web, JSON, Cache)
├── controller   (REST API endpoints: Auth, Homestay, Posts, Search)
├── dto          (Data Transfer Objects: Request/Response contracts)
├── exception    (Global exception handling & specific NBH errors)
├── filter       (Servlet filters including JwtAuthenticationFilter)
├── job          (Background tasks and scheduled events)
├── model        (JPA Entity Definitions)
├── repository   (Spring Data JPA interfaces)
├── security     (Authentication services, Password encoding, JWT logic)
├── service      (Business logic: Homestay management, Community feed, Auth)
└── util         (Constants and helper functions)
```

## Core Entity Models

### User (Identity & Profile)
- **Fields**: `id`, `email`, `password`, `role` (USER, HOST, ADMIN), `firstName`, `lastName`, `avatarUrl`, `isVerifiedHost`, `bio`, `communityPoints`, `badges`.
- **Relationships**: One-to-Many with `Homestay`, `Post`, `Comment`, `Review`, `HomestayQuestion`.
- **Responsibilities**: Manages authentication, identity, and gamification (points/badges).

### Homestay (Property)
- **Fields**: `id`, `name`, `description`, `pricePerNight`, `latitude`, `longitude`, `address`, `amenities` (JSONB), `policies` (JSONB), `quickFacts` (JSONB), `tags` (JSONB), `vibeScore`, `avgRatings` (Atmosphere, Service, Accuracy, Value), `totalReviews`, `featured`, `status` (PENDING, APPROVED, REJECTED).
- **Relationships**: 
    - Many-to-One -> `User` (Owner)
    - Many-to-One -> `Destination`
    - One-to-Many -> `MediaResource`, `Review`, `Post`, `HomestayQuestion`.
- **Responsibilities**: Represents the core inventory of the platform.

### Post (Community Content)
- **Fields**: `id`, `textContent`, `locationName`, `tags` (List<String>), `loveCount`, `shareCount`, `createdAt`, `isDeleted`.
- **Relationships**:
    - Many-to-One -> `User` (Author)
    - Many-to-One -> `Post` (Original, for reposts)
    - Many-to-One -> `Homestay` (Tagged property)
    - One-to-Many -> `MediaResource`, `Comment`.
- **Responsibilities**: Drives the digital travel magazine experience.

### Comment (Social Intersection)
- **Fields**: `id`, `content`, `createdAt`.
- **Relationships**: Many-to-One -> `Post`, `User`.

### Review (Validation)
- **Fields**: `id`, `rating` (Overall), `atmosphereRating`, `serviceRating`, `accuracyRating`, `valueRating`, `comment`, `photoUrls`, `createdAt`.
- **Relationships**: Many-to-One -> `Homestay`, `User`.
- **Responsibilities**: Provides trust and quality metrics.

### TripBoardSave (Wishlist)
- **Fields**: `userId`, `homestayId`, `savedAt`.
- **Implementation**: Composite Primary Key on `userId` + `homestayId`.
- **Responsibilities**: Allows users to bookmark homestays for future travel.

### Destination & State (Geography)
- **Fields**: `id`, `slug`, `name`, `description`, `heroImageName`.
- **Hierarchy**: `State` -> (One-to-Many) -> `Destination` -> (One-to-Many) -> `Homestay`.

### MediaResource (Media Asset)
- **Fields**: `id`, `url` (ImageKit URL), `fileId`.
- **Relationships**: Many-to-One with `Post`, `Homestay`, or `Comment`.

## Critical Pipelines

### Authentication System
- **Mechanism**: Stateless JWT Authentication.
- **Flow**: User logs in -> `JwtService` generates token -> Token stored in client (Local/Cookies) -> `JwtAuthenticationFilter` validates token on subsequent requests.
- **Security**: Method-level security via `@PreAuthorize`.

### Media Pipeline
1. **Upload**: Client sends `MultipartFile` to `/api/upload` or bails it into a post request.
2. **CDN**: Backend uploads file to **ImageKit**.
3. **Storage**: ImageKit returns a `url` and `fileId`, which are saved in the `media_resources` table.
4. **Consumption**: Frontend retrieves URLs and applies ImageKit transforms (e.g., `?tr=w-800,q-75`).

### Booking Logic (Architectural Note)
*(Note: As of migration V23, historical booking structures were refactored/dropped in favor of an inquiry-based or external redirection model, pending version 2 implementation.)*

