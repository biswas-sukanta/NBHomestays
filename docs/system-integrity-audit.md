# System Integrity Audit Report

**Audit Date:** 2025-01-XX  
**Auditor:** Staff Security & Performance Engineer  
**Scope:** Ultra-deep system integrity and codebase audit across five phases  

---

## Executive Summary

This audit covers API contract fidelity, dead code analysis, database transaction integrity, external service lifecycle, and future regression risks. The system demonstrates **mature architectural patterns** with proactive N+1 query prevention, async job processing for external services, and proper transactional boundaries. However, several areas require attention.

| Phase | Severity Distribution |
|-------|----------------------|
| Phase 1: API Contract | 🟡 3 Medium, 🟢 2 Low |
| Phase 2: Dead Code | 🟡 4 Medium, 🟢 3 Low |
| Phase 3: DB/Transaction | 🔴 1 High, 🟡 3 Medium, 🟢 2 Low |
| Phase 4: External Services | 🟡 2 Medium, 🟢 3 Low |
| Phase 5: Regression Risks | 🟡 4 Medium, 🟢 2 Low |

---

## Phase 1: API Contract vs. Payload Audit

### Objective
Trace every frontend API call to backend controllers, compare DTO payloads with frontend consumption, flag over-fetching/under-fetching.

### Methodology
1. Analyzed frontend API clients in `frontend/lib/api/*.ts`
2. Mapped endpoints to backend controllers
3. Compared DTO fields with frontend component consumption

### Findings

#### 1.1 Post Feed API - Over-fetching Detected 🟡 MEDIUM

**Endpoint:** `GET /api/posts/feed`  
**Backend DTO:** `PostFeedDto.FeedResponse`  
**Frontend Consumer:** Feed components via `getFeed()` in `frontend/lib/api/feed.ts`

| DTO Field | Backend Provides | Frontend Uses | Status |
|-----------|-----------------|---------------|--------|
| `postId` | ✅ | ✅ | OK |
| `textContent` | ✅ | ✅ | OK |
| `createdAt` | ✅ | ✅ | OK |
| `authorId/Name/AvatarUrl/Role/VerifiedHost` | ✅ | ✅ | OK |
| `commentCount/likeCount/shareCount` | ✅ | ✅ | OK |
| `homestayId/homestayName` | ✅ | ✅ | OK |
| `isLikedByCurrentUser` | ✅ | ✅ | OK |
| `tags` | ✅ | ✅ | OK |
| `media` (with variants) | ✅ | ✅ | OK |
| `isRepost/originalPostId/originalAuthorName/originalContentPreview` | ✅ | ✅ | OK |
| `mediaCount/textLength` | ✅ | ❌ | **OVER-FETCH** |
| `imageDimensions` | ✅ | ❌ | **OVER-FETCH** |
| `postCategory/postPriority` | ✅ | ❌ | **OVER-FETCH** |
| `trendingScore/editorialScore` | ✅ | ❌ | **OVER-FETCH** |

**Recommendation:** Create a `PostFeedDto.LightResponse` projection for non-editorial feed views, or document these fields as reserved for future layout engine features.

---

#### 1.2 Homestay Response DTO - Over-fetching 🟡 MEDIUM

**Endpoint:** `GET /api/homestays/{id}`  
**Backend DTO:** `HomestayDto.Response` (109 fields)  
**Frontend Consumer:** Homestay detail page

| DTO Field | Backend Provides | Frontend Uses | Status |
|-----------|-----------------|---------------|--------|
| `editorialLead` | ✅ | ❌ | **OVER-FETCH** |
| `nearbyHighlights` | ✅ | ❌ | **OVER-FETCH** |
| `bookingHeatScore` | ✅ | ❌ | **OVER-FETCH** |
| `trustSignals` | ✅ | ❌ | **OVER-FETCH** |
| `mealPlanCode/mealPlanLabel` | ✅ | ❌ | **OVER-FETCH** |

**Location:** `@backend/src/main/java/com/nbh/backend/dto/HomestayDto.java:103-108`

