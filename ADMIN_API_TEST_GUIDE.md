# Admin API Test Guide

## Get an admin token

Use the current local admin account configured in the repo:

- Email: `admin@nbh.com`
- Password: `admin123`

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nbh.com","password":"admin123"}'
```

Copy the `accessToken` value from the response.

## Common shell helper

```bash
export ADMIN_TOKEN="<paste_access_token_here>"
```

PowerShell:

```powershell
$env:ADMIN_TOKEN = "<paste_access_token_here>"
```

## Admin API curls

All listings:

```bash
curl http://localhost:8080/api/admin/homestays/all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

- `200 OK`
- JSON array of homestays, or `[]`

Pending listings:

```bash
curl http://localhost:8080/api/admin/homestays/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Approved listings:

```bash
curl http://localhost:8080/api/admin/homestays/approved \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Analytics:

```bash
curl http://localhost:8080/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

- `200 OK`
- JSON with `totalUsers`, `totalPosts`, `totalHomestays`, `pendingHomestays`, `approvedHomestays`, `featuredHomestays`

Toggle featured:

```bash
curl -X PUT http://localhost:8080/api/admin/homestays/<homestay_id>/feature \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

- `200 OK`
- JSON with `id` and `featured`

Delete one admin-moderated post:

```bash
curl -X DELETE http://localhost:8080/api/admin/posts/<post_id> \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

- `200 OK` for an existing post
- `404 Not Found` for a missing post

Delete a limited number of homestays:

```bash
curl -X DELETE "http://localhost:8080/api/admin/homestays?limit=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

- `200 OK`
- JSON with `success` and `deletedCount`

Delete all homestays:

```bash
curl -X DELETE http://localhost:8080/api/admin/homestays/all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

- `200 OK`
- `{"success":true}`
- Community posts remain available through `/api/posts/feed`

Seed homestays:

```bash
curl -X POST "http://localhost:8080/api/admin/homestays/seed?count=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Seed posts:

```bash
curl -X POST "http://localhost:8080/api/admin/posts/seed?count=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Timeline backfill:

```bash
curl -X POST http://localhost:8080/api/admin/timeline/backfill \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected:

- `200 OK`
- JSON with `success`, `backfilled`, and `message`

## Notes

- `/api/admin/database/seed` is intentionally destructive and should only be called when you explicitly want a full reseed.
- If an endpoint is called with the wrong HTTP method, the backend now returns `405 Method Not Allowed` instead of a generic `500`.
