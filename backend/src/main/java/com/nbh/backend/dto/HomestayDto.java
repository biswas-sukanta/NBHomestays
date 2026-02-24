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
        private String description;

        @NotNull(message = "Price per night is mandatory")
        @Min(value = 0, message = "Price cannot be negative")
        private Integer pricePerNight;

        @NotNull(message = "Latitude is mandatory")
        private Double latitude;

        @NotNull(message = "Longitude is mandatory")
        private Double longitude;

        @NotBlank(message = "Location name is mandatory")
        private String locationName;

        private java.util.Map<String, Boolean> amenities;
        private java.util.List<String> policies;
        private java.util.Map<String, String> quickFacts;
        private java.util.List<String> tags;
        private java.util.Map<String, Object> hostDetails;
        private java.util.List<String> photoUrls;
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
        private java.util.Map<String, Boolean> amenities;
        private java.util.List<String> policies;
        private java.util.Map<String, String> quickFacts;
        private java.util.List<String> tags;
        private java.util.Map<String, Object> hostDetails;
        private java.util.List<String> photoUrls;
        private Double vibeScore;
        private Homestay.Status status;
        private UUID ownerId;
        private String ownerEmail;
    }
}
