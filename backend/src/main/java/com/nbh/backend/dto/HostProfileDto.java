package com.nbh.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class HostProfileDto {
    private UUID id;
    private String firstName;
    private String lastName;
    private String bio;
    private Integer communityPoints;
    private List<String> badges;
    private List<HomestayDto.Response> homestays;
    private List<PostDto.Response> posts;
}
