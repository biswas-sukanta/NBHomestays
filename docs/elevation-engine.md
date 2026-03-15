# Elevation Engine (Unified Profile & Gamification)

**Single source of truth for the gamification system.** Verified against codebase on 2026-03-16.

---

## 1. Feature Architecture Overview

### 1.1 The XP Loop

The Elevation Engine implements a gamification system where community contributions earn XP, unlocking progression stages and merit badges.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ELEVATION ENGINE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User clicks "Helpful" on Post                                              │
│         │                                                                    │
│         ▼                                                                    │
│   PostController.markPostHelpful()                                           │
│         │                                                                    │
│         ├── Validate: not self-vote, not already voted                       │
│         ├── Save: HelpfulVote (post_id, user_id)                             │
│         ├── Increment: post.helpful_count                                    │
│         └── Publish: HelpfulVoteEvent                                        │
│                    │                                                         │
│                    ▼                                                         │
│   XpService.handleHelpfulVoteEvent() [Async @TransactionalEventListener]     │
│         │                                                                    │
│         ├── Check: Syndicate anti-spam rules                                 │
│         ├── Calculate: XP = min(10 * (1 + log10(count+1) * 2), 500)         │
│         ├── Award: user.totalXp += xp                                        │
│         ├── Log: user_xp_history (immutable)                                 │
│         └── Publish: XpAwardedEvent                                          │
│                    │                                                         │
│                    ▼                                                         │
│   BadgeService.handleXpAwardedEvent() [Async @EventListener]                 │
│         │                                                                    │
│         └── Check: Stage badge eligibility → award if threshold met         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

| Component | Responsibility |
|-----------|----------------|
| `XpService` | XP calculation, anti-spam, history logging |
| `BadgeService` | Badge awarding via events and scheduled jobs |
| `ProfileService` | Stage computation, profile enrichment |
| `LeaderboardController` | Top 50 users by XP |
| `UserController` | XP history endpoints, badge pinning |

### 1.3 Design Principles

- **Async Event-Driven**: `@TransactionalEventListener` ensures XP processing only after vote transaction commits
- **Immutable History**: All XP changes logged to `user_xp_history` for audit
- **Anti-Spam**: "Syndicate" rules prevent collusion and rapid voting
- **Diminishing Returns**: Log10 formula rewards quality over quantity

---

## 2. Database Schema (Canonical)

### 2.1 badge_definitions Table

```sql
CREATE TABLE badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    badge_type VARCHAR(50) NOT NULL,          -- STAGE, ACHIEVEMENT, SPECIAL
    icon_url TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    stage_number INTEGER,                      -- For STAGE badges (1-20)
    min_xp_threshold INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX idx_badge_definitions_slug ON badge_definitions(slug);
CREATE INDEX idx_badge_definitions_stage ON badge_definitions(stage_number, is_active);
```

### 2.2 user_badges Table

```sql
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE RESTRICT,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    award_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- Indices
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_pinned ON user_badges(user_id, is_pinned) WHERE is_pinned = TRUE;
```

### 2.3 user_xp_history Table

```sql
CREATE TABLE user_xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,          -- POST_HELPFUL, BADGE_AWARD, etc.
    source_id UUID,
    xp_delta INTEGER NOT NULL,                 -- Positive for gains
    reason TEXT,
    balance_after INTEGER NOT NULL,            -- Total XP after this transaction
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_user_xp_history_user_id ON user_xp_history(user_id, created_at DESC);
CREATE INDEX idx_user_xp_history_source ON user_xp_history(source_type, source_id);
```

### 2.4 helpful_votes Table

```sql
CREATE TABLE helpful_votes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)             -- Composite PK prevents double-voting
);

-- Index
CREATE INDEX idx_helpful_votes_user_id ON helpful_votes(user_id, voted_at DESC);
```

### 2.5 Column Additions to users Table

