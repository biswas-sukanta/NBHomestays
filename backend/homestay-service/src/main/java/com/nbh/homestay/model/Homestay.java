package com.nbh.homestay.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "homestays")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Homestay {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private String ownerId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String locationName; // e.g., "Darjeeling, Near Mall Road"

    // PostGIS Point (Latitude, Longitude) - mapped as generic Object for now,
    // usually requires Hibernate Spatial or custom binding.
    // For simplicity in this stack, we might use standard columns or native queries
    // if spatial lib is missing.
    // However, user requested PostGIS.
    @Column(columnDefinition = "geometry(Point,4326)")
    private Object locationPoint;

    @Column(nullable = false)
    private BigDecimal pricePerNight;

    @Column(columnDefinition = "jsonb")
    @Type(io.hypersistence.utils.hibernate.type.json.JsonBinaryType.class)
    private Map<String, Object> amenities; // e.g. {"wifi": true, "geyser": true}

    @Column(columnDefinition = "tsvector")
    private String searchVector; // For Full Text Search

    @Enumerated(EnumType.STRING)
    private HomestayStatus status;

    private BigDecimal vibeScore; // 0-10

    @ElementCollection
    private List<String> images;

    public enum HomestayStatus {
        DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
    }
}
