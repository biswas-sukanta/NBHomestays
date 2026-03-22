package com.nbh.backend.service;

import com.nbh.backend.dto.DestinationCardDto;
import com.nbh.backend.dto.DestinationDto;
import com.nbh.backend.model.Destination;
import com.nbh.backend.repository.DestinationRepository;
import com.nbh.backend.repository.projection.DestinationCardProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

    @Cacheable("destinations")
    @Transactional(readOnly = true)
    public List<DestinationCardDto> getAllDestinations() {
        // Use optimized projection query - single query, no N+1
        return destinationRepository.fetchDestinationCardProjections().stream()
                .map(this::mapProjectionToCardDto)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "destination-by-slug", key = "#slug")
    @Transactional(readOnly = true)
    public DestinationDto getBySlug(String slug) {
        return destinationRepository.findBySlug(slug)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Destination not found"));
    }

    @Cacheable(value = "destinations-by-state", key = "#stateSlug")
    @Transactional(readOnly = true)
    public List<DestinationCardDto> getDestinationsByStateSlug(String stateSlug) {
        // Use optimized projection query - single query, no N+1
        return destinationRepository.fetchDestinationCardProjectionsByStateSlug(stateSlug).stream()
                .map(this::mapProjectionToCardDto)
                .collect(Collectors.toList());
    }

    /**
     * Map projection to card DTO - no additional queries needed.
     */
    private DestinationCardDto mapProjectionToCardDto(DestinationCardProjection projection) {
        return new DestinationCardDto(
                projection.getId(),
                projection.getSlug(),
                projection.getName(),
                projection.getHomestayCount(),
                projection.getLocalImageName(),
                projection.getStateName(),
                projection.getStateSlug(),
                projection.getTags()
        );
    }

    private DestinationCardDto mapToCardDto(Destination destination) {
        Long homestayCount = destinationRepository.countHomestaysByDestinationSlug(destination.getSlug());
        String stateName = destination.getState() != null ? destination.getState().getName() : null;
        String stateSlug = destination.getState() != null ? destination.getState().getSlug() : null;

        return new DestinationCardDto(
                destination.getId(),
                destination.getSlug(),
                destination.getName(),
                homestayCount,
                destination.getLocalImageName(),
                stateName,
                stateSlug,
                destination.getTags() != null ? new ArrayList<>(destination.getTags()) : List.of()
        );
    }

    public DestinationDto mapToDto(Destination destination) {
        if (destination == null)
            return null;
        Long homestayCount = destinationRepository.countHomestaysByDestinationSlug(destination.getSlug());
        DestinationDto.DestinationDtoBuilder builder = DestinationDto.builder()
                .id(destination.getId())
                .slug(destination.getSlug())
                .name(destination.getName())
                .homestayCount(homestayCount)
                .district(destination.getDistrict())
                .heroTitle(destination.getHeroTitle())
                .description(destination.getDescription())
                .localImageName(destination.getLocalImageName())
                .tags(destination.getTags() != null ? new ArrayList<>(destination.getTags()) : List.of());

        // Safely populate state fields if the relationship is loaded
        if (destination.getState() != null) {
            builder.stateName(destination.getState().getName())
                    .stateSlug(destination.getState().getSlug());
        }

        return builder.build();
    }
}