```sql
ALTER TABLE users
    -- Frictionless profile fields
    ADD COLUMN display_name VARCHAR(100),
    ADD COLUMN location VARCHAR(255),
    ADD COLUMN bio TEXT,
    ADD COLUMN languages TEXT[],
    ADD COLUMN interests TEXT[],
    ADD COLUMN traveller_type VARCHAR(50),
    ADD COLUMN show_email BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN allow_messages BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb,
    -- Gamification fields
    ADD COLUMN total_xp INTEGER DEFAULT 0;

-- Indices
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_users_social_links ON users USING GIN (social_links);
CREATE INDEX idx_users_verification_status ON users(verification_status);
```

### 2.6 Column Additions to posts Table

```sql
ALTER TABLE posts
    ADD COLUMN helpful_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN last_computed_xp INTEGER NOT NULL DEFAULT 0;

-- Index
CREATE INDEX idx_posts_helpful_count ON posts(helpful_count DESC);
```

---

## 3. Gamification Logic

### 3.1 XP Formula (Log10 Quality Score)

**Formula:**
```
qualityScore = 1 + log10(helpfulCount + 1) * LOG10_MULTIPLIER
xp = min(BASE_XP * qualityScore, MAX_XP_PER_POST)
```

**Constants (from `XpService.java`):**
| Constant | Value | Purpose |
|----------|-------|---------|
| `BASE_XP_PER_HELPFUL_VOTE` | 10 | Base XP per helpful mark |
| `LOG10_MULTIPLIER` | 2.0 | Scaling factor for quality |
| `MAX_XP_PER_POST` | 500 | Cap to prevent gaming |

**Example Calculations:**
| Helpful Count | Quality Score | XP Awarded |
|---------------|---------------|------------|
| 1 | 1.60 | 16 |
| 5 | 2.49 | 24 |
| 10 | 3.08 | 30 |
| 50 | 4.39 | 43 |
| 100 | 5.00 | 50 |
| 500+ | 7.39+ | 73 (capped at 500 max) |

**Why Log10:**
- Rewards first helpful votes most (quality signal)
- Diminishing returns prevents gaming via vote farming
- Encourages diverse content creation over single viral post

### 3.2 Anti-Spam: "Syndicate" Rules

**Purpose:** Prevent collusion between users (vote farming rings).

**Rules (from `XpService.java`):**
| Rule | Value | Effect |
|------|-------|--------|
| `MAX_VOTES_BETWEEN_USERS_PER_HOUR` | 3 | Same voter→author pair limited to 3 votes/hour |
| `MAX_VOTES_BETWEEN_USERS_PER_DAY` | 5 | Same voter→author pair limited to 5 votes/day |
| `MIN_TIME_BETWEEN_VOTES_MINUTES` | 2 | Minimum 2 minutes between votes on same author |

**Implementation:**
```java
// In-memory rate limiting (ConcurrentHashMap)
// Key: "voterId:authorId"
// Value: List<Instant> of vote timestamps
private final Map<String, List<Instant>> voteRateLimitCache = new ConcurrentHashMap<>();
```

**Violation Behavior:**
- Vote is saved (user sees success)
- XP is NOT awarded
- Warning logged for monitoring

### 3.3 Stage Progression: The 20-Stage Yatra Ladder

**Stages loaded dynamically from `badge_definitions` table (type=STAGE).**

