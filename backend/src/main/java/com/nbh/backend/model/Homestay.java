package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;

@Entity
@Table(name = "homestays")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.hibernate.annotations.SQLDelete(sql = "UPDATE homestays SET is_deleted = true WHERE id=?")
@org.hibernate.annotations.SQLRestriction("is_deleted = false")
public class Homestay {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @NotFound(action = NotFoundAction.IGNORE)
    private User owner;

    @Column(nullable = false)
    private Integer pricePerNight;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "inquiry_count", nullable = false)
    @Builder.Default
    private Long inquiryCount = 0L;

    @Column(columnDefinition = "DOUBLE PRECISION")
    private Double latitude;

    @Column(columnDefinition = "DOUBLE PRECISION")
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String address;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Boolean> amenities;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> policies;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> quickFacts;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> tags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> hostDetails;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<MediaResource> mediaFiles = new ArrayList<>();

    @Builder.Default
    private Double vibeScore = 0.0;

    // Aggregate Ratings Cache
    private Double avgAtmosphereRating;
    private Double avgServiceRating;
    private Double avgAccuracyRating;
    private Double avgValueRating;
    private Integer totalReviews;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<com.nbh.backend.model.Review> reviews;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<Post> posts;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<HomestayQuestion> questions;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Builder.Default
    @Column(nullable = false)
    private Boolean featured = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> mealConfig = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, Object>> spaces = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, Object>> videos = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<Map<String, Object>> attractions = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> offers = new HashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> meta = new HashMap<>();

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private Destination destination;

    public enum Status {
        PENDING, APPROVED, REJECTED
    }
}
