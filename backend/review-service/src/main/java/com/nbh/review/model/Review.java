package com.nbh.review.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID homestayId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private Integer rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @ElementCollection
    private List<String> photos; // "Story Mode" photos

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Vibe Metrics
    private Integer wifiSpeed; // Mbps
    private Integer cleanliness; // 1-10
    private Integer viewRating; // 1-10

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
