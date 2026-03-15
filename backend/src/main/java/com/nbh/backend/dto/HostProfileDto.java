package com.nbh.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;
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

    // ========================================================================
    // Frictionless Profile Fields (V58 Migration)
    // ========================================================================

    private String displayName;
    private String location;
    private List<String> languages;
    private List<String> interests;
    private String travellerType;
    private Map<String, String> socialLinks;
    private String verificationStatus;

    // ========================================================================
    // Gamification Fields (V58 Migration)
    // ========================================================================

    private Integer totalXp;
    private String currentStageTitle;
    private String currentStageIconUrl;
    private Integer xpToNextStage;

    /**
     * Badges pinned by the user for display on profile.
     */
    private List<BadgeDto> pinnedBadges;

    /**
     * All badges earned by the user.
     */
    private List<BadgeDto> allBadges;
}
