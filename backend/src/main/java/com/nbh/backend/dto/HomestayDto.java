package com.nbh.backend.dto;

import com.nbh.backend.model.Homestay;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

public class HomestayDto {

    public enum TrustSignal {
        FAST_REPLY,
        GUEST_FAVORITE,
        POPULAR_STAY,
        NEW_LISTING,
        TRUSTED_HOST,
        HIGH_DEMAND
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SpaceMediaDto {
        private String url;
        private String fileId;
        private String caption;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SpaceDto {
        private String type;
        private String name;
        private String description;
        @Builder.Default
        private List<SpaceMediaDto> media = new ArrayList<>();
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VideoDto {
        private String url;
        private String title;
        private String type;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AttractionDto {
        private String name;
        private String distance;
        private String time;
        private String type;
        private Boolean highlight;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OfferDto {
        private String type;
        private String title;
        private String description;
        private String validity;
        private List<String> tags;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StructuredPoliciesDto {
        private String checkIn;
        private String checkOut;
        private List<String> paymentType;
        private Boolean petsAllowed;
        private String alcoholAllowed;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Request {
        @NotBlank(message = "Name is mandatory")
        @Size(max = 255, message = "Name cannot exceed 255 characters")
        private String name;

        @NotBlank(message = "Description is mandatory")
        @Size(min = 20, max = 2000, message = "Description must be between 20 and 2000 characters")
        private String description;

        @NotNull(message = "Price per night is mandatory")
        @Min(value = 1, message = "Price must be at least ₹1 per night")
        private Integer pricePerNight;

        @NotNull(message = "Latitude is mandatory")
        private Double latitude;

        @NotNull(message = "Longitude is mandatory")
        private Double longitude;

        @NotBlank(message = "Location name is mandatory")
        private String locationName;

        private Map<String, Boolean> amenities;
        private List<String> policies;
        private Map<String, String> quickFacts;
        private List<String> tags;
        private Map<String, Object> hostDetails;
        private Map<String, Object> mealConfig;
        private Map<String, Object> meta;
        private List<MediaDto> media;
        private List<SpaceDto> spaces;
        @Size(max = 5, message = "Maximum 5 videos are allowed")
        private List<VideoDto> videos;
        private List<AttractionDto> attractions;
        private OfferDto offers;
        private StructuredPoliciesDto structuredPolicies;

        @NotBlank(message = "Destination is mandatory")
        private String destinationId;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        private UUID id;
        private String name;
        private String description;
        private Integer pricePerNight;
        private Double latitude;
        private Double longitude;
        private String locationName;
        private Map<String, Boolean> amenities;
        private List<String> policies;
        private Map<String, String> quickFacts;
        private List<String> tags;
        private Map<String, Object> hostDetails;
        private List<MediaDto> media;
        private Double vibeScore;
        private Double avgAtmosphereRating;
        private Double avgServiceRating;
        private Double avgAccuracyRating;
        private Double avgValueRating;
        private Integer totalReviews;
        private AuthorDto host;
        private Homestay.Status status;
        private UUID ownerId;
        private Boolean featured;
        private DestinationDto destination;
        private Map<String, Object> mealConfig;
        private List<SpaceDto> spaces;
        private List<VideoDto> videos;
        private List<AttractionDto> attractions;
        private OfferDto offers;
        private StructuredPoliciesDto structuredPolicies;

        private String mealPlanCode;
        private String mealPlanLabel;

        // Editorial & Premium UX Fields
        private String editorialLead;
        private List<String> nearbyHighlights;
        private Integer bookingHeatScore;

        private List<TrustSignal> trustSignals;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LookupResponse {
        private UUID id;
        private String name;
        private String locationName;
    }
}
