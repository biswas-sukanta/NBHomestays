package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "trip_board_saves", indexes = @Index(name = "idx_trip_board_user", columnList = "user_id"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = { "userId", "homestayId" })
@IdClass(TripBoardSave.TripBoardPk.class)
public class TripBoardSave {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "homestay_id")
    private UUID homestayId;

    @Column(name = "saved_at", nullable = false)
    @Builder.Default
    private LocalDateTime savedAt = LocalDateTime.now();

    // ── Composite PK ─────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripBoardPk implements Serializable {
        private UUID userId;
        private UUID homestayId;
    }
}
