package com.nbh.backend.service;

import com.nbh.backend.dto.DestinationCardDto;
import com.nbh.backend.dto.DestinationDto;
import com.nbh.backend.model.Destination;
import com.nbh.backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

    @Cacheable("destinations")
    @Transactional(readOnly = true)
    public List<DestinationCardDto> getAllDestinations() {
        return destinationRepository.fetchDestinationRankings();
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
        return destinationRepository.fetchDestinationRankingsByStateSlug(stateSlug);
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
                .tags(destination.getTags());

        // Safely populate state fields if the relationship is loaded
        if (destination.getState() != null) {
            builder.stateName(destination.getState().getName())
                    .stateSlug(destination.getState().getSlug());
        }

        return builder.build();
    }
}