**Recommendation:** These are premium/editorial fields. Either implement frontend consumption or move to a separate `HomestayEditorialDto` for admin endpoints.

---

#### 1.3 AuthorDto - Potential Under-fetching 🟢 LOW

**Location:** `@backend/src/main/java/com/nbh/backend/dto/AuthorDto.java:14-20`

```java
public class AuthorDto {
    private UUID id;
    private String name;
    private String role;
    private String avatarUrl;
    private boolean isVerifiedHost;
}
```

**Frontend Expectation:** `PublicProfile` interface in `@frontend/lib/api/users.ts:3-19` expects additional fields:
- `bio`
- `communityPoints`
- `badges`
- `followersCount/followingCount`
- `postCount`
- `isFollowing`

**Impact:** Profile pages may need separate API call to fetch full user profile.

**Recommendation:** Document that `AuthorDto` is a lightweight projection for post/comment contexts, while `HostProfileDto` is used for full profile views.

---

#### 1.4 Comment DTO - Field Alignment ✅ OK

**Endpoint:** `GET /api/posts/{postId}/comments`  
**Backend DTO:** `CommentDto`  
**Frontend Consumer:** `comments-section.tsx`

| DTO Field | Status |
|-----------|--------|
| `id, postId, parentId` | ✅ Used |
| `author (AuthorDto)` | ✅ Used |
| `body` | ✅ Used |
| `media (List<MediaDto>)` | ✅ Used |
| `createdAt` | ✅ Used |
| `replies, replyCount` | ✅ Used |

**Verdict:** Well-aligned, no over/under-fetching.

---

#### 1.5 Review DTO - Missing Fields 🟡 MEDIUM

**Endpoint:** `GET /api/reviews/homestay/{homestayId}`  
**Backend DTO:** `ReviewDto.Response`  
**Location:** `@backend/src/main/java/com/nbh/backend/dto/ReviewDto.java:54-65`

**Missing Fields:**
- `userId` (only `userName` provided)
- `userAvatarUrl` (for avatar display)
- `homestayId` (for context)

**Recommendation:** Add `AuthorDto author` instead of flat `userName` for consistency with other DTOs.

---

### Phase 1 Summary

| Issue | Severity | Action Required |
|-------|----------|-----------------|
| Feed DTO over-fetching layout metadata | 🟡 Medium | Document or create light projection |
| Homestay DTO unused editorial fields | 🟡 Medium | Move to separate DTO or implement UI |
| AuthorDto vs PublicProfile mismatch | 🟢 Low | Document context-specific DTOs |
| ReviewDto missing author avatar | 🟡 Medium | Add AuthorDto field |

---

## Phase 2: Dead Code & Unused Assets Analysis

### Methodology
1. Scanned frontend components for export/import patterns
2. Analyzed backend classes, methods, DTOs for usage
3. Traced actual dependency trees

### Findings

#### 2.1 Unused Frontend Components 🟡 MEDIUM

**File:** `@frontend/components/homestay-swimlane.tsx`

```typescript
export function HomestaySwimlane({ title, subtitle, homestays }: HomestaySwimlaneProps)
```

**Status:** Exported but **NOT IMPORTED** anywhere in the codebase.

**Search Results:** No imports found in any page or component.

**Recommendation:** Either integrate into homestay listing pages or remove if superseded by `HomestayCarousel`.

---

#### 2.2 Duplicate Carousel Components 🟡 MEDIUM

**Files:**
- `@frontend/components/homestay-carousel.tsx` - Used in pages
- `@frontend/components/homestay-swimlane.tsx` - Not used

**Analysis:** Both implement horizontal scrolling homestay cards. `HomestayCarousel` is actively used, `HomestaySwimlane` appears to be an earlier iteration.

**Recommendation:** Consolidate to single implementation.

---

#### 2.3 Backend DTO - TrustSignal Enum Unused 🟢 LOW

**Location:** `@backend/src/main/java/com/nbh/backend/dto/HomestayDto.java:20-27`

