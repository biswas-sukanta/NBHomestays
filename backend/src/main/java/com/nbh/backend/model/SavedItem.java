package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "homestay_id" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@org.hibernate.annotations.SQLDelete(sql = "UPDATE saved_items SET is_deleted = true WHERE id=?")
@org.hibernate.annotations.SQLRestriction("is_deleted = false")
public class SavedItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homestay_id", nullable = false)
    private Homestay homestay;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
