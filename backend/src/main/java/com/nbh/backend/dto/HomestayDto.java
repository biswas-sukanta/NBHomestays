package com.nbh.backend.dto;

import com.nbh.backend.model.Homestay;
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
        private String name;
        private String description;
        private Integer pricePerNight;
        private Double latitude;
        private Double longitude;
        private String locationName;
        private java.util.Map<String, Boolean> amenities;
        private java.util.List<String> photoUrls;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Response {
        private UUID id;
        private String name;
        private String description;
        private Integer pricePerNight;
        private Double latitude;
        private Double longitude;
        private String locationName;
        private java.util.Map<String, Boolean> amenities;
        private java.util.List<String> photoUrls;
        private Double vibeScore;
        private Homestay.Status status;
        private UUID ownerId;
        private String ownerEmail;
    }
}
