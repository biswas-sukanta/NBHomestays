package com.nbh.backend.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
public class DestinationDto {
    private UUID id;
    private String slug;
    private String name;
    private Long homestayCount;
    private String district;
    private String heroTitle;
    private String description;
    private String localImageName;
    private List<String> tags;
    private String stateName;
    private String stateSlug;

    public DestinationDto(UUID id,
                          String slug,
                          String name,
                          Long homestayCount,
                          String district,
                          String heroTitle,
                          String description,
                          String localImageName,
                          List<String> tags,
                          String stateName,
                          String stateSlug) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.homestayCount = homestayCount;
        this.district = district;
        this.heroTitle = heroTitle;
        this.description = description;
        this.localImageName = localImageName;
        this.tags = tags;
        this.stateName = stateName;
        this.stateSlug = stateSlug;
    }
}