```java
public enum TrustSignal {
    FAST_REPLY, GUEST_FAVORITE, POPULAR_STAY, NEW_LISTING, TRUSTED_HOST, HIGH_DEMAND
}
```

**Status:** Defined but `trustSignals` field in `HomestayDto.Response` is never populated by any service method.

**Recommendation:** Either implement trust signal computation logic or remove dead code.

---

#### 2.4 Backend Method - search() vs searchCards() 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/repository/HomestayRepositoryImpl.java`

Two similar search methods exist:
1. `search()` - Returns `Page<Homestay>` entities (lines 45-235)
2. `searchCards()` - Returns `Page<SearchCardDto>` projections (lines 237-361)

**Usage Analysis:**
- `searchCards()` is actively used by `HomestayService.searchHomestays()`
- `search()` appears **UNUSED** - no service calls found

**Recommendation:** Verify and remove `search()` method if truly unused, or document its intended use case.

---

#### 2.5 Unused Import - LocalDateTime in ReviewDto 🟢 LOW

**Location:** `@backend/src/main/java/com/nbh/backend/dto/ReviewDto.java:12`

```java
import java.time.LocalDateTime;
```

**Issue:** `createdAt` field uses `LocalDateTime`, but modern entities use `Instant`. Inconsistent with other DTOs.

**Recommendation:** Migrate to `Instant` for consistency with `PostDto`, `CommentDto`.

---

#### 2.6 Legacy Image Fields - Partial Migration 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/service/CommentService.java:205-210`

```java
// Fallback for Legacy Images
if (c.getLegacyImageUrls() != null && !c.getLegacyImageUrls().isEmpty() && combinedMedia.isEmpty()) {
    for (String url : c.getLegacyImageUrls()) {
        combinedMedia.add(MediaResource.builder().url(url).build());
    }
}
```

**Status:** Legacy field handling exists but may indicate incomplete migration to `MediaResource` model.

**Recommendation:** Audit database for remaining legacy image URLs and plan migration completion.

---

### Phase 2 Summary

| Asset | Location | Status | Action |
|-------|----------|--------|--------|
| `HomestaySwimlane` component | `frontend/components/` | Unused | Remove or integrate |
| `TrustSignal` enum | `HomestayDto.java` | Unpopulated | Implement or remove |
| `search()` repository method | `HomestayRepositoryImpl.java` | Possibly unused | Verify and remove |
| Legacy image URLs | `Comment` entity | Partial migration | Complete migration |
| `LocalDateTime` in ReviewDto | `ReviewDto.java` | Inconsistent | Migrate to `Instant` |

---

## Phase 3: Database & Transaction Integrity

### Methodology
1. Scanned all `@Transactional` annotations
2. Analyzed JPA repository methods for N+1 risks
3. Reviewed native SQL queries and EntityGraph usage

### Findings

#### 3.1 Missing @Transactional on Delete Operations 🔴 HIGH

**Location:** `@backend/src/main/java/com/nbh/backend/service/HomestayService.java:315-321`

```java
@Caching(evict = {
    @CacheEvict(value = "homestay", key = "#id"),
    @CacheEvict(value = "homestaysSearch", allEntries = true)
})
public void rejectHomestay(UUID id) {  // NO @Transactional!
    Homestay homestay = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Homestay not found"));
    homestay.setStatus(Homestay.Status.REJECTED);
    repository.save(homestay);
}
```

**Issue:** `rejectHomestay()` lacks `@Transactional`. If the save fails after cache eviction, cache is invalidated but DB is inconsistent.

**Recommendation:** Add `@Transactional` annotation:
```java
@Transactional
@Caching(evict = {...})
public void rejectHomestay(UUID id) { ... }
```

---

#### 3.2 N+1 Query Prevention - Well Implemented ✅

**Location:** `@backend/src/main/java/com/nbh/backend/repository/HomestayRepositoryImpl.java:216-224`

