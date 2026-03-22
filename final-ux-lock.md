# Final UX Lock

## Removed duplications

- removed the `Full description` button from `Stay Story`
- removed image-based highlights, including any chance of reusing the hero image there
- removed the fake `Guest Reviews` placeholder block
- removed duplicate vibe/trust accents from the highlights cards

## Sections converted to cards

The following sections are now rendered inside the shared white card shell in [page.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/app/homestays/[id]/page.tsx):

- `Stay Story`
- `Watch Property Tour`
- `Experience Highlights`
- `What Makes This Place Unique`
- `Stay Options`
- `Know Before You Go`
- `Amenities`
- `Meals & Dining`
- `Policies`
- `Meet Your Host`
- `Map`
- `Nearby places`
- `Q&A` desktop and mobile

## Alignment fixes

- main content rail remains on the tightened two-column layout with `mt-6`, `gap-6`, and `items-start`
- first content section starts at `mt-6`
- subsequent major sections use `mt-10`

## Data integrity checks

- highlights now use only `homestay.tags`
- stay options use `homestay.spaces`
- hero image reuse is blocked from `spaces.media` by excluding the top hero URL
- no `roomTypes` field was used because the actual frontend model does not contain `roomTypes`; `spaces` is the real backend-backed field

## Validation

- `npm run build`: passed

