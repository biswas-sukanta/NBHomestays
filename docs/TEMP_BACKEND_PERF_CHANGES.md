# TEMP: Backend Performance Changes (Proposed + Why)

Date: 2026-03-08  
Scope restricted to:
- `GET /api/destinations`
- `GET /api/states`
- `GET /api/homestays/search`

This is a temporary working note of the optimization set and rationale.

## 1) `GET /api/destinations`

## Proposed/Applied Change
- File: `backend/src/main/java/com/nbh/backend/repository/DestinationRepository.java`
- Added `@EntityGraph(attributePaths = {"state", "tags"})` to:
  - `findAll()`
  - `findBySlug(String slug)`
  - `findByStateSlug(String stateSlug)`

## Why
- `DestinationService.mapToDto(...)` reads:
  - `destination.getState().getName()/getSlug()`
  - `destination.getTags()`
- With lazy loading, this can trigger extra per-row queries (N+1 pattern).
- Entity graph preloads these relations in primary query, reducing round-trips while keeping entity/DTO output unchanged.

## Safety
- No controller change.
- No DTO change.
- No JSON structure change.
- No schema change.

## 2) `GET /api/states`

## Proposed/Applied Change
- New file:
  - `backend/src/main/java/com/nbh/backend/repository/projection/StateSummaryProjection.java`
- Updated:
  - `backend/src/main/java/com/nbh/backend/repository/StateRepository.java`
  - Added one aggregate query `fetchStateSummaries()` that returns:
    - state basic fields
    - destination count
    - homestay count
- Updated:
  - `backend/src/main/java/com/nbh/backend/service/StateService.java`
  - `getAllStates()` now maps aggregate projection instead of per-state count calls.

## Why
- Previous flow was effectively `1 + 2N` queries:
  - load all states
  - for each state: count destinations + count homestays
- That scales poorly and directly matches slow endpoint behavior.
- New query computes all rows and counts in one grouped pass.

## Safety
- Output fields are identical (`StateDto`).
- No change to endpoint contract/path.
- No schema changes.

## 3) `GET /api/homestays/search`

## Proposed/Applied Change
- File: `backend/src/main/java/com/nbh/backend/repository/HomestayRepositoryImpl.java`
- In the second-stage fetch by IDs, expanded fetch joins:
  - from: owner + mediaFiles
  - to: owner + mediaFiles + destination + destination.state
- Added `SELECT DISTINCT` to avoid duplicates with collection fetch joins.
- File: `backend/src/main/java/com/nbh/backend/service/HomestayService.java`
- Removed special-case fallback that used `findByStatus(...)` for empty filters.
  - Now `/search` consistently uses the optimized custom repository search path.
- File: `backend/src/main/java/com/nbh/backend/model/Destination.java`
- Added `@BatchSize(size = 50)` on destination `tags` collection.

## Why
- Service mapping (`HomestayService.mapToResponse`) reads destination details and owner/media data.
- If destination/state are lazy and not preloaded, extra queries may be issued per homestay row.
- Fetching all required relations in one hydration query lowers query count.
- The old "no-filter" branch bypassed this optimization and reintroduced heavy lazy-load query churn.
- Batch size on tags prevents per-destination tag fetch explosion during DTO mapping.

## Safety
- Ranking/pagination logic remains unchanged.
- Response payload structure unchanged.
- No schema changes.

## 4) Caching Review

## Observed
- `DestinationService.getAllDestinations()` already has `@Cacheable("destinations")`.
- `StateService.getAllStates()` already has `@Cacheable("states")`.
- `HomestayService.searchHomestays(...)` already has `@Cacheable("homestaysSearch", ...)`.

## Decision
- No new cache layer added.

## Why
- Existing caching already covers read-heavy endpoints; main issue was query shape, not missing cache annotations.

## 5) Index Audit Summary

## Observed (from Flyway migrations)
- Present:
  - `homestays(destination_id)` (`V34`)
  - `homestays(price_per_night)` (`V14`)
  - `states(slug)` (`V36`)
  - `destinations(state_id)` (`V36`)
- Not applicable:
  - `homestays.state_id` (state relationship is via destination)
  - `homestays.rating` (no such base column; aggregate rating columns are present)

## Decision
- No new index migration added.

## Why
- Required/critical indexes for current filter paths already exist.
- Avoid unnecessary schema churn per safety requirement.

## 6) What Was Intentionally NOT Changed

- Did not modify endpoint routes/controllers/contracts.
- Did not remove/rename response fields.
- Did not alter frontend-facing JSON shape.
- Did not add destructive or risky migrations.
- Did not enforce hard cap `size <= 12` on `/api/homestays/search`.

Reason for skipping hard cap:
- Frontend currently uses larger `size` values in some discovery/map paths.
- Forcing 12 server-side could silently change UI behavior and break expected listing counts.

## 7) Verification Status

- Compile check passed: `mvn -DskipTests compile`
- Full runtime benchmark in this environment is blocked by local infra mismatch:
  - Docker unavailable here.
  - Available local PostgreSQL schema is behind current entity expectations.

Once a schema-synced DB is available, run before/after profiling to capture:
- query count per endpoint
- max query time
- end-to-end latency delta

## 8) Validation Update (2026-03-08)

Ran:
- `mvn clean compile` (PASS)
- `mvn -Dtest=ApiPerfProbeIT test` (PASS)

Perf probe setup:
- Isolated schema: `perf_probe`
- `spring.jpa.show-sql=true`
- `spring.jpa.properties.hibernate.generate_statistics=true`
- Seeded data: 6 states, 60 destinations, 400 approved homestays

Observed SQL/query evidence:
- `/api/destinations`:
  - `sqlStatements=1`, `queryExecutions=1`, `collectionFetches=0`
  - avg elapsed (3 measured runs): `20 ms`
- `/api/states`:
  - `sqlStatements=1`, `queryExecutions=1`, `collectionFetches=0`
  - avg elapsed (3 measured runs): `10 ms`
- `/api/homestays/search?size=12&page=0`:
  - `sqlStatements=4`, `queryExecutions=3`, `collectionFetches=1`
  - avg elapsed (3 measured runs): `26 ms`
  - expected two-stage flow confirmed:
    1. IDs page query
    2. Count query
    3. Hydration query (`SELECT DISTINCT ... JOIN FETCH owner/media/destination/state`)
    4. Batched destination tags fetch (`WHERE destination_id = any (?)`)

N+1 status:
- No per-row `destination/state/media` fetch pattern remains for target endpoints.
- Tags load is batched (single IN/ANY query), not one query per destination.

Production latency comparison (log baseline vs optimized local probe):
- `/api/destinations`: ~5500-5700 ms -> ~20 ms avg
- `/api/states`: ~1500-1600 ms -> ~10 ms avg
- `/api/homestays/search`: ~1900-4100 ms -> ~26 ms avg

Notes:
- Baseline numbers are from production logs; "after" numbers are from local perf probe dataset.
- Absolute values may differ in production due to data volume and infra, but query-shape improvements are measurable and significant.
