package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationDto {
    private UUID id;
    private String slug;
    private String name;
    private String district;
    private String heroTitle;
    private String description;
    private String localImageName;
    private List<String> tags;
}
