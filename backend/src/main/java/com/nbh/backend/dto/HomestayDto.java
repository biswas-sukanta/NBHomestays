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

public class HomestayDto {

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

        private String mealPlanCode;
        private String mealPlanLabel;

        // Editorial & Premium UX Fields
        private String editorialLead;
        private List<String> nearbyHighlights;
        private Integer bookingHeatScore;
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
