package com.nbh.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String username;
    private String avatar;
    private String bio;
    private Integer communityPoints;
    private List<String> badges;
    private boolean verifiedHost;
    private long followersCount;
    private long followingCount;
    private long postCount;
    @JsonProperty("isFollowing")
    private boolean isFollowing;
    private List<HomestayDto.Response> homestays;
    private List<PostDto.Response> posts;
}