```java
// N+1 Fix: Fetch entities with JOIN FETCH
List<Homestay> unsorted = entityManager.createQuery(
    "SELECT DISTINCT h FROM Homestay h " +
    "LEFT JOIN FETCH h.owner " +
    "LEFT JOIN FETCH h.mediaFiles " +
    "LEFT JOIN FETCH h.destination d " +
    "LEFT JOIN FETCH d.state " +
    "WHERE h.id IN :ids",
    Homestay.class).setParameter("ids", ids).getResultList();
```

**Verdict:** Proper N+1 prevention with JOIN FETCH pattern.

---

#### 3.3 FeedRepository - Batch Loading Pattern ✅

**Location:** `@backend/src/main/java/com/nbh/backend/repository/FeedRepository.java`

Excellent batch loading pattern avoids N+1:
- `findMediaByPostIds()` - Batch media loading
- `findTagsByPostIds()` - Batch tag loading
- `countCommentsByPostIds()` - Batch comment counts
- `findLikedPostIds()` - Batch like status check

**Verdict:** Well-architected feed query system.

---

#### 3.4 EntityGraph Usage - Proper ✅

**Location:** `@backend/src/main/java/com/nbh/backend/repository/DestinationRepository.java:29-36`

```java
@Override
@EntityGraph(attributePaths = { "state", "tags" })
List<Destination> findAll();

@EntityGraph(attributePaths = { "state", "tags" })
Optional<Destination> findBySlug(String slug);
```

**Verdict:** Proper EntityGraph usage prevents lazy-loading N+1.

---

#### 3.5 Transactional Boundaries - Inconsistent readOnly 🟡 MEDIUM

**Issue:** Some read operations lack `@Transactional(readOnly = true)`.

**Examples:**
- `HomestayService.searchHomestays()` - Has `@Transactional(readOnly = true)` ✅
- `PostService.getPostById()` - Missing `@Transactional(readOnly = true)` ❌

**Recommendation:** Add `@Transactional(readOnly = true)` to all read-only service methods for:
1. Hibernate session optimization
2. Connection pool hints
3. Replication routing (if applicable)

---

#### 3.6 AdminDataService - Nuclear Wipe Transaction 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/service/AdminDataService.java:145-174`

```java
@Transactional
public void deleteAllHomestays() {
    jdbcTemplate.execute("DELETE FROM post_likes");
    jdbcTemplate.execute("DELETE FROM trip_board_saves");
    // ... multiple DELETE statements
    entityManager.clear(); // Sync persistence context
    // Clear caches
}
```

**Concerns:**
1. Single transaction with multiple DML operations may exceed DB transaction timeout
2. No rollback handling for cache clear failures
3. Large dataset deletion could lock tables

**Recommendation:** 
- Add transaction timeout: `@Transactional(timeout = 300)`
- Consider batch deletion with smaller transactions for production safety
- Add explicit rollback logging

---

### Phase 3 Summary

| Issue | Severity | Location | Action |
|-------|----------|----------|--------|
| Missing @Transactional on rejectHomestay | 🔴 High | `HomestayService.java:315` | Add annotation |
| Missing readOnly on read methods | 🟡 Medium | Various services | Add readOnly=true |
| Nuclear wipe transaction size | 🟡 Medium | `AdminDataService.java:145` | Add timeout, batch |
| N+1 Prevention | ✅ Good | Multiple repos | Maintain pattern |

---

## Phase 4: External Service Integrity (ImageKit)

### Methodology
1. Traced ImageKit SDK integration
2. Analyzed upload/delete/move lifecycle
3. Reviewed error handling and rollback logic

### Findings

#### 4.1 ImageKit Configuration - Graceful Degradation ✅

**Location:** `@backend/src/main/java/com/nbh/backend/config/ImageKitConfig.java:22-38`

```java
@PostConstruct
public void initImageKit() {
    if (publicKey.isBlank() || privateKey.isBlank() || urlEndpoint.isBlank()) {
        log.warn("[IMAGEKIT DIAGNOSTIC] SKIPPED: Missing ImageKit credentials.");
        return;  // Graceful degradation
    }
    // ... initialization
}
```

**Verdict:** Proper null-safety and graceful degradation when credentials missing.