| Stage | Name | XP Threshold | Icon File |
|-------|------|--------------|-----------|
| 1 | The Musafir (The Traveler) | 0 | `/icons/stages/1-musafir.svg` |
| 2 | The Banjara (The Nomad) | 50 | `/icons/stages/2-banjara.svg` |
| 3 | The Ghumakkad (The Rover) | 150 | `/icons/stages/3-ghumakkad.svg` |
| 4 | The Pagdandi Walker (Trail Tracker) | 300 | `/icons/stages/4-pagdandi.svg` |
| 5 | The Dooars Ranger (Gateway Explorer) | 500 | `/icons/stages/5-dooars.svg` |
| 6 | The Aranya Char (Forest Wanderer) | 800 | `/icons/stages/6-aranya.svg` |
| 7 | The Teesta Voyager (River Navigator) | 1,200 | `/icons/stages/7-teesta.svg` |
| 8 | The Pahari Soul (Mountain Soul) | 1,800 | `/icons/stages/8-pahari.svg` |
| 9 | The Megh-Doot (Cloud Messenger) | 2,500 | `/icons/stages/9-megh.svg` |
| 10 | The Valley Shaman (Valley Mystic) | 3,500 | `/icons/stages/10-shaman.svg` |
| 11 | The Darra Pathfinder (Pass Explorer) | 5,000 | `/icons/stages/11-darra.svg` |
| 12 | The Him-Yatri (Snow Traveler) | 7,000 | `/icons/stages/12-himyatri.svg` |
| 13 | The Shikhar Seeker (Peak Seeker) | 10,000 | `/icons/stages/13-shikhar.svg` |
| 14 | The Purvanchal Pioneer (Eastern Pioneer) | 14,000 | `/icons/stages/14-purvanchal.svg` |
| 15 | The Yak Rider (High Altitude Regular) | 19,000 | `/icons/stages/15-yak.svg` |
| 16 | The Brahma Kamal (Sacred Lotus) | 25,000 | `/icons/stages/16-brahma.svg` |
| 17 | The Snow Leopard (Mountain Ghost) | 32,000 | `/icons/stages/17-leopard.svg` |
| 18 | The Safar-E-Khas (Special Journey) | 42,000 | `/icons/stages/18-safar.svg` |
| 19 | The Kanchenjunga Guardian (Peak Protector) | 55,000 | `/icons/stages/19-kanchenjunga.svg` |
| 20 | The Yatra-Guru (Master of the Journey) | 75,000 | `/icons/stages/20-guru.svg` |

**Stage Computation (from `ProfileService.java`):**
```java
@PostConstruct
public void init() {
    loadStages();  // Load from database
}

public void loadStages() {
    List<BadgeDefinition> stageBadges = badgeDefinitionRepository
            .findByBadgeTypeOrderByStageNumberAsc(BadgeType.STAGE);
    
    stages = stageBadges.stream()
            .map(b -> new StageInfo(
                    b.getMinXpThreshold(),
                    b.getName(),
                    b.getIconUrl()))
            .toList();
}

private StageInfo computeStage(Integer totalXp) {
    int xp = totalXp != null ? totalXp : 0;
    StageInfo current = stages.get(0);
    for (StageInfo stage : stages) {
        if (xp >= stage.minXP()) {
            current = stage;
        }
    }
    return current;
}
```

---

## 4. Badge System (Khazana)

### 4.1 Merit Badges (Achievement-Based)

**10 Khazana Merit Badges (seeded via V61 migration):**

| Badge | Slug | Type | XP Reward | Earning Criteria |
|-------|------|------|-----------|------------------|
| The Surya-Tilak (First Light) | `surya-tilak` | ACHIEVEMENT | 10 | Publish first post or review |
| The Margdarshak (The Guide) | `margdarshak` | ACHIEVEMENT | 50 | 20 comments marked as helpful |
| The Darpan (The Lens) | `darpan` | ACHIEVEMENT | 100 | Photo post hits 1000 views + 50 likes |
| The Gupt-Khoj (Secret Discovery) | `gupt-khoj` | ACHIEVEMENT | 100 | 3 high-quality offbeat stories |
| The Kissa-Goi (The Storyteller) | `kissa-goi` | ACHIEVEMENT | 100 | 5 high-engagement trip reports |
| The Atithi-Devo (Honored Guest) | `atithi-devo` | ACHIEVEMENT | 100 | 5 detailed homestay reviews |
| The Zaika Hunter (Flavor Seeker) | `zaika-hunter` | ACHIEVEMENT | 100 | 10 highly-rated food posts |
| The Sangam (The Confluence) | `sangam` | ACHIEVEMENT | 200 | Gain 100 followers |
| The Agni-Shikha (Rising Flame) | `agni-shikha` | ACHIEVEMENT | 150 | Hit the trending feed |
| The Raj-Mohar (Royal Seal) | `raj-mohar` | SPECIAL | 500 | Editorial selection |

