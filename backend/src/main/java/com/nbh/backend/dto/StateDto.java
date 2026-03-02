package com.nbh.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StateDto {
    private UUID id;
    private String slug;
    private String name;
    private String description;
    private String heroImageName;
    private long destinationCount;
    private long homestayCount;
}
