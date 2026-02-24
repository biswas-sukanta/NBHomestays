package com.nbh.backend.service;

import com.nbh.backend.dto.HomestayDto;
import com.nbh.backend.model.Homestay;
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
public class HomestayService {

        private final HomestayRepository repository;
        private final UserRepository userRepository;

        @CacheEvict(value = "homestaysSearch", allEntries = true)
        public HomestayDto.Response createHomestay(HomestayDto.Request request, String userEmail) {
                User owner = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));

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
                                .photoUrls(request.getPhotoUrls())
                                .status(status)
                                .vibeScore(0.0)
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .address(request.getLocationName()) // Using locationName from DTO as address
                                .owner(owner)
                                .build();

                Homestay saved = repository.save(homestay);
                return mapToResponse(saved);
        }

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        @Cacheable(value = "homestaysSearch", key = "(#query ?: 'null') + '-' + (#tag ?: 'null') + '-' + (#isFeatured ?: 'null') + '-' + #size + '-' + #page", sync = true)
        public Page<HomestayDto.Response> searchHomestays(String query, String tag, Boolean isFeatured, int size,
                        int page) {
                Pageable pageable = PageRequest.of(page, size);

                // If query is empty and tag is empty and isFeatured is null, return all
                // APPROVED homestays
                if ((query == null || query.trim().isEmpty()) && (tag == null || tag.trim().isEmpty())
                                && isFeatured == null) {
                        List<HomestayDto.Response> allApproved = repository.findByStatus(Homestay.Status.APPROVED)
                                        .stream()
                                        .map(this::mapToResponse)
                                        .collect(Collectors.toList());
                        // Simple manual pagination for the fallback list
                        int start = (int) pageable.getOffset();
                        int end = Math.min((start + pageable.getPageSize()), allApproved.size());
                        List<HomestayDto.Response> pagedList = start > allApproved.size() ? List.of()
                                        : allApproved.subList(start, end);
                        return new PageImpl<>(pagedList, pageable, allApproved.size());
                }

                // Otherwise perform search
                try {
                        Page<Homestay> homestayPage = repository.search(query, new java.util.HashMap<String, Boolean>(),
                                        tag,
                                        isFeatured, pageable);
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
        public HomestayDto.Response updateHomestay(java.util.UUID id, HomestayDto.Request request, String userEmail) {
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
                if (request.getPhotoUrls() != null)
                        homestay.setPhotoUrls(request.getPhotoUrls());
                if (request.getLocationName() != null)
                        homestay.setAddress(request.getLocationName());

                if (request.getLatitude() != null)
                        homestay.setLatitude(request.getLatitude());
                if (request.getLongitude() != null)
                        homestay.setLongitude(request.getLongitude());

                Homestay saved = repository.save(homestay);
                return mapToResponse(saved);
        }

        @Caching(evict = {
                        @CacheEvict(value = "homestay", key = "#id"),
                        @CacheEvict(value = "homestaysSearch", allEntries = true)
        })
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

                repository.delete(homestay);
        }

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        public List<HomestayDto.Response> getHomestaysByOwner(String email) {
                User owner = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                return repository.findByOwner(owner).stream()
                                .map(this::mapToResponse)
                                .toList();
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
        public List<HomestayDto.Response> getPendingHomestays() {
                return repository.findByStatus(Homestay.Status.PENDING).stream()
                                .map(this::mapToResponse)
                                .toList();
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
                java.util.List<String> photoUrls = homestay.getPhotoUrls() != null
                                ? new java.util.ArrayList<>(homestay.getPhotoUrls())
                                : new java.util.ArrayList<>();

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
                                .photoUrls(photoUrls)
                                .vibeScore(homestay.getVibeScore())
                                .status(homestay.getStatus())
                                .latitude(homestay.getLatitude())
                                .longitude(homestay.getLongitude())
                                .locationName(homestay.getAddress())
                                .ownerId(homestay.getOwner().getId())
                                .ownerEmail(homestay.getOwner().getEmail())
                                .featured(homestay.getFeatured())
                                .build();
        }
}
