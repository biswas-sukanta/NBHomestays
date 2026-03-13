# Community Feed Design

## Overview

The community feed implements a premium storytelling experience where **text and images have balanced importance**. The design prioritizes readability while showcasing visual content through dynamic image grids.

## Design Specifications

### Post Card Layout (Text-First Balanced)

```
┌────────────────────────────────────────┐
│ Avatar │ Username                      │  ← Header row
│        │ Timestamp · 📍 Location       │
├────────────────────────────────────────┤
│ Post text content...                   │  ← Text first (4-line clamp)
│ ...line 2...                           │
│ ...line 3...                           │
│ ...line 4... Read more                 │
│ Tags: [Hidden Gem] [Top Pick]          │
├────────────────────────────────────────┤
│                                        │
│     Dynamic Image Grid (see below)     │  ← Balanced images
│                                        │
├────────────────────────────────────────┤
│ ❤️ 12   💬 8   🔄 Repost   ↗️ 3        │  ← Interaction bar
└────────────────────────────────────────┘
```

### Visual Specifications

| Property | Value |
|----------|-------|
| Card radius | 20px (`rounded-[20px]`) |
| Card padding | 24px (`p-6`) |
| Card gap | 28px (`space-y-7`) |
| Image grid radius | 16px (`rounded-[16px]`) |
| Text clamp | 4 lines (`line-clamp-4`) |
| Max feed width | 720px (`max-w-[720px]`) |
| Shadow | Subtle (`shadow-[0_1px_2px_rgba(0,0,0,0.04)]`) |
| Hover shadow | (`hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]`) |

### Typography Scale

- **Username**: 14px semibold (`text-sm font-semibold`)
- **Timestamp/Location**: 12px neutral-400 (`text-xs text-neutral-400`)
- **Post text**: 15px neutral-800 (`text-[15px] text-neutral-800`)
- **Tags**: 10px uppercase tracking-wide (`text-[10px] uppercase tracking-wide`)

## Dynamic Image Grid System

The `ImageGrid` component automatically selects the optimal layout based on image count:

### 1 Image
```
┌────────────────────────────────────┐
│                                    │
│         Single Image               │
│         (max-h: 400px)             │
│                                    │
└────────────────────────────────────┘
```

### 2 Images
```
┌─────────────────┬─────────────────┐
│                 │                 │
│    Image 1      │    Image 2      │
│   (square)      │   (square)      │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 3 Images
```
┌─────────────────┬─────────────────┐
│                 │    Image 2      │
│    Image 1      ├─────────────────┤
│   (large)       │    Image 3      │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 4+ Images
```
┌─────────────────┬─────────────────┐
│    Image 1      │    Image 2      │
├─────────────────┼─────────────────┤
│    Image 3      │ Image 4 (+N)    │
└─────────────────┴─────────────────┘
```

## Component Structure

### PostCardUnified

Primary post card component with text-first layout:

```tsx
<PostCardUnified
  post={post}
  variant="standard"           // featured | standard | collage
  currentUser={user}
  onEdit={(p) => openEditor(p)}
  onDelete={(id) => deletePost(id)}
  onOpenComments={(id) => openComments(id)}
/>
```

### ImageGrid

Dynamic grid component with automatic layout selection:

```tsx
<ImageGrid
  images={post.images}         // MediaVariant[]
  imageCount={post.images.length}
  onImageClick={(idx) => openLightbox(idx)}
/>
```

### PostInteractionBar

Handles like/comment/repost/share actions with optimistic updates:

```tsx
<PostInteractionBar
  postId={post.id}
  likes={post.likes}
  comments={post.comments}
  shareCount={post.shareCount}
  isLiked={post.isLikedByCurrentUser}
  onOpenComments={() => openComments(post.id)}
  onRepost={handleRepost}
  onLikeToggle={(count, liked) => updatePost({ likes: count, isLiked: liked })}
/>
```

## ImageKit Integration

Images are served through ImageKit CDN with automatic optimization:

```tsx
<OptimizedImage
  src="https://ik.imagekit.io/..."
  alt="Post image"
  width={900}
  small={image.small}     // 480w
  medium={image.medium}  // 800w
  large={image.large}    // 1200w
/>
```

### Responsive SrcSet

Generated automatically for ImageKit URLs:

```html
srcset="
  https://...?tr=... 480w,
  https://...?tr=... 800w,
  https://...?tr=... 1200w
"
sizes="(max-width: 640px) 480px, (max-width: 1024px) 800px, 1200px"
```

### Image Transformations

- Auto format (`f-auto`) - WebP/AVIF where supported
- Quality optimization (`q-80`)
- Hover zoom effect (`group-hover:scale-105`)

## Timestamp Formatting

Relative timestamps via `formatRelative()`:

| Time elapsed | Display |
|--------------|---------|
| < 1 min | Just now |
| < 1 hr | 5 min ago |
| < 24 hr | 2 hr ago |
| < 48 hr | Yesterday |
| > 48 hr | 3d ago |

## Performance Optimizations

1. **Lazy loading** - Images load on scroll (`loading="lazy"`)
2. **Skeleton loading** - PostSkeleton shows while content loads
3. **Optimistic updates** - Likes/comments update instantly before API response
4. **Infinite scroll** - Cursor-based pagination with intersection observer

## File Locations

```
frontend/
├── app/community/page.tsx          # Feed page with infinite scroll
├── components/community/
│   ├── PostCardUnified.tsx         # Main post card component
│   ├── PostInteractionBar.tsx      # Like/comment/repost actions
│   ├── PostSkeleton.tsx            # Loading skeleton
│   ├── ImageLightbox.tsx           # Full-screen image viewer
│   └── types.ts                    # TypeScript types
├── lib/utils/feed-utils.ts         # Layout utilities, timestamps
├── lib/adapters/normalizePost.ts   # API response normalization
└── components/ui/optimized-image.tsx # ImageKit image component
```

## Mobile Responsiveness

- Feed max-width 720px centered
- Cards full-width on mobile
- Image grid collapses to single column on very small screens
- Touch-friendly interaction targets (44px min)
- Swipe gestures in lightbox
- Collapsible filter bar

## Interactions

- **Card hover**: Subtle elevation increase
- **Image hover**: Scale 1.05 zoom effect
- **Like animation**: Heart pop effect
- **Read more**: Expand/collapse text smoothly