### 4.2 Badge Awarding Mechanisms

**1. Event-Driven (Stage Badges):**
```java
@Async
@EventListener
public void handleXpAwardedEvent(XpAwardedEvent event) {
    checkStageBadge(event.userId(), event.newTotalXp());
}
```

**2. Scheduled Jobs (Merit Badges):**
```java
@Scheduled(cron = "0 0 2 * * ?")  // Daily at 2 AM
@Transactional
public void checkKhazanaMeritBadges() {
    List<User> users = userRepository.findAll();
    for (User user : users) {
        checkHelperBadge(user);      // Margdarshak
        checkReviewerBadge(user);    // Atithi-Devo
        checkContributorBadge(user); // Contributor
    }
}
```

### 4.3 Pin/Unpin Logic

**Endpoint:** `PUT /api/users/badges/{badgeId}/pin`

**Implementation (from `BadgeService.java`):**
```java
@Transactional
public void toggleBadgePin(UUID userId, UUID badgeId, boolean pinned) {
    UserBadge userBadge = userBadgeRepository.findByUserIdAndBadgeId(userId, badgeId)
            .orElseThrow(() -> new IllegalArgumentException("Badge not found for user"));
    
    userBadge.setPinned(pinned);
    userBadgeRepository.save(userBadge);
}
```

**Frontend (from `TrophyCase.tsx`):**
- Click badge to toggle pin state
- Pinned badges show pin icon (📌)
- Only badge owner can pin/unpin

---

## 5. API Contract

### 5.1 Helpful Vote Endpoint

**Endpoint:** `POST /api/posts/{id}/helpful`

**Request:**
```http
POST /api/posts/550e8400-e29b-41d4-a716-446655440000/helpful
Authorization: Bearer <jwt>
```

**Response (200 OK):**
```json
{
  "helpfulCount": 5,
  "voted": true
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 401 | User not authenticated |
| 403 | Self-voting attempt |
| 404 | Post not found |
| 409 | Already voted |

### 5.2 Profile Endpoint (Extended)

**Endpoint:** `GET /api/users/{id}/profile`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `viewerId` | UUID | Optional viewer context for follow state |

**Response (HostProfileDto):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "displayName": "Johnny",
  "avatarUrl": "https://ik.imagekit.io/...",
  "bio": "Travel enthusiast",
  "location": "Siliguri, West Bengal",
  "languages": ["English", "Bengali", "Hindi"],
  "interests": ["Trekking", "Wildlife", "Photography"],
  "travellerType": "SOLO",
  "socialLinks": {
    "instagram": "https://instagram.com/johnny",
    "twitter": "https://twitter.com/johnny"
  },
  "totalXp": 1250,
  "currentStageTitle": "The Teesta Voyager",
  "currentStageIconUrl": "/icons/stages/7-teesta.svg",
  "xpToNextStage": 550,
  "pinnedBadges": [
    {
      "id": "uuid",
      "name": "The Surya-Tilak",
      "slug": "surya-tilak",
      "iconUrl": "/icons/badges/surya.svg",
      "awardedAt": "2026-03-15T10:00:00Z",
      "isPinned": true
    }
  ],
  "allBadges": [...],
  "isFollowing": true
}
```

### 5.3 Leaderboard Endpoint

**Endpoint:** `GET /api/community/leaderboard`

**Response (top 50 users):**
```json
[
  {
    "rank": 1,
    "userId": "uuid",
    "displayName": "Top Traveler",
    "avatarUrl": "https://...",
    "totalXp": 15000,
    "stageTitle": "The Shikhar Seeker",
    "stageIconUrl": "/icons/stages/13-shikhar.svg",
    "postCount": 45,
    "followersCount": 120
  }
]
```