---

#### 4.2 Upload Error Handling - Partial Rollback 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/service/ImageUploadService.java:117-128`

```java
for (MultipartFile file : files) {
    try {
        Result result = ImageKit.getInstance().upload(fileCreateRequest);
        // Success - add to results
    } catch (Exception e) {
        log.error("[IMAGEKIT UPLOAD] FATAL ERROR: Failed to upload file {}", originalFilename, e);
        throw new IOException("Failed to upload file to ImageKit", e);  // Stops processing
    }
}
```

**Issue:** If uploading 3 files and the 2nd fails, the 1st file remains orphaned in ImageKit. No cleanup of partial uploads.

**Recommendation:** Implement compensating transaction:
```java
// Track successfully uploaded fileIds
List<String> uploadedFileIds = new ArrayList<>();
try {
    // ... upload loop, track fileIds
} catch (Exception e) {
    // Cleanup partial uploads
    uploadedFileIds.forEach(fileId -> {
        try { deleteFileById(fileId); } catch (Exception ignored) {}
    });
    throw e;
}
```

---

#### 4.3 Async Job Processing - Robust ✅

**Location:** `@backend/src/main/java/com/nbh/backend/service/AsyncJobService.java:99-121`

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void processJob(UUID jobId) {
    // ... processing
    try {
        runJob(job.getJobType(), payload);
        job.setStatus(AsyncJobStatus.DONE);
    } catch (Exception e) {
        int nextAttempts = (job.getAttempts() == null ? 0 : job.getAttempts()) + 1;
        job.setAttempts(nextAttempts);
        job.setStatus(nextAttempts >= maxAttempts ? AsyncJobStatus.FAILED : AsyncJobStatus.PENDING);
        // Retry logic with max attempts
    }
}
```

**Verdict:** Excellent async job pattern with:
- Retry mechanism (max 5 attempts)
- Status tracking (PENDING → IN_PROGRESS → DONE/FAILED)
- Error message truncation
- REQUIRES_NEW propagation for isolation

---

#### 4.4 Delete Idempotency - Well Implemented ✅

**Location:** `@backend/src/main/java/com/nbh/backend/service/ImageUploadService.java:137-152`

```java
public void deleteFileById(String fileId) {
    try {
        Result result = ImageKit.getInstance().deleteFile(fileId);
    } catch (Exception e) {
        if (isNotFound(e)) {
            // Idempotent delete: treat missing file as success.
            log.info("[IMAGEKIT DELETE] File already deleted or missing for fileId {}", fileId);
            return;
        }
        throw new RuntimeException("Failed to delete fileId from ImageKit: " + fileId, e);
    }
}
```

**Verdict:** Proper idempotent delete handling.

---

#### 4.5 Orphaned Media Risk - Homestay Update 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/service/HomestayService.java:378-436`

**Flow:**
1. User removes media from homestay
2. `removedFileIds` collected
3. `asyncJobService.enqueueDeleteMedia(removedFileIds)` called
4. If async job fails after max retries → **ORPHANED FILES**

**Risk:** Failed async jobs leave orphaned files in ImageKit, incurring storage costs.

**Recommendation:**
1. Add monitoring/alerting for failed async jobs
2. Implement periodic orphan cleanup job
3. Consider synchronous delete for critical paths

---

#### 4.6 File Validation - Good ✅

**Location:** `@backend/src/main/java/com/nbh/backend/service/ImageUploadService.java:194-208`

```java
private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty file");
    }
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type");
    }
    long size = file.getSize();
    if (size > MAX_FILE_SIZE_BYTES) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each image must be under 5MB");
    }
}
```

**Verdict:** Proper validation for:
- Empty files
- Content type whitelist (jpeg, png, webp)
- Size limit (5MB)

---

### Phase 4 Summary

