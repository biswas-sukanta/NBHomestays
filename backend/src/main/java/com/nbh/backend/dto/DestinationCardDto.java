package com.nbh.backend.dto;

import java.util.UUID;

public record DestinationCardDto(
        UUID id,
        String slug,
        String name,
        Long homestayCount,
        String localImageName,
        String stateName,
        String stateSlug
) {
}
