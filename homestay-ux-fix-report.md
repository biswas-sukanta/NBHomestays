# Homestay UX Fix Report

Date: 2026-03-22

## Issues Fixed

- Gallery now uses only valid API image URLs and removes broken images on load failure.
- Hero gallery no longer pads with fallback slots or dummy imagery.
- Added a richer hero info summary using existing API fields: title, location, rating, tags, and truncated description.
- Property tour section now renders as full-width stacked embeds with a consistent 16:9 frame.
- Experience highlights now use expandable visual cards with overlay treatment instead of flat stacked blocks.
- Removed the duplicate standalone image breaks that were appearing above `Know Before You Go` and `Meals & Dining`.
- Page sections now use a more consistent white-card layout shell on the detail page.

## Removed Elements

- duplicate image block above `Know Before You Go`
- duplicate image block above `Meals & Dining`
- fallback gallery slot filling with non-API imagery
- compact horizontal property-tour card strip

## Files Updated

- [page.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/app/homestays/[id]/page.tsx)
- [bento-gallery.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/components/bento-gallery.tsx)
- [highlights.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/components/homestay/highlights.tsx)

## Verification

- `npm run build` passed.
- No backend API or schema changes were made.
- Image rendering uses existing `media`, `spaces.media`, `videos`, `tags`, and other existing homestay response fields only.

## Screenshots

- Before screenshots: not captured in this static pass.
- After screenshots: not captured in this static pass.
