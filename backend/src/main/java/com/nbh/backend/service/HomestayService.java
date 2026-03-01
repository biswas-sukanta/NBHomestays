package com.nbh.backend.service;

import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.dto.AuthorDto;
import com.nbh.backend.dto.MediaDto;
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
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Caching;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class HomestayService {

        private final HomestayRepository repository;
        private final UserRepository userRepository;
        private final ImageUploadService imageUploadService;
        private final com.nbh.backend.repository.DestinationRepository destinationRepository;
        private final DestinationService destinationService;

        @CacheEvict(value = "homestaysSearch", allEntries = true)
        @org.springframework.transaction.annotation.Transactional
        public HomestayDto.Response createHomestay(HomestayDto.Request request,
                        java.util.List<org.springframework.web.multipart.MultipartFile> files, String userEmail) {
                User owner = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

                // ADMIN auto-approve, all others PENDING
                Homestay.Status status = owner.getRole() == User.Role.ROLE_ADMIN
                                ? Homestay.Status.APPROVED
                                : Homestay.Status.PENDING;

                Homestay homestay = Homestay.builder()
                                .name(request.getName())
                                .description(request.getDescription())
                                .pricePerNight(request.getPricePerNight())
                                .amenities(request.getAmenities())
                                .policies(request.getPolicies())
                                .quickFacts(request.getQuickFacts())
                                .tags(request.getTags())
                                .hostDetails(request.getHostDetails())
                                .status(status)
                                .vibeScore(0.0)
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .address(request.getLocationName()) // Using locationName from DTO as address
                                .owner(owner)
                                .build();

                if (request.getDestinationId() != null && !request.getDestinationId().isBlank()) {
                        homestay.setDestination(destinationRepository
                                        .findById(java.util.UUID.fromString(request.getDestinationId()))
                                        .orElse(null));
                }

                if (request.getMedia() != null) {
                        final com.nbh.backend.model.Homestay finalH = homestay;
                        java.util.List<com.nbh.backend.model.MediaResource> entityMedia = request.getMedia().stream()
                                        .map(dto -> com.nbh.backend.model.MediaResource.builder()
                                                        .id(dto.getId())
                                                        .url(dto.getUrl())
                                                        .fileId(dto.getFileId())
                                                        .homestay(finalH)
                                                        .build())
                                        .collect(java.util.stream.Collectors.toList());
                        homestay.setMediaFiles(entityMedia);
                }

                return mapToResponse(repository.save(homestay));
        }

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        @Cacheable(value = "homestaysSearch", key = "(#query ?: 'null') + '-' + (#tag ?: 'null') + '-' + (#isFeatured ?: 'null') + '-' + #size + '-' + #page", sync = true)
        public Page<HomestayDto.Response> searchHomestays(String query, String tag, Boolean isFeatured,
                        Double minLat, Double maxLat, Double minLng, Double maxLng,
                        int size, int page) {
                Pageable pageable = PageRequest.of(page, size);

                // If query is empty and tag is empty and isFeatured is null, return all
                // APPROVED homestays
                if ((query == null || query.trim().isEmpty()) && (tag == null || tag.trim().isEmpty())
                                && isFeatured == null) {
                        return repository.findByStatus(Homestay.Status.APPROVED, pageable)
                                        .map(this::mapToResponse);
                }

                // Otherwise perform search
                try {
                        Page<Homestay> homestayPage = repository.search(query, new java.util.HashMap<String, Boolean>(),
                                        tag,
                                        isFeatured,
                                        minLat, maxLat, minLng, maxLng,
                                        pageable);
                        return homestayPage.map(this::mapToResponse);
                } catch (Exception e) {
                        // Fallback: return empty page
                        return new PageImpl<>(List.of(), pageable, 0);
                }
        }

        public List<HomestayDto.Response> getAllHomestays() {
                return repository.findAll().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Caching(evict = {
                        @CacheEvict(value = "homestay", key = "#id"),
                        @CacheEvict(value = "homestaysSearch", allEntries = true)
        })
        public void approveHomestay(java.util.UUID id) {
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
        public void rejectHomestay(java.util.UUID id) {
                Homestay homestay = repository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "Homestay not found"));
                homestay.setStatus(Homestay.Status.REJECTED);
                repository.save(homestay);
        }

        @Caching(put = { @CachePut(value = "homestay", key = "#id") }, evict = {
                        @CacheEvict(value = "homestaysSearch", allEntries = true) })
        @org.springframework.transaction.annotation.Transactional
        public HomestayDto.Response updateHomestay(java.util.UUID id, HomestayDto.Request request,
                        java.util.List<org.springframework.web.multipart.MultipartFile> files, String userEmail) {
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
                if (request.getLocationName() != null)
                        homestay.setAddress(request.getLocationName());

                if (request.getDestinationId() != null) {
                        if (request.getDestinationId().isBlank()) {
                                homestay.setDestination(null);
                        } else {
                                homestay.setDestination(destinationRepository
                                                .findById(java.util.UUID.fromString(request.getDestinationId()))
                                                .orElse(null));
                        }
                }

                if (request.getLatitude() != null)
                        homestay.setLatitude(request.getLatitude());
                if (request.getLongitude() != null)
                        homestay.setLongitude(request.getLongitude());

                // --- CLOUD JANITOR V2 DIFF: Purge orphaned Photos ---
                java.util.List<com.nbh.backend.model.MediaResource> finalMergedMedia = new java.util.ArrayList<>();
                if (request.getMedia() != null) {
                        java.util.List<com.nbh.backend.model.MediaResource> existingMedia = homestay.getMediaFiles();
                        java.util.List<MediaDto> retainedMediaDtos = request.getMedia();

                        if (existingMedia != null) {
                                java.util.Set<String> retainedFileIds = retainedMediaDtos.stream()
                                                .map(MediaDto::getFileId)
                                                .filter(java.util.Objects::nonNull)
                                                .collect(java.util.stream.Collectors.toSet());

                                for (com.nbh.backend.model.MediaResource oldResource : existingMedia) {
                                        if (oldResource.getFileId() != null
                                                        && !retainedFileIds.contains(oldResource.getFileId())) {
                                                log.info("CLOUD JANITOR (HOMESTAY): Deleting File ID: {}",
                                                                oldResource.getFileId());
                                                imageUploadService.deleteFile(oldResource.getFileId());
                                        } else if (oldResource.getFileId() != null) {
                                                finalMergedMedia.add(oldResource);
                                        }
                                }
                        }
                }

                // --- Upload NEW files if any ---
                final com.nbh.backend.model.Homestay finalH = homestay;
                if (files != null && !files.isEmpty()) {
                        try {
                                java.util.List<com.nbh.backend.model.MediaResource> uploadedResources = imageUploadService
                                                .uploadFiles(files);
                                for (com.nbh.backend.model.MediaResource res : uploadedResources) {
                                        res.setHomestay(finalH);
                                        finalMergedMedia.add(res);
                                }
                        } catch (java.io.IOException e) {
                                throw new RuntimeException("Failed to upload new homestay media files", e);
                        }
                }

                if (homestay.getMediaFiles() == null) {
                        homestay.setMediaFiles(new java.util.ArrayList<>());
                }
                homestay.getMediaFiles().clear();
                homestay.getMediaFiles().addAll(finalMergedMedia);

                Homestay saved = repository.save(homestay);
                return mapToResponse(saved);
        }

        @Caching(evict = {
                        @CacheEvict(value = "homestay", key = "#id"),
                        @CacheEvict(value = "homestaysSearch", allEntries = true)
        })
        @org.springframework.transaction.annotation.Transactional
        public void deleteHomestay(java.util.UUID id, String userEmail) {
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
                if (homestay.getMediaFiles() != null) {
                        for (MediaResource media : homestay.getMediaFiles()) {
                                if (media.getFileId() != null) {
                                        imageUploadService.deleteFile(media.getFileId());
                                }
                        }
                }
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
        public HomestayDto.Response getHomestay(java.util.UUID id) {
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
                java.util.Map<String, Boolean> amenities = homestay.getAmenities() != null
                                ? new java.util.HashMap<>(homestay.getAmenities())
                                : new java.util.HashMap<>();
                java.util.List<String> policies = homestay.getPolicies() != null
                                ? new java.util.ArrayList<>(homestay.getPolicies())
                                : new java.util.ArrayList<>();
                java.util.Map<String, String> quickFacts = homestay.getQuickFacts() != null
                                ? new java.util.HashMap<>(homestay.getQuickFacts())
                                : new java.util.HashMap<>();
                java.util.Map<String, Object> hostDetails = homestay.getHostDetails() != null
                                ? new java.util.HashMap<>(homestay.getHostDetails())
                                : new java.util.HashMap<>();

                java.util.List<String> tags = homestay.getTags() != null
                                ? new java.util.ArrayList<>(homestay.getTags())
                                : new java.util.ArrayList<>();

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
                                                .collect(java.util.stream.Collectors.toList())
                                                : new java.util.ArrayList<>())
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
                                .build();
        }
}
