# Stay Options Fix

## API structure

- Logged in [page.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/app/homestays/[id]/page.tsx):
  - `console.log("ROOM TYPES:", ...)`
  - `console.log("SPACES:", homestay.spaces)`
- Actual frontend contract:
  - `roomTypes`: not present in [homestay.ts](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/src/lib/api/models/homestay.ts)
  - `linkedPhotos`: not present
  - real backend-backed stay-option field: `spaces`
  - real image field on each space: `space.media`

## Mapping fix

- Removed filtered `spaces` preprocessing that was hiding valid stay-option records.
- Added `getSpaceImage(space)` to read the first valid URL from `space.media`.
- `Stay Options` now renders directly from `homestay.spaces ?? []` with no type-based removal and no slicing.

## Before / after UI

- Before:
  - stay options were built from a filtered `spaces` array
  - some space cards could lose their first image because of page-side filtering
  - host section was still boxed inside its own component
- After:
  - stay options render from the full `spaces` payload
  - first valid `space.media` URL is used for the lead image
  - host section is flattened in [host-profile.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/components/homestay/host-profile.tsx)
  - highlights remain text/icon only and do not reuse hero media

## Section order validation

Main content order in [page.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/app/homestays/[id]/page.tsx):

1. Hero
2. Stay Story
3. Experience Highlights
4. Stay Options
5. Meals
6. What Makes This Place Unique
7. Watch Property Tour
8. Amenities
9. Nearby places
10. Know Before You Go
11. Policies
12. Meet your host
13. Q&A

`Map` remains as its own backend-backed section in the page after host-related content.

## Validation

- `npm run build`: passed

