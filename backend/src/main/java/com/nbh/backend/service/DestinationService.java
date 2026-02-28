package com.nbh.backend.service;

import com.nbh.backend.dto.DestinationDto;
import com.nbh.backend.model.Destination;
import com.nbh.backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

    @Transactional(readOnly = true)
    public List<DestinationDto> getAllDestinations() {
        return destinationRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DestinationDto getBySlug(String slug) {
        return destinationRepository.findBySlug(slug)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Destination not found"));
    }

    public DestinationDto mapToDto(Destination destination) {
        if (destination == null)
            return null;
        return DestinationDto.builder()
                .id(destination.getId())
                .slug(destination.getSlug())
                .name(destination.getName())
                .district(destination.getDistrict())
                .heroTitle(destination.getHeroTitle())
                .description(destination.getDescription())
                .localImageName(destination.getLocalImageName())
                .tags(destination.getTags())
                .build();
    }
}
