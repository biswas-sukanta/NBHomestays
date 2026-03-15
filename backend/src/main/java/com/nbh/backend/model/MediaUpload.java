package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Tracks media uploads for orphan detection and cleanup.
 * Status flow: PENDING -> ATTACHED (when post is created) or ORPHANED_DELETED (by cleanup job)
 */
@Entity
@Table(name = "media_uploads", indexes = {
    @Index(name = "idx_media_uploads_status", columnList = "status"),
    @Index(name = "idx_media_uploads_created_at", columnList = "createdAt")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String fileId;

    @Column(nullable = false)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaUploadStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant attachedAt;

    private String attachedEntityType; // "POST", "HOMESTAY", "COMMENT"

    private String attachedEntityId;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
