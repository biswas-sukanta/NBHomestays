package com.nbh.backend.service;

import com.nbh.backend.dto.StateDto;
import com.nbh.backend.model.State;
import com.nbh.backend.repository.StateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StateService {

    private final StateRepository stateRepository;

    @Cacheable("states")
    @Transactional(readOnly = true)
    public List<StateDto> getAllStates() {
        return stateRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "state-by-slug", key = "#slug")
    @Transactional(readOnly = true)
    public StateDto getBySlug(String slug) {
        return stateRepository.findBySlug(slug)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("State not found: " + slug));
    }

    private StateDto mapToDto(State state) {
        return StateDto.builder()
                .id(state.getId())
                .slug(state.getSlug())
                .name(state.getName())
                .description(state.getDescription())
                .heroImageName(state.getHeroImageName())
                .destinationCount(stateRepository.countDestinationsByStateId(state.getId()))
                .homestayCount(stateRepository.countHomestaysByStateId(state.getId()))
                .build();
    }
}
