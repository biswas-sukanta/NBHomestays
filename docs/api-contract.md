# API Contract

*Auto-Updated Document*: This file maps the exact DTO structures and endpoints found in the `com.nbh.backend` package.

Verified against repository code on 2026-03-15.

## Authentication (AuthDto)
- **Register**: `POST /api/auth/register` - `email`, `password`, `firstname`, `lastname`, `role`
- **Authenticate**: `POST /api/auth/authenticate` - `email`, `password` → Returns `accessToken`, `refreshToken`
- **Login**: `POST /api/auth/login` - `email`, `password` → Returns `accessToken`, `refreshToken`
- **Refresh**: `POST /api/auth/refresh` - `refreshToken` → Returns new `accessToken`

## User Profile (AuthorDto)
```json
{
  "id": "UUID",
  "name": "String",
  "role": "String",
  "avatarUrl": "String",
  "isVerifiedHost": "boolean"
}
```

## Homestay (HomestayDto)
```json
{
  "id": "UUID",
  "name": "String",
  "description": "String",
  "pricePerNight": "int",
  "latitude": "Double",
  "longitude": "Double",
  "address": "String",
  "amenities": "Map<String, Boolean>",
  "policies": "List<String>",
  "quickFacts": "Map<String, String>",
  "tags": "List<String>",
  "media": ["MediaDto"],
  "vibeScore": "Double",
  "avgRatings": { "atmosphere": "Double", "service": "Double", "accuracy": "Double", "value": "Double" },
  "totalReviews": "int",
  "featured": "boolean",
  "destination": "DestinationDto"
}
```

## Community Post (PostDto.Response)
```json
{
  "id": "UUID",
  "author": "AuthorDto",
  "locationName": "String",
  "textContent": "String",
  "media": ["MediaDto"],
  "homestayId": "UUID",
  "homestayName": "String",
  "destinationId": "UUID",
  "postType": "PostType",
  "loveCount": "int",
  "shareCount": "int",
  "commentCount": "int",
  "viewCount": "int",
  "isLikedByCurrentUser": "boolean",
  "isEditorial": "boolean",
  "isFeatured": "boolean",
  "isPinned": "boolean",
  "isTrending": "boolean",
  "trendingScore": "double",
  "editorialScore": "double",
  "createdAt": "Instant",
  "tags": ["String"],
  "originalPost": "PostDto.Response"
}
```

## Community Feed Endpoints

### GET /api/posts/feed

Retrieves the community feed with cursor-based pagination.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | String | No | Base64-encoded pagination cursor |
| `limit` | Integer | No | Page size (default: 12) |
| `scope` | String | No | Feed scope: `latest`, `following`, `trending`, `global` |
| `tag` | String | No | Filter by vibe tag |

**Supported Scopes:**
| Scope | Description |
|-------|-------------|
| `latest` | All posts, newest first (default) |
| `following` | Posts from followed users |
| `trending` | Posts sorted by trending score |
| `global` | Alias for `latest` |

**Response:**
```json
{
  "posts": ["PostFeedDto"],
  "nextCursor": "String|null",
  "hasMore": "boolean",
  "blocks": ["FeedBlockDto"]
}
```

### GET /api/posts/trending

