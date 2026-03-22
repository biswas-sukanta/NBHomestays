Premium homestay UX refinement completed on the frontend only.

Changes applied:
- Removed duplicate price and rating from the hero content area. Price and rating now remain only in the booking card.
- Split description usage correctly: hero uses a short summary capped at 120 characters, and `Stay Story` uses the full description with fallback to `editorialLead`.
- Upgraded the gallery hero treatment to use the image itself for title, location, and tags with overlay styling.
- Reframed the old `Experience Highlights` misuse into `Room Types` when `spaces` data exists.
- Removed the weak synthetic `Why guests notice this stay` section.
- Upgraded `Watch Property Tour` to a stronger full-width visual treatment with 16:9 embeds.
- Tightened the booking card styling with stronger elevation and cleaner actions.

Files changed:
- `frontend/app/homestays/[id]/page.tsx`
- `frontend/components/bento-gallery.tsx`

Validation:
- `npm run build` passed.
- Static check confirmed hero no longer renders duplicated price/rating, and the booking card still renders both.

Notes:
- No backend APIs were changed.
- No new data fields were introduced.
- The page uses only existing API response fields.
