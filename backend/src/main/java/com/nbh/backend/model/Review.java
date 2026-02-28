package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reviews")
@org.hibernate.annotations.SQLDelete(sql = "UPDATE reviews SET is_deleted = true WHERE id=?")
@org.hibernate.annotations.SQLRestriction("is_deleted = false")
public class Review {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homestay_id", nullable = false)
    private Homestay homestay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer rating; // Overall 1-5

    // Categorical Ratings
    private Integer atmosphereRating;
    private Integer serviceRating;
    private Integer accuracyRating;
    private Integer valueRating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @ElementCollection
    @CollectionTable(name = "review_photos", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "photo_url")
    private java.util.List<String> photoUrls;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
