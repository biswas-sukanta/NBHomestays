package com.nbh.backend.service;

import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.dto.AuthorDto;
import com.nbh.backend.dto.MediaDto;
import com.nbh.backend.dto.DestinationDto;
import com.nbh.backend.dto.SearchCardDto;
import com.nbh.backend.model.Homestay;
import com.nbh.backend.model.MediaResource;
import com.nbh.backend.model.User;
import com.nbh.backend.repository.HomestayRepository;
import com.nbh.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Set;
import java.util.Objects;
import java.util.stream.Collectors;
import java.io.IOException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Caching;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class HomestayService {

        private final HomestayRepository repository;
        private final UserRepository userRepository;
        private final ImageUploadService imageUploadService;
        private final AsyncJobService asyncJobService;
        private final com.nbh.backend.repository.DestinationRepository destinationRepository;
        private final DestinationService destinationService;

        @Value("${homestay.signals.popularInquiryThreshold:5}")
        private long popularInquiryThreshold;

        @Value("${homestay.signals.highDemandViewThreshold:200}")
        private long highDemandViewThreshold;

        private final ConcurrentHashMap<String, LocalDateTime> viewThrottle = new ConcurrentHashMap<>();

        @CacheEvict(value = "homestaysSearch", allEntries = true)
        @org.springframework.transaction.annotation.Transactional
        public HomestayDto.Response createHomestay(HomestayDto.Request request,
                        List<org.springframework.web.multipart.MultipartFile> files, String userEmail) {
                User owner = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

                // ADMIN auto-approve, all others PENDING
                Homestay.Status status = owner.getRole() == User.Role.ROLE_ADMIN
                                ? Homestay.Status.APPROVED
                                : Homestay.Status.PENDING;

                Homestay homestay = Homestay.builder()
                                .id(UUID.randomUUID())
                                .name(request.getName())
                                .description(request.getDescription())
                                .pricePerNight(request.getPricePerNight())
                                .amenities(request.getAmenities())
                                .policies(request.getPolicies())
                                .quickFacts(request.getQuickFacts())
                                .tags(request.getTags())
                                .hostDetails(request.getHostDetails())
                                .mealConfig(request.getMealConfig() != null ? request.getMealConfig()
                                                : new HashMap<>())
                                .meta(request.getMeta() != null ? request.getMeta()
                                                : new HashMap<>())
                                .status(status)
                                .vibeScore(0.0)
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .address(request.getLocationName()) // Using locationName from DTO as address
                                .owner(owner)
                                .viewCount(0L)
                                .inquiryCount(0L)
                                .build();

                if (request.getDestinationId() != null && !request.getDestinationId().isBlank()) {
                        homestay.setDestination(destinationRepository
                                        .findById(UUID.fromString(request.getDestinationId()))
                                        .orElse(null));
                }

                if (request.getMedia() != null) {
                        final com.nbh.backend.model.Homestay finalH = homestay;
                        List<com.nbh.backend.model.MediaResource> entityMedia = request.getMedia().stream()
                                        .map(dto -> com.nbh.backend.model.MediaResource.builder()
                                                        .id(dto.getId())
                                                        .url(dto.getUrl())
                                                        .fileId(dto.getFileId())
                                                        .homestay(finalH)
                                                        .build())
                                        .collect(Collectors.toList());
                        homestay.setMediaFiles(entityMedia);
                }

                if (files != null && !files.isEmpty()) {
                        try {
                                List<com.nbh.backend.model.MediaResource> uploadedResources = imageUploadService
                                                .uploadFiles(files, "homestays/" + homestay.getId());
                                for (com.nbh.backend.model.MediaResource res : uploadedResources) {
                                        res.setHomestay(homestay);
                                }
                                if (homestay.getMediaFiles() == null) {
                                        homestay.setMediaFiles(new ArrayList<>());
                                }
                                homestay.getMediaFiles().addAll(uploadedResources);
                        } catch (IOException e) {
                                throw new RuntimeException("Failed to upload homestay media files", e);
                        }
                }

                Homestay saved = repository.save(homestay);
                asyncJobService.enqueuePostProcessMedia(extractFileIds(request.getMedia()), "homestays/" + saved.getId());
                return mapToResponse(saved);
        }

        @CacheEvict(value = "homestay", key = "#id")
        @org.springframework.transaction.annotation.Transactional
        public void incrementView(UUID id, HttpServletRequest request) {
                if (id == null) {
                        return;
                }

                String clientKey = buildClientThrottleKey(id, request);
                if (clientKey != null) {
                        LocalDateTime now = LocalDateTime.now();
                        LocalDateTime last = viewThrottle.get(clientKey);
                        if (last != null && last.isAfter(now.minusHours(1))) {
                                return;
                        }
                        viewThrottle.put(clientKey, now);
                }

                repository.incrementViewCount(id);
        }

        @Caching(evict = {
                        @CacheEvict(value = "homestay", key = "#id"),
                        @CacheEvict(value = "homestaysSearch", allEntries = true)
        })
        @org.springframework.transaction.annotation.Transactional
        public void incrementInquiry(UUID id) {
                if (id == null) {
                        return;
                }
                repository.incrementInquiryCount(id);
        }

        private String buildClientThrottleKey(UUID homestayId, HttpServletRequest request) {
                if (request == null) {
                        return null;
                }
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isBlank()) {
                        ip = request.getRemoteAddr();
                } else {
                        // First IP in X-Forwarded-For is the client
                        int comma = ip.indexOf(',');
                        if (comma > -1) {
                                ip = ip.substring(0, comma).trim();
                        }
                }
                if (ip == null || ip.isBlank()) {
                        return null;
                }
                return homestayId + "|" + ip;
        }

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        @Cacheable(value = "homestaysSearch", key = "(#query ?: 'null') + '-' + (#tag ?: 'null') + '-' + (#stateSlug ?: 'null') + '-' + (#isFeatured ?: 'null') + '-' + #size + '-' + #page", sync = true)
        public Page<HomestayDto.Response> searchHomestays(String query, String tag, String stateSlug,
                        Boolean isFeatured,
                        Double minLat, Double maxLat, Double minLng, Double maxLng,
                        int size, int page) {
                int safeSize = Math.max(1, Math.min(size, 24));
                int safePage = Math.max(page, 0);
                Pageable pageable = PageRequest.of(safePage, safeSize);

                try {
                        Page<SearchCardDto> homestayPage = repository.searchCards(query, Collections.emptyMap(),
                                        tag, stateSlug,
                                        isFeatured,
                                        minLat, maxLat, minLng, maxLng,
                                        pageable);
                        return homestayPage.map(this::mapSearchCardToResponse);
                } catch (Exception e) {
                        log.error("Homestay search failed. query={}, tag={}, stateSlug={}, isFeatured={}, page={}, size={}",
                                        query, tag, stateSlug, isFeatured, page, size, e);
                        return new PageImpl<>(List.of(), pageable, 0);
                }
        }

        private HomestayDto.Response mapSearchCardToResponse(SearchCardDto card) {
                String firstName = card.getHostFirstName() == null ? "" : card.getHostFirstName();
                String lastName = card.getHostLastName() == null ? "" : card.getHostLastName();
                String hostName = (firstName + " " + lastName).trim();

                List<MediaDto> media = card.getCoverImageUrl() == null || card.getCoverImageUrl().isBlank()
                                ? new ArrayList<>()
                                : List.of(MediaDto.builder().url(card.getCoverImageUrl()).build());

                DestinationDto destination = card.getDestinationId() == null && card.getDestinationSlug() == null
                                ? null
                                : DestinationDto.builder()
                                                .id(card.getDestinationId())
                                                .slug(card.getDestinationSlug())
                                                .name(card.getDestinationName())
                                                .district(card.getDestinationDistrict())
                                                .heroTitle(card.getDestinationHeroTitle())
                                                .description(card.getDestinationDescription())
                                                .localImageName(card.getDestinationLocalImageName())
                                                .stateName(card.getDestinationStateName())
                                                .stateSlug(card.getDestinationStateSlug())
                                                .build();

                Homestay.Status status = Homestay.Status.APPROVED;
                if (card.getStatus() != null && !card.getStatus().isBlank()) {
                        try {
                                status = Homestay.Status.valueOf(card.getStatus());
                        } catch (IllegalArgumentException ignored) {
                        }
                }

                return HomestayDto.Response.builder()
                                .id(card.getId())
                                .name(card.getName())
                                .description(card.getDescription())
                                .pricePerNight(card.getPricePerNight())
                                .latitude(card.getLatitude())
                                .longitude(card.getLongitude())
                                .locationName(card.getLocationName())
                                .amenities(new HashMap<>())
                                .policies(new ArrayList<>())
                                .quickFacts(new HashMap<>())
                                .tags(new ArrayList<>())
                                .hostDetails(new HashMap<>())
                                .media(media)
                                .vibeScore(card.getVibeScore())
                                .avgAtmosphereRating(card.getAvgAtmosphereRating())
                                .avgServiceRating(card.getAvgServiceRating())
                                .avgAccuracyRating(card.getAvgAccuracyRating())
                                .avgValueRating(card.getAvgValueRating())
                                .totalReviews(card.getTotalReviews())
                                .status(status)
                                .host(AuthorDto.builder()
                                                .id(card.getHostId())
                                                .name(hostName)
                                                .role(card.getHostRole() == null ? "ROLE_USER" : card.getHostRole())
                                                .avatarUrl(card.getHostAvatarUrl())
                                                .isVerifiedHost(Boolean.TRUE.equals(card.getHostVerified()))
                                                .build())
                                .ownerId(card.getOwnerId())
                                .featured(Boolean.TRUE.equals(card.getFeatured()))
                                .destination(destination)
                                .mealConfig(new HashMap<>())
                                .editorialLead(null)
                                .nearbyHighlights(null)
                                .bookingHeatScore(null)
                                .trustSignals(card.getTrustSignals())
                                .build();
        }

        public List<HomestayDto.Response> getAllHomestays() {
                return repository.findAll().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        public List<HomestayDto.LookupResponse> getHomestayLookups() {
                return repository.findAll().stream()
                                .map(h -> HomestayDto.LookupResponse.builder()
                                                .id(h.getId())
                                                .name(h.getName())
                                                .locationName(h.getAddress())
                                                .build())
                                .collect(Collectors.toList());
        }

        @Caching(evict = {
                        @CacheEvict(value = "homestay", key = "#id"),
                        @CacheEvict(value = "homestaysSearch", allEntries = true)
        })
        public void approveHomestay(UUID id) {
                Homestay homestay = repository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Homestay not found"));
                homestay.setStatus(Homestay.Status.APPROVED);
                repository.save(homestay);
        }

        @Caching(evict = {
                        @CacheEvict(value = "homestay", key = "#id"),
                        @CacheEvict(value = "homestaysSearch", allEntries = true)
        })
        public void rejectHomestay(UUID id) {
                Homestay homestay = repository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Homestay not found"));
                homestay.setStatus(Homestay.Status.REJECTED);
                repository.save(homestay);
        }

        @Caching(put = { @CachePut(value = "homestay", key = "#id") }, evict = {
                        @CacheEvict(value = "homestaysSearch", allEntries = true) })
        @org.springframework.transaction.annotation.Transactional
        public HomestayDto.Response updateHomestay(UUID id, HomestayDto.Request request,
                        List<org.springframework.web.multipart.MultipartFile> files, String userEmail) {
                Homestay homestay = repository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Homestay not found"));

                // Allow Admin or Owner to update
                if (!homestay.getOwner().getEmail().equals(userEmail)) {
                        User requestor = userRepository.findByEmail(userEmail).orElseThrow();
                        if (requestor.getRole() != User.Role.ROLE_ADMIN) {
                                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
                        }
                }

                if (request.getName() != null)
                        homestay.setName(request.getName());
                if (request.getDescription() != null)
                        homestay.setDescription(request.getDescription());
                if (request.getPricePerNight() != null)
                        homestay.setPricePerNight(request.getPricePerNight());
                if (request.getAmenities() != null)
                        homestay.setAmenities(request.getAmenities());
                if (request.getPolicies() != null)
                        homestay.setPolicies(request.getPolicies());
                if (request.getQuickFacts() != null)
                        homestay.setQuickFacts(request.getQuickFacts());
                if (request.getTags() != null)
                        homestay.setTags(request.getTags());
                if (request.getHostDetails() != null)
                        homestay.setHostDetails(request.getHostDetails());
                if (request.getMealConfig() != null)
                        homestay.setMealConfig(request.getMealConfig());
                if (request.getMeta() != null)
                        homestay.setMeta(request.getMeta());
                if (request.getLocationName() != null)
                        homestay.setAddress(request.getLocationName());

                if (request.getDestinationId() != null) {
                        if (request.getDestinationId().isBlank()) {
                                homestay.setDestination(null);
                        } else {
                                homestay.setDestination(destinationRepository
                                                .findById(UUID.fromString(request.getDestinationId()))
                                                .orElse(null));
                        }
                }

                if (request.getLatitude() != null)
                        homestay.setLatitude(request.getLatitude());
                if (request.getLongitude() != null)
                        homestay.setLongitude(request.getLongitude());

                // --- CLOUD JANITOR V2 DIFF: Purge orphaned Photos ---
                List<com.nbh.backend.model.MediaResource> finalMergedMedia = new ArrayList<>();
                List<String> removedFileIds = new ArrayList<>();
                if (request.getMedia() != null) {
                        List<com.nbh.backend.model.MediaResource> existingMedia = homestay.getMediaFiles();
                        List<MediaDto> retainedMediaDtos = request.getMedia();

                        Set<String> retainedFileIds = retainedMediaDtos.stream()
                                        .map(MediaDto::getFileId)
                                        .filter(Objects::nonNull)
                                        .filter(s -> !s.isBlank())
                                        .collect(Collectors.toSet());

                        if (existingMedia != null) {
                                java.util.Iterator<com.nbh.backend.model.MediaResource> it = existingMedia.iterator();
                                while (it.hasNext()) {
                                        com.nbh.backend.model.MediaResource oldResource = it.next();
                                        String oldFileId = oldResource.getFileId();
                                        if (oldFileId != null && !retainedFileIds.contains(oldFileId)) {
                                                removedFileIds.add(oldFileId);
                                                it.remove();
                                        }
                                }

                                for (com.nbh.backend.model.MediaResource kept : existingMedia) {
                                        if (kept.getFileId() != null) {
                                                finalMergedMedia.add(kept);
                                        }
                                }
                        }
                } else {
                        if (homestay.getMediaFiles() != null) {
                                finalMergedMedia.addAll(homestay.getMediaFiles());
                        }
                }

                // --- Upload NEW files if any ---
                final com.nbh.backend.model.Homestay finalH = homestay;
                if (files != null && !files.isEmpty()) {
                        try {
                                List<com.nbh.backend.model.MediaResource> uploadedResources = imageUploadService
                                                .uploadFiles(files, "homestays/" + homestay.getId());
                                for (com.nbh.backend.model.MediaResource res : uploadedResources) {
                                        res.setHomestay(finalH);
                                        finalMergedMedia.add(res);
                                }
                        } catch (IOException e) {
                                throw new RuntimeException("Failed to upload new homestay media files", e);
                        }
                }

                if (homestay.getMediaFiles() == null) {
                        homestay.setMediaFiles(new ArrayList<>());
                }
                homestay.getMediaFiles().clear();
                homestay.getMediaFiles().addAll(finalMergedMedia);

                Homestay saved = repository.save(homestay);
                asyncJobService.enqueueDeleteMedia(removedFileIds);
                asyncJobService.enqueuePostProcessMedia(extractFileIds(request.getMedia()), "homestays/" + saved.getId());
                return mapToResponse(saved);
        }

        @Caching(evict = {
                        @CacheEvict(value = "homestay", key = "#id"),
                        @CacheEvict(value = "homestaysSearch", allEntries = true)
        })
        @org.springframework.transaction.annotation.Transactional
        public void deleteHomestay(UUID id, String userEmail) {
                Homestay homestay = repository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Homestay not found"));

                if (!homestay.getOwner().getEmail().equals(userEmail)) {
                        User requestor = userRepository.findByEmail(userEmail).orElseThrow();
                        if (requestor.getRole() != User.Role.ROLE_ADMIN) {
                                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
                        }
                }

                // --- CLOUD JANITOR: Purge Photos before deletion ---
                asyncJobService.enqueueDeleteMedia(homestay.getMediaFiles() == null ? List.of()
                                : homestay.getMediaFiles().stream().map(MediaResource::getFileId).toList());
                repository.delete(homestay);
        }

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        public Page<HomestayDto.Response> getHomestaysByOwner(String email, Pageable pageable) {
                User owner = userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                Page<Homestay> pageResults = repository.findByOwner(owner, pageable);
                return pageResults.map(this::mapToResponse);
        }

        public org.springframework.data.domain.Page<HomestayDto.Response> getHomestaysByDestinationSlug(String slug,
                        Pageable pageable) {
                return repository.findByDestinationSlug(slug, pageable).map(this::mapToResponse);
        }

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        @Cacheable(value = "homestay", key = "#id", sync = true)
        public HomestayDto.Response getHomestay(UUID id) {
                Homestay homestay = repository.findByIdWithDetails(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Homestay not found"));
                return mapToResponse(homestay);
        }

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        public Page<HomestayDto.Response> getPendingHomestays(Pageable pageable) {
                return repository.findByStatus(Homestay.Status.PENDING, pageable).map(this::mapToResponse);
        }

        public HomestayDto.Response mapToResponse(Homestay homestay) {
                // CRITICAL CACHE RULE: Deep copy collections to prevent Hibernate Proxy leaks
                // AND null crashes
                Map<String, Boolean> amenities = homestay.getAmenities() != null
                                ? new HashMap<>(homestay.getAmenities())
                                : new HashMap<>();
                List<String> policies = homestay.getPolicies() != null
                                ? new ArrayList<>(homestay.getPolicies())
                                : new ArrayList<>();
                Map<String, String> quickFacts = homestay.getQuickFacts() != null
                                ? new HashMap<>(homestay.getQuickFacts())
                                : new HashMap<>();
                Map<String, Object> hostDetails = homestay.getHostDetails() != null
                                ? new HashMap<>(homestay.getHostDetails())
                                : new HashMap<>();

                Map<String, Object> mealConfig = homestay.getMealConfig() != null
                                ? new HashMap<>(homestay.getMealConfig())
                                : new HashMap<>();

                String mealPlanCode = mealConfig.get("defaultMealPlan") != null
                                ? String.valueOf(mealConfig.get("defaultMealPlan"))
                                : null;
                String mealPlanLabel = resolveMealPlanLabel(mealPlanCode);

                List<String> tags = homestay.getTags() != null
                                ? new ArrayList<>(homestay.getTags())
                                : new ArrayList<>();

                Map<String, Object> meta = homestay.getMeta() != null
                                ? new HashMap<>(homestay.getMeta())
                                : new HashMap<>();

                String editorialLead = meta.get("editorialLead") != null ? (String) meta.get("editorialLead") : null;
                Integer bookingHeatScore = meta.get("bookingHeatScore") != null
                                ? ((Number) meta.get("bookingHeatScore")).intValue()
                                : null;

                @SuppressWarnings("unchecked")
                List<String> nearbyHighlights = meta.get("nearbyHighlights") != null
                                ? new ArrayList<>((List<String>) meta.get("nearbyHighlights"))
                                : null;

                List<HomestayDto.TrustSignal> trustSignals = computeTrustSignals(homestay);

                return HomestayDto.Response.builder()
                                .id(homestay.getId())
                                .name(homestay.getName())
                                .description(homestay.getDescription())
                                .pricePerNight(homestay.getPricePerNight())
                                .amenities(amenities)
                                .policies(policies)
                                .quickFacts(quickFacts)
                                .tags(tags)
                                .hostDetails(hostDetails)
                                .media(homestay.getMediaFiles() != null ? homestay.getMediaFiles().stream()
                                                .map(m -> MediaDto.builder().id(m.getId()).url(m.getUrl())
                                                                .fileId(m.getFileId()).build())
                                                .collect(Collectors.toList())
                                                : new ArrayList<>())
                                .vibeScore(homestay.getVibeScore())
                                .avgAtmosphereRating(homestay.getAvgAtmosphereRating())
                                .avgServiceRating(homestay.getAvgServiceRating())
                                .avgAccuracyRating(homestay.getAvgAccuracyRating())
                                .avgValueRating(homestay.getAvgValueRating())
                                .totalReviews(homestay.getTotalReviews())
                                .status(homestay.getStatus())
                                .host(AuthorDto.builder()
                                                .id(homestay.getOwner().getId())
                                                .name((homestay.getOwner().getFirstName() != null
                                                                ? homestay.getOwner().getFirstName()
                                                                : "")
                                                                + (homestay.getOwner().getLastName() != null
                                                                                ? " " + homestay.getOwner()
                                                                                                .getLastName()
                                                                                : ""))
                                                .role(homestay.getOwner().getRole() != null
                                                                ? homestay.getOwner().getRole().name()
                                                                : "ROLE_USER")
                                                .avatarUrl(homestay.getOwner().getAvatarUrl())
                                                .isVerifiedHost(homestay.getOwner().isVerifiedHost())
                                                .build())
                                .latitude(homestay.getLatitude())
                                .longitude(homestay.getLongitude())
                                .locationName(homestay.getAddress())
                                .ownerId(homestay.getOwner().getId())
                                .featured(homestay.getFeatured())
                                .destination(destinationService.mapToDto(homestay.getDestination()))
                                .mealConfig(mealConfig)
                                .mealPlanCode(mealPlanCode)
                                .mealPlanLabel(mealPlanLabel)
                                .editorialLead(editorialLead)
                                .nearbyHighlights(nearbyHighlights)
                                .bookingHeatScore(bookingHeatScore)
                                .trustSignals(trustSignals)
                                .build();
        }

        private List<HomestayDto.TrustSignal> computeTrustSignals(Homestay homestay) {
                if (homestay == null) {
                        return List.of();
                }

                final int maxSignals = 2;

                long viewCount = homestay.getViewCount() == null ? 0L : homestay.getViewCount();
                long inquiryCount = homestay.getInquiryCount() == null ? 0L : homestay.getInquiryCount();
                LocalDateTime createdAt = homestay.getCreatedAt();

                int totalReviews = homestay.getTotalReviews() == null ? 0 : homestay.getTotalReviews();
                double avgOverallRating = 0.0;
                if (homestay.getAvgAtmosphereRating() != null)
                        avgOverallRating += homestay.getAvgAtmosphereRating();
                if (homestay.getAvgServiceRating() != null)
                        avgOverallRating += homestay.getAvgServiceRating();
                if (homestay.getAvgAccuracyRating() != null)
                        avgOverallRating += homestay.getAvgAccuracyRating();
                if (homestay.getAvgValueRating() != null)
                        avgOverallRating += homestay.getAvgValueRating();
                avgOverallRating = avgOverallRating / 4.0;

                boolean isTrustedHost = homestay.getOwner() != null && homestay.getOwner().isVerifiedHost();
                boolean isGuestFavorite = totalReviews >= 10 && avgOverallRating >= 4.7;
                boolean isNewListing = createdAt != null && createdAt.isAfter(LocalDateTime.now().minusDays(14));
                boolean isPopularStay = inquiryCount >= popularInquiryThreshold;
                boolean isHighDemand = viewCount >= highDemandViewThreshold;

                ArrayList<HomestayDto.TrustSignal> signals = new ArrayList<>();

                // Priority order:
                // 1 GUEST_FAVORITE
                // 2 HIGH_DEMAND
                // 3 POPULAR_STAY
                // 4 TRUSTED_HOST
                // 5 NEW_LISTING
                if (isGuestFavorite)
                        signals.add(HomestayDto.TrustSignal.GUEST_FAVORITE);
                if (isHighDemand)
                        signals.add(HomestayDto.TrustSignal.HIGH_DEMAND);
                if (!isHighDemand && isPopularStay)
                        signals.add(HomestayDto.TrustSignal.POPULAR_STAY);
                if (isTrustedHost)
                        signals.add(HomestayDto.TrustSignal.TRUSTED_HOST);
                if (isNewListing)
                        signals.add(HomestayDto.TrustSignal.NEW_LISTING);

                if (signals.size() <= maxSignals) {
                        return signals;
                }
                return signals.subList(0, maxSignals);
        }

        private String resolveMealPlanLabel(String code) {
                if (code == null || code.isBlank() || "none".equalsIgnoreCase(code)) {
                        return null;
                }

                return switch (code) {
                        case "4_all" -> "All meals included";
                        case "2_half" -> "Breakfast + Dinner";
                        case "1_breakfast" -> "Breakfast included";
                        // Legacy/alternate codes already used in UI:
                        case "1_bd" -> "Breakfast included";
                        case "2_bd" -> "Breakfast & Dinner";
                        case "2_ld" -> "Lunch & Dinner";
                        case "3_all" -> "All meals included";
                        default -> code;
                };
        }

        private List<String> extractFileIds(List<MediaDto> media) {
                if (media == null || media.isEmpty()) {
                        return List.of();
                }
                return media.stream()
                                .map(MediaDto::getFileId)
                                .filter(Objects::nonNull)
                                .filter(s -> !s.isBlank())
                                .distinct()
                                .toList();
        }
}
