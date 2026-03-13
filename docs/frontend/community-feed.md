# Community Feed Design

## Overview

The community feed implements a **boutique editorial** experience where text and images have balanced importance. The design prioritizes readability, strong author identity, and polished image grids.

## Design Specifications

### Post Card Layout (Text-First Balanced)

```
┌────────────────────────────────────────┐
│ Avatar │ Username [Host]               │  ← Header with role badge
│        │ 2h ago · 📍 Kalimpong        │
├────────────────────────────────────────┤
│ Post text content...                   │  ← Text first (4-line clamp)
│ ...line 2...                           │
│ ...line 3...                           │
│ ...line 4... Read more                 │
├────────────────────────────────────────┤
│                                        │
│     Dynamic Image Grid (see below)     │  ← Balanced images
│                                        │
│ [Hidden Gem] [Top Pick]               │  ← Tags below images
├────────────────────────────────────────┤
│ ❤️ 12   💬 8   🔖 Save                 │  ← Interaction bar
└────────────────────────────────────────┘
```

### Visual Specifications

| Property | Value |
|----------|-------|
| Card radius | 20px (`rounded-[20px]`) |
| Card padding | 24px (`p-6`) |
| Card gap | 28px (`space-y-7`) |
| Card border | Subtle (`border-neutral-200/60`) |
| Image grid radius | 16px (`rounded-[16px]`) |
| Image grid gap | 6px (`gap-1.5`) |
| Text clamp | 4 lines (`line-clamp-4`) |
| Max feed width | 720px (`max-w-[720px]`) |

### Typography Scale

- **Username**: 14px semibold (`text-sm font-semibold`)
- **Role badge**: 9px uppercase (`text-[9px] uppercase`)
- **Timestamp/Location**: 12px neutral-400 (`text-xs text-neutral-400`)
- **Post text**: 15px neutral-800 (`text-[15px] text-neutral-800`)
- **Tags**: 10px uppercase tracking-wide (`text-[10px] uppercase tracking-wide`)

## Dynamic Image Grid System

The `ImageGrid` component automatically selects the optimal layout based on image count:

### 1 Image (4:3 aspect ratio)
```
┌────────────────────────────────────┐
│                                    │
│         Single Image               │
│         (aspect-[4/3])             │
│                                    │
└────────────────────────────────────┘
```

### 2 Images (1:1 square, 6px gap)
```
┌─────────────────┬─────────────────┐
│                 │                 │
│    Image 1      │    Image 2      │
│   (square)      │   (square)      │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 3 Images (1 large + 2 stacked)
```
┌─────────────────┬─────────────────┐
│                 │    Image 2      │
│    Image 1      ├─────────────────┤
│   (large)       │    Image 3      │
│                 │                 │
└─────────────────┴─────────────────┘
```

### 4+ Images (2x2 grid with +N overlay)
```
┌─────────────────┬─────────────────┐
│    Image 1      │    Image 2      │
├─────────────────┼─────────────────┤
│    Image 3      │ Image 4 (+N)    │
└─────────────────┴─────────────────┘
```

## Author Identity

### Role Badge
- **Host badge**: Displayed when `isVerifiedHost` is true
- Style: Emerald background, uppercase, 9px font
- Position: Next to username in header

### Location
- Displayed with 📍 emoji
- Format: `Timestamp · 📍 Location`
- Truncates at 120px width

## Interaction Bar

Simplified to three actions:

| Action | Icon | Label | Color |
|--------|------|-------|-------|
| Like | Heart | Count | Red when liked |
| Comment | MessageCircle | Count | Emerald on hover |
| Save | Bookmark | "Save" | Amber when saved |

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

Handles like/comment/save actions with optimistic updates:

```tsx
<PostInteractionBar
  postId={post.id}
  likes={post.likes}
  comments={post.comments}
  isLiked={post.isLikedByCurrentUser}
  isSaved={false}
  onOpenComments={() => openComments(post.id)}
  onLikeToggle={(count, liked) => updatePost({ likes: count, isLiked: liked })}
  onSaveToggle={(saved) => handleSave(saved)}
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
│   ├── PostInteractionBar.tsx      # Like/comment/save actions
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

- **Card hover**: Subtle border darkening
- **Image hover**: Scale 1.05 zoom effect
- **Like animation**: Heart pop effect
- **Read more**: Expand/collapse text smoothly
