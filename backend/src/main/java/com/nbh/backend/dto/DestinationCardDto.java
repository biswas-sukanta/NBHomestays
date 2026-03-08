package com.nbh.backend.dto;

import java.util.List;
import java.util.UUID;

public record DestinationCardDto(
        UUID id,
        String slug,
        String name,
        Long homestayCount,
        String localImageName,
        String stateName,
        String stateSlug,
        List<String> tags
) {
}