### 5.4 Badge Pin Endpoint

**Endpoint:** `PUT /api/users/badges/{badgeId}/pin`

**Request:**
```http
PUT /api/users/badges/550e8400-e29b-41d4-a716-446655440000/pin
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "pinned": true
}
```

**Response:** 204 No Content

### 5.5 XP History Endpoints

**Endpoint:** `GET /api/users/{id}/xp-history`

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "sourceType": "POST_HELPFUL",
      "sourceId": "post-uuid",
      "xpDelta": 24,
      "reason": "Post marked as helpful",
      "balanceAfter": 1250,
      "createdAt": "2026-03-16T02:00:00Z"
    }
  ],
  "totalEntries": 10,
  "totalXp": 1250
}
```

**Endpoint:** `GET /api/users/{id}/xp-history/{sourceType}`

**Source Types:**
- `POST_HELPFUL` - XP from helpful votes
- `BADGE_AWARD` - XP from badge rewards
- `COMMUNITY_CONTRIBUTION` - General contributions
- `HOST_ACTIVITY` - Hosting rewards
- `REVIEW_ACTIVITY` - Review rewards
- `REFERRAL` - Referral bonuses
- `ADMIN_ADJUSTMENT` - Manual adjustments
- `SPECIAL_EVENT` - Event rewards

---

## 6. Frontend Component Architecture

### 6.1 File Locations

```
frontend/
├── app/
│   ├── community/
│   │   ├── page.tsx                    # Feed with helpful button
│   │   └── leaderboard/
│   │       └── page.tsx                # Leaderboard page
│   └── profile/
│       ├── page.tsx                    # Own profile (settings)
│       └── [id]/
│           └── page.tsx                # Public profile (StageRibbon, TrophyCase)
├── components/
│   ├── profile/
│   │   ├── StageRibbon.tsx             # Stage display with progress bar
│   │   ├── TrophyCase.tsx              # Badge grid with pin toggle
│   │   └── ProfileSettingsForm.tsx     # Frictionless profile edit
│   └── community/
│       └── PostInteractionBar.tsx      # Like/Comment/Helpful buttons
├── hooks/
│   ├── useProfile.ts                   # React Query for profile
│   └── useHelpfulVote.ts               # Mutation with cache update
└── lib/
    └── api/
        ├── users.ts                    # Profile API
        └── feed.ts                     # Feed + Leaderboard API
```

### 6.2 StageRibbon Component

**File:** `frontend/components/profile/StageRibbon.tsx`

**Props:**
```typescript
interface StageRibbonProps {
  stageTitle: string;
  stageIconUrl: string;
  totalXp: number;
  xpToNextStage?: number;
}
```

**Progress Calculation:**
```typescript
const progress = xpToNextStage 
    ? Math.min(((totalXp / (totalXp + xpToNextStage)) * 100), 100)
    : 100;
```

**Test Selector:** `data-testid="stage-ribbon"`

### 6.3 TrophyCase Component

**File:** `frontend/components/profile/TrophyCase.tsx`

**Props:**
```typescript
interface TrophyCaseProps {
  badges: BadgeDto[];
  onPinToggle?: (badgeId: string) => void;
  isOwner?: boolean;
}
```

**BadgeDto Interface:**
```typescript
interface BadgeDto {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
  description?: string;
  badgeType: 'STAGE' | 'ACHIEVEMENT' | 'SPECIAL';
  xpReward?: number;
  stageNumber?: number;
  awardedAt?: string;
  isPinned?: boolean;
  awardReason?: string;
}
```

**Test Selector:** `data-testid="trophy-case"`

### 6.4 ProfileSettingsForm (Frictionless Auto-Save)

**File:** `frontend/components/profile/ProfileSettingsForm.tsx`

**Design Principles:**
- Click-driven UI (no manual typing except bio/social links)
- Toggle switches for privacy settings
- Visual chips for languages/interests
- Card selection for travellerType
- Auto-save on blur/toggle (no submit button)

**Predefined Options:**
```typescript
const LANGUAGE_OPTIONS = [
  'English', 'Bengali', 'Hindi', 'Nepali', 'Assamese', 'Maithili'
];