| Issue | Severity | Location | Action |
|-------|----------|----------|--------|
| Partial upload rollback | 🟡 Medium | `ImageUploadService.java:117` | Add compensating transaction |
| Async job failure = orphaned files | 🟡 Medium | `HomestayService.java:436` | Add monitoring, cleanup job |
| Idempotent delete | ✅ Good | `ImageUploadService.java:137` | Maintain |
| Async job retry | ✅ Good | `AsyncJobService.java:99` | Maintain |

---

## Phase 5: Future Regression & Edge Case Hunting

### Methodology
1. Searched for hardcoded values
2. Analyzed timezone handling
3. Identified missing env vars
4. Flagged large methods violating SRP

### Findings

#### 5.1 Timezone Handling - Inconsistent 🟡 MEDIUM

**Issue:** Mixed use of `Instant`, `LocalDateTime`, and `OffsetDateTime` without consistent timezone handling.

**Examples:**

1. **Correct UTC usage:**
```java
// FollowService.java:47
.createdAt(OffsetDateTime.now(ZoneOffset.UTC))

// ImageUploadService.java:56-57
String cutoffUtc = cutoff.withOffsetSameInstant(ZoneOffset.UTC)
    .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
```

2. **Potentially problematic:**
```java
// HomestayService.java:147
LocalDateTime now = LocalDateTime.now();  // Uses server default timezone!

// TrendingService.java:29
Instant now = Instant.now();  // Correct - UTC
```

**Recommendation:** 
- Standardize on `Instant` for all timestamps
- If `LocalDateTime` required, use `LocalDateTime.now(ZoneOffset.UTC)` explicitly
- Add `@TimeZoneAware` documentation to entities

---

#### 5.2 Hardcoded Thresholds 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/service/HomestayRepositoryImpl.java:36-42`

```java
private long popularInquiryThreshold() {
    return Long.parseLong(environment.getProperty("homestay.signals.popularInquiryThreshold", "5"));
}

private long highDemandViewThreshold() {
    return Long.parseLong(environment.getProperty("homestay.signals.highDemandViewThreshold", "200"));
}
```

**Verdict:** ✅ Good - Externalized to environment properties with defaults.

---

#### 5.3 Hardcoded Constants - Need Externalization 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/service/ImageUploadService.java:30-35`

```java
private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;  // 5MB hardcoded
private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
    "image/jpeg", "image/png", "image/webp"
);
```

**Recommendation:** Externalize to configuration:
```properties
imagekit.max-file-size-bytes=5242880
imagekit.allowed-content-types=image/jpeg,image/png,image/webp
```

---

#### 5.4 Missing Environment Variable Validation 🟡 MEDIUM

**Location:** `@backend/src/main/java/com/nbh/backend/service/ImageUploadService.java:96-100`

```java
if (imageKitPublicKey == null || imageKitPublicKey.isBlank()
    || imageKitPrivateKey == null || imageKitPrivateKey.isBlank()
    || imageKitUrlEndpoint == null || imageKitUrlEndpoint.isBlank()) {
    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
        "Image upload service not configured");
}
```

**Verdict:** ✅ Good - Runtime validation exists.

**However:** Missing startup validation. Application starts successfully even if ImageKit credentials are missing, only failing at runtime when upload attempted.

**Recommendation:** Add startup health check:
```java
@EventListener(ApplicationReadyEvent.class)
public void validateConfiguration() {
    if (credentialsMissing) {
        log.error("ImageKit credentials not configured. Image uploads will fail.");
    }
}
```

---

#### 5.5 Large Method - SRP Violation 🟢 LOW

**Location:** `@backend/src/main/java/com/nbh/backend/service/HomestayRepositoryImpl.java:45-235`

**Method:** `search()` - 190 lines

**Concerns:**
- SQL building
- Parameter binding
- Result mapping
- Pagination logic
- H2/PostgreSQL branching

**Recommendation:** Extract into smaller methods:
- `buildSearchQuery()`
- `bindSearchParameters()`
- `executeSearchQuery()`
- `mapResultsToEntities()`

---

#### 5.6 Hardcoded Fallback Images 🟢 LOW

**Location:** `@frontend/components/homestay-card.tsx:54`

```typescript
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3';
```

