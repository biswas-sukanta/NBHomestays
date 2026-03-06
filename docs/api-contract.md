# API Contract

*Auto-Updated Document*: This file maps the exact DTO structures found in the `com.nbh.backend.dto.*` package.

## Authentication (AuthDto)
- **Register**: `email`, `password`, `firstname`, `lastname`, `role`.
- **Authenticate**: `email`, `password` -> Returns `accessToken`, `refreshToken`.

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
  "loveCount": "int",
  "commentCount": "int",
  "isLikedByCurrentUser": "boolean",
  "createdAt": "LocalDateTime",
  "tags": ["String"],
  "originalPost": "PostDto.Response"
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
  "createdAt": "LocalDateTime",
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
  "bio": "String",
  "communityPoints": "int",
  "badges": ["String"],
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

