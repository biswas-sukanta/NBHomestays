# Repo Detox Final

Date: 2026-03-22

## Removed Files

- `deployment/supabase_schema.sql`
- `deployment/supabase_setup.sql`
- `docker/init.sql`
- untracked `artifacts/` directory
- previously removed `frontend/tmp-*.js` probe scripts

## Final Migration List

- [V1__baseline.sql](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration/V1__baseline.sql)
- [V2__seed_states.sql](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration/V2__seed_states.sql)
- [V3__normalize_states_seed.sql](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration/V3__normalize_states_seed.sql)
- [V4__normalize_homestay_extended_fields.sql](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/backend/src/main/resources/db/migration/V4__normalize_homestay_extended_fields.sql)

Tracked SQL after detox:

- only Flyway migrations remain

## Validation Summary

- Legacy media and save-table identifiers are absent from tracked backend and frontend source.
- Production frontend debug `console.log` hooks were removed from active pages and components.
- `mvn clean compile` passed.
- `npm run build` passed.
- Remaining changes are production backend/frontend code plus SQL drift removal and reports.

## Final Diff Summary

- Backend production code retained:
  - cache/health logging normalization
  - eager-loading and DTO-copy fixes for destination and homestay relations
  - datasource proxy cleanup
  - datasource/Flyway config tightening in `application.yml`
- Frontend production code retained:
  - null-safe price rendering
  - safe optional typing for trip-board items
  - safer location fallback handling
  - Sentry config guard for missing auth token
  - removal of production debug logs
- Drift removed:
  - duplicate non-Flyway SQL schema sources
  - generated artifact directory

## Push Confirmation

- This report is included in the final detox commit on `main` and is intended to be pushed immediately after commit creation.