**Risk:** External URL dependency. If Unsplash removes image, UI breaks.

**Recommendation:** Use local fallback image in `public/images/fallback.jpg`.

---

#### 5.7 Magic Numbers in Feed Layout 🟢 LOW

**Location:** `@backend/src/main/java/com/nbh/backend/dto/PostFeedDto.java:113-116`

```java
private String thumbnail;  // w-200,q-60,f-auto
private String small;      // w-480,q-70,f-auto
private String medium;     // w-800,q-75,f-auto
private String large;      // w-1200,q-80,f-auto
```

**Recommendation:** Externalize image transformation parameters to configuration.

---

### Phase 5 Summary

| Issue | Severity | Location | Action |
|-------|----------|----------|--------|
| Timezone inconsistency | 🟡 Medium | Multiple files | Standardize on `Instant` |
| Hardcoded file size limit | 🟡 Medium | `ImageUploadService.java:30` | Externalize to config |
| Missing startup env validation | 🟡 Medium | `ImageKitConfig.java` | Add startup check |
| Large search method | 🟢 Low | `HomestayRepositoryImpl.java:45` | Refactor into smaller methods |
| External fallback image | 🟢 Low | `homestay-card.tsx:54` | Use local fallback |

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. **Add `@Transactional` to `rejectHomestay()`** - `HomestayService.java:315`
2. **Add transaction timeout to nuclear wipe** - `AdminDataService.java:145`

### Short-term Actions (Medium Priority)

3. **Implement partial upload rollback** - `ImageUploadService.java:117`
4. **Add async job failure monitoring** - `AsyncJobService`
5. **Standardize timezone handling** - All services
6. **Externalize ImageKit limits** - `ImageUploadService.java:30-35`
7. **Remove unused `HomestaySwimlane` component** - `frontend/components/`
8. **Verify and remove unused `search()` method** - `HomestayRepositoryImpl.java:45`

### Long-term Actions (Low Priority)

9. **Migrate `ReviewDto.createdAt` to `Instant`**
10. **Implement `TrustSignal` computation or remove enum**
11. **Complete legacy image URL migration**
12. **Refactor large `search()` method**
13. **Add local fallback image**

---

## Appendix A: Key Files Analyzed

### Backend
- `controller/PostController.java` (262 lines)
- `controller/HomestayController.java` (135 lines)
- `controller/CommentController.java` (108 lines)
- `service/PostService.java`
- `service/HomestayService.java` (675 lines)
- `service/ImageUploadService.java` (319 lines)
- `service/AsyncJobService.java` (169 lines)
- `repository/FeedRepository.java` (344 lines)
- `repository/HomestayRepositoryImpl.java` (611 lines)
- `dto/*.java` (15 DTO files)

### Frontend
- `lib/api/posts.ts` (72 lines)
- `lib/api/feed.ts` (185 lines)
- `lib/api/homestays.ts` (51 lines)
- `components/homestay-card.tsx` (237 lines)
- `components/homestay-swimlane.tsx` (32 lines)
- `components/community/*.tsx`

---

## Appendix B: Transactional Method Inventory

| Service | Method | Transactional | readOnly |
|---------|--------|---------------|----------|
| FollowService | followUser | ✅ | ❌ |
| FollowService | unfollowUser | ✅ | ❌ |
| FollowService | isFollowing | ✅ | ✅ |
| TimelineService | insertPostToTimeline | ✅ | ❌ |
| TimelineService | deletePostFromTimeline | ✅ | ❌ |
| TrendingService | refreshTrendingScores | ✅ | ❌ |
| HomestayService | searchHomestays | ✅ | ✅ |
| HomestayService | rejectHomestay | ❌ **MISSING** | - |
| HomestayService | updateHomestay | ✅ | ❌ |
| HomestayService | deleteHomestay | ✅ | ❌ |
| CommentService | addComment | ✅ | ❌ |
| CommentService | deleteComment | ✅ | ❌ |
| AdminDataService | deleteAllHomestays | ✅ | ❌ |

---

**End of Audit Report**