Retrieves trending posts.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cursor` | String | No | Pagination cursor |
| `limit` | Integer | No | Page size (default: 12) |

**Response:** Same as feed response.

### GET /api/posts/{id}

Retrieves a single post by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Post ID |

**Response:** `PostDto.Response`

### POST /api/posts

Creates a new post. Requires authentication.

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `request` | JSON Blob | Yes | Post creation request |
| `files` | File[] | No | Image files |

**Request JSON:**
```json
{
  "textContent": "String",
  "locationName": "String",
  "homestayId": "UUID",
  "postType": "String",
  "tags": ["String"],
  "media": [{"url": "String", "fileId": "String"}]
}
```

**Response:** `PostDto.Response`

### POST /api/posts/{id}/like

Likes a post. Requires authentication.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Post ID |

**Response:**
```json
{
  "liked": "boolean",
  "likeCount": "int"
}
```

### DELETE /api/posts/{id}/like

Unlikes a post. Requires authentication.

**Response:**
```json
{
  "liked": "boolean",
  "likeCount": "int"
}
```

### POST /api/posts/{id}/share

Records a share and increments share count.

**Response:**
```json
{
  "shareCount": "int"
}
```

### POST /api/posts/{id}/repost

Creates a repost. Requires authentication.

**Request Body:**
```json
{
  "textContent": "String (optional quote)"
}
```

**Response:** `PostDto.Response`

### DELETE /api/posts/{id}

Deletes a post. Requires authentication.

**Response:** 200 OK

### DELETE /api/posts/admin/wipe-all

Nuclear wipe - deletes ALL posts, comments, likes, and media. Admin only.

**Response:**
```json
{
  "postsDeleted": "int",
  "commentsDeleted": "int",
  "likesDeleted": "int",
  "mediaDeleted": "int"
}
```

### DELETE /api/posts/admin/wipe-batch

Batch wipe - deletes limited batch of posts. Admin only.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 10 | Max posts to delete |

**Response:**
```json
{
  "deletedCount": "int",
  "hasMore": "boolean"
}
```

## Image Endpoints

### POST /api/images/upload-multiple

Uploads multiple images. Requires authentication.

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | Image files (max 5, each under 5MB) |

**Response:** `[MediaResource]`
```json
[
  {
    "id": "UUID",
    "url": "String",
    "fileId": "String"
  }
]
```

### DELETE /api/images/rollback

Rollback endpoint for orphaned media. Called by frontend when post creation fails.

**Request Body:**
```json
["fileId1", "fileId2", ...]
```

**Response:**
```json
{
  "deleted": "int",
  "failed": "int",
  "total": "int"
}
```

## Homestay Endpoints

### GET /api/homestays
Returns all homestays for dropdown.

### GET /api/homestays/lookup
Returns lightweight homestay list for combobox selection.

**Response:** `[LookupResponse]`
```json
[
  { "id": "UUID", "name": "String" }
]
```

### GET /api/homestays/search
Search homestays with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | String | Search query |
| `tag` | String | Filter by tag |
| `stateSlug` | String | Filter by state |
| `isFeatured` | Boolean | Filter featured |
| `minPrice` / `maxPrice` | BigDecimal | Price range |
| `minLat` / `maxLat` / `minLng` / `maxLng` | Double | Geo bounds |
| `page` / `size` | int | Pagination |

### POST /api/homestays/{id}/view
Records a homestay view.

### POST /api/homestays/{id}/inquiry
Records a homestay inquiry.

### PUT /api/homestays/{id}/approve
Approves a pending homestay. Admin only.

### PUT /api/homestays/{id}/reject
Rejects a pending homestay. Admin only.

### GET /api/homestays/pending
Returns pending homestays for admin approval.

### GET /api/homestays/my-listings
Returns current user's homestay listings.

## User Endpoints

### GET /api/users/{id}/profile

Retrieves a user's public profile.

**Response:** `HostProfileDto`

### POST /api/users/{id}/follow

Follows a user. Requires authentication.

**Response:**
```json
{
  "isFollowing": "boolean",
  "followersCount": "long",
  "followingCount": "long"
}
```

### DELETE /api/users/{id}/follow

Unfollows a user. Requires authentication.

**Response:**
```json
{
  "isFollowing": "boolean",
  "followersCount": "long",
  "followingCount": "long"
}
```

## Reviews (ReviewDto)
```json
{
  "id": "UUID",
  "user": "AuthorDto",
  "rating": "int",
  "atmosphereRating": "int",
  "serviceRating": "int",
  "accuracyRating": "int",
  "valueRating": "int",
  "comment": "String",
  "photoUrls": ["String"],
  "createdAt": "LocalDateTime"
}
```

## Community Interactions (CommentDto)
```json
{
  "id": "UUID",
  "postId": "UUID",
  "parentId": "UUID",
  "author": "AuthorDto",
  "body": "String",
  "media": ["MediaDto"],
  "createdAt": "Instant",
  "replies": ["CommentDto"],
  "replyCount": "int"
}
```

## Homestay Q&A (HomestayQuestionDto)
```json
{
  "id": "UUID",
  "text": "String",
  "createdAt": "LocalDateTime",
  "userFirstName": "String",
  "userLastName": "String",
  "answers": [
    {
      "id": "UUID",
      "text": "String",
      "createdAt": "LocalDateTime",
      "userFirstName": "String",
      "userLastName": "String"
    }
  ]
}
```

## Profiles (HostProfileDto)
```json
{
  "id": "UUID",
  "firstName": "String",
  "lastName": "String",
  "username": "String",
  "avatar": "String",
  "bio": "String",
  "communityPoints": "int",
  "badges": ["String"],
  "verifiedHost": "boolean",
  "followersCount": "long",
  "followingCount": "long",
  "postCount": "long",
  "isFollowing": "boolean",
  "homestays": ["HomestayDto.Response"],
  "posts": ["PostDto.Response"]
}
```

## Geography (DestinationDto & StateDto)
```json
{
  "id": "UUID",
  "slug": "String",
  "name": "String",
  "district": "String",
  "tags": ["String"],
  "stateName": "String",
  "stateSlug": "String"
}
```

## Media Asset (MediaDto)
```json
{
  "id": "UUID",
  "url": "String",
  "fileId": "String"
}
```