const INTEREST_OPTIONS = [
  'Trekking', 'Wildlife', 'Photography', 'Birdwatching', 
  'Tea Gardens', 'Local Culture', 'Adventure Sports', 'River Rafting'
];

const TRAVELLER_TYPES = [
  { value: 'SOLO', label: 'Solo Explorer', icon: '🧳' },
  { value: 'COUPLE', label: 'Couple', icon: '💑' },
  { value: 'FAMILY', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'GROUP', label: 'Group', icon: '👥' },
  { value: 'BUSINESS', label: 'Business', icon: '💼' },
];
```

### 6.5 Helpful Button in PostInteractionBar

**File:** `frontend/components/community/PostInteractionBar.tsx`

**Icon:** `Lightbulb` from `lucide-react`

**Behavior:**
- Disabled for own posts (`isOwner`)
- Shows helpful count
- Optimistic cache update on click

---

## 7. React Query & Caching

### 7.1 Viewer-Aware Query Key Pattern

**Profile Query:**
```typescript
// Correct: viewer-aware
queryKey: ['users', 'profile', targetId, viewerId]

// Incorrect: viewer-unaware (causes cache pollution)
queryKey: ['users', 'profile', targetId]
```

**Why Viewer-Aware:**
- Profile includes `isFollowing` state
- Different viewers see different follow states
- Cache must be isolated per viewer

### 7.2 Invalidation Strategy (Fix 1)

**Problem:** Helpful vote didn't update feed cache.

**Solution (from `useHelpfulVote.ts`):**
```typescript
const helpfulMutation = useMutation({
    mutationFn: () => markPostHelpful(postId),
    onSuccess: (data) => {
        // Use prefix matching to update all feed permutations
        queryClient.setQueriesData(
            { queryKey: ['community', 'posts'] },
            (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        posts: page.posts.map((post: any) =>
                            post.postId === postId 
                                ? { ...post, helpfulCount: data.helpfulCount }
                                : post
                        ),
                    })),
                };
            }
        );
    },
});
```

### 7.3 Profile Invalidation

**After settings save:**
```typescript
queryClient.invalidateQueries({ 
    queryKey: ['users', 'profile'] 
});
```

**After badge pin toggle:**
```typescript
queryClient.invalidateQueries({ 
    queryKey: ['users', 'profile', userId] 
});
```

---

## 8. Local Execution & Testing

### 8.1 Environment Setup

**Required Environment Variables:**
```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?prepareThreshold=0"
$env:SPRING_DATASOURCE_USERNAME="postgres.qedomjhuepcbjjpskvoq"
$env:SPRING_DATASOURCE_PASSWORD="NBHomestays_2026!"
$env:JWT_SECRET_KEY="local-debug-key-not-for-production-32chars!"
$env:APP_CACHE_REDIS_ENABLED="false"
```

### 8.2 Start Commands

**Backend:**
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 8.3 E2E Test Commands

**Elevation Engine Tests:**
```bash
cd frontend
npx playwright test tests/community/elevation-engine.spec.ts
```

**Tests included:**
1. Guest can mark post as helpful with reactive cache update
2. Profile displays StageRibbon, TrophyCase, and correct Follow state
3. Host can edit profile settings with persistence

**Leaderboard Tests:**
```bash
cd frontend
npx playwright test tests/community/leaderboard.spec.ts
```

**Tests included:**
1. Leaderboard page displays title
2. Leaderboard displays content
3. Top 3 users have gold, silver, bronze styling
4. Navigation from community feed to leaderboard

### 8.4 Test Credentials

**Guest User:**
- Email: `user@nbh.com`
- Password: `User@123`

**Host User:**
- Email: `host@nbh.com`
- Password: `Host@123`

---

## 9. SVG Icon Assets

### 9.1 Badge Icons (10 files)

**Directory:** `frontend/public/icons/badges/`

| File | Badge | Theme |
|------|-------|-------|
| `surya.svg` | Surya-Tilak | Sun with rays |
| `lantern.svg` | Margdarshak | Himalayan lantern |
| `lens.svg` | Darpan | Camera lens |
| `map.svg` | Gupt-Khoj | Treasure map |
| `inkwell.svg` | Kissa-Goi | Quill and inkwell |
| `door.svg` | Atithi-Devo | Door with garland |
| `momo.svg` | Zaika Hunter | Steamer basket |
| `river.svg` | Sangam | River confluence |
| `flame.svg` | Agni-Shikha | Rising flame |
| `seal.svg` | Raj-Mohar | Royal seal |

### 9.2 Stage Icons (20 files)

**Directory:** `frontend/public/icons/stages/`

| File | Stage | Theme |
|------|-------|-------|
| `1-musafir.svg` | Musafir | Traveler on hill |
| `2-banjara.svg` | Banjara | Nomad tent |
| `3-ghumakkad.svg` | Ghumakkad | Globe with path |
| `4-pagdandi.svg` | Pagdandi | Forest trail |
| `5-dooars.svg` | Dooars | Gateway with elephant |
| `6-aranya.svg` | Aranya | Forest with fireflies |
| `7-teesta.svg` | Teesta | River from mountains |
| `8-pahari.svg` | Pahari | Terraced fields |
| `9-megh.svg` | Megh | Clouds over peak |
| `10-shaman.svg` | Shaman | Mystical valley |
| `11-darra.svg` | Darra | Mountain pass |
| `12-himyatri.svg` | Himyatri | Snow traveler |
| `13-shikhar.svg` | Shikhar | Summit with flag |
| `14-purvanchal.svg` | Purvanchal | Eastern sunrise |
| `15-yak.svg` | Yak | High-altitude yak |
| `16-brahma.svg` | Brahma | Sacred lotus |
| `17-leopard.svg` | Leopard | Spotted leopard |
| `18-safar.svg` | Safar | Compass rose |
| `19-kanchenjunga.svg` | Kanchenjunga | Five peaks |
| `20-guru.svg` | Guru | Enlightened master |

**Design Specifications:**
- ViewBox: 64x64
- Color palette: Tailwind CSS colors
- Cultural motifs: Indian/Himalayan themes

---

## 10. Security Considerations

### 10.1 Profile Update Allowlist

**Allowed Fields (from `UserService.java`):**
```java
private static final Set<String> ALLOWED_PROFILE_FIELDS = Set.of(
    "bio", "avatarUrl", "displayName", "location",
    "languages", "interests", "travellerType",
    "showEmail", "allowMessages", "marketingOptIn",
    "socialLinks"
);
```

**Protected Fields (Privilege Escalation Prevention):**
```java
private static final Set<String> GAMIFICATION_FIELDS = Set.of(
    "totalXp", "communityPoints", "verificationStatus",
    "badges", "userBadges", "legacyBadges",
    "role", "enabled", "isVerifiedHost"
);
```

**Behavior:** Any attempt to update protected fields is silently ignored.

### 10.2 Self-Voting Prevention

**Backend Check:**
```java
if (post.getUser().getId().equals(voterId)) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot mark own post as helpful");
}
```

### 10.3 Double-Voting Prevention

**Database Constraint:**
```sql
PRIMARY KEY (post_id, user_id)  -- Composite PK enforces uniqueness
```

**Repository Check:**
```java
if (helpfulVoteRepository.existsByPostIdAndUserId(id, voterId)) {
    throw new ResponseStatusException(HttpStatus.CONFLICT, "Already marked as helpful");
}
```

---

## 11. Troubleshooting

### 11.1 XP Not Awarded After Helpful Vote

**Possible Causes:**
1. Syndicate anti-spam violation (check logs for "Syndicate violation")
2. Event listener not triggered (verify `@EnableAsync` configuration)
3. Post author same as voter (self-voting blocked)

**Diagnostic:**
```sql
-- Check if vote was saved
SELECT * FROM helpful_votes WHERE post_id = :postId AND user_id = :userId;

