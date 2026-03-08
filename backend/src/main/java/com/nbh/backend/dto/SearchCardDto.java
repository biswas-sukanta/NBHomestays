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
public class SearchCardDto {
    private UUID id;
    private String name;
    private String description;
    private Integer pricePerNight;
    private Double latitude;
    private Double longitude;
    private String locationName;
    private Double vibeScore;
    private Double avgAtmosphereRating;
    private Double avgServiceRating;
    private Double avgAccuracyRating;
    private Double avgValueRating;
    private Integer totalReviews;
    private String status;
    private UUID ownerId;
    private Boolean featured;

    private UUID destinationId;
    private String destinationSlug;
    private String destinationName;
    private String destinationDistrict;
    private String destinationHeroTitle;
    private String destinationDescription;
    private String destinationLocalImageName;
    private String destinationStateName;
    private String destinationStateSlug;

    private UUID hostId;
    private String hostFirstName;
    private String hostLastName;
    private String hostRole;
    private String hostAvatarUrl;
    private Boolean hostVerified;

    private String coverImageUrl;
}
