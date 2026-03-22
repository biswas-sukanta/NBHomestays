# Revert Plan

## Keep
- All backend code
- All migrations and schema files
- All API and persistence fixes

## Revert
- [frontend/app/homestays/[id]/page.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/app/homestays/[id]/page.tsx) to `58e3b13`
- Remove [frontend/components/ui/reveal.tsx](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/frontend/components/ui/reveal.tsx)
- Remove premium proof artifacts under [artifacts/premium-homestay-ux](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/artifacts/premium-homestay-ux)
- Remove [premium-ux-final-report.md](/C:/Users/biswa/OneDrive/Documents/github/NorthBengalHomestays/premium-ux-final-report.md)

## Basis
- `git diff 58e3b13 HEAD --stat` showed only premium homestay frontend files and proof artifacts changed since the stable commit.
- No backend, migration, or schema files changed in that range.