-- Check XP history
SELECT * FROM user_xp_history WHERE user_id = :authorId ORDER BY created_at DESC LIMIT 10;
```

### 11.2 Stage Not Updating

**Possible Causes:**
1. Stage badges not seeded in database
2. `ProfileService.loadStages()` not called on startup
3. `BadgeDefinitionRepository.findByBadgeTypeOrderByStageNumberAsc()` returning empty

**Diagnostic:**
```sql
-- Verify stage badges exist
SELECT * FROM badge_definitions WHERE badge_type = 'STAGE' ORDER BY stage_number;
```

### 11.3 Profile Settings Not Persisting

**Possible Causes:**
1. Field not in allowlist
2. Invalid enum value for `travellerType`
3. Invalid JSON for `socialLinks`

**Check Backend Logs:**
```
WARN: Invalid travellerType value: INVALID_VALUE
WARN: Invalid socialLinks JSON: {bad json}
```

### 11.4 TrophyCase Not Showing

**Possible Causes:**
1. User has no badges
2. `allBadges` field not populated in DTO
3. Component conditionally hidden

**Current Behavior:** TrophyCase always visible (shows empty state if no badges).

---

## 12. Migration History

| Migration | Description |
|-----------|-------------|
| V58 | Initial schema: badge_definitions, user_badges, user_xp_history, helpful_votes |
| V61 | Fixed JPA array mapping, seeded 10 merit badges + 20 stage badges, added comment.helpful_count |

---

## 13. Files Reference

### Backend Files

| File | Purpose |
|------|---------|
| `model/BadgeDefinition.java` | Badge definition entity |
| `model/UserBadge.java` | User-badge relationship entity |
| `model/UserXpHistory.java` | XP transaction log entity |
| `model/HelpfulVote.java` | Helpful vote entity (composite PK) |
| `model/User.java` | Extended with profile + gamification fields |
| `model/Post.java` | Extended with helpful_count, last_computed_xp |
| `repository/BadgeDefinitionRepository.java` | Badge definition queries |
| `repository/UserBadgeRepository.java` | User-badge queries |
| `repository/UserXpHistoryRepository.java` | XP history queries |
| `repository/HelpfulVoteRepository.java` | Helpful vote queries |
| `service/XpService.java` | XP calculation, anti-spam, history |
| `service/BadgeService.java` | Badge awarding, pin toggle |
| `service/ProfileService.java` | Stage computation, profile enrichment |
| `controller/UserController.java` | XP history endpoints, badge pin |
| `controller/LeaderboardController.java` | Leaderboard API |
| `dto/BadgeDto.java` | Badge API response |
| `dto/XpHistoryDto.java` | XP history API response |
| `dto/LeaderboardEntryDto.java` | Leaderboard entry response |

### Frontend Files

| File | Purpose |
|------|---------|
| `components/profile/StageRibbon.tsx` | Stage display with progress |
| `components/profile/TrophyCase.tsx` | Badge grid with pin toggle |
| `components/profile/ProfileSettingsForm.tsx` | Frictionless profile edit |
| `components/community/PostInteractionBar.tsx` | Helpful button |
| `app/community/leaderboard/page.tsx` | Leaderboard page |
| `app/profile/[id]/page.tsx` | Public profile with gamification |
| `hooks/useProfile.ts` | Profile React Query hook |
| `hooks/useHelpfulVote.ts` | Helpful vote mutation hook |
| `lib/api/users.ts` | Profile API client |
| `lib/api/feed.ts` | Leaderboard API client |

---

*Document generated: March 16, 2026*  
*Single Source of Truth for Elevation Engine*
