package com.nbh.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_follows")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = {"followerUserId", "followedUserId"})
@IdClass(UserFollow.UserFollowPk.class)
public class UserFollow {

    @Id
    @Column(name = "follower_user_id", nullable = false)
    private UUID followerUserId;

    @Id
    @Column(name = "followed_user_id", nullable = false)
    private UUID followedUserId;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now(java.time.ZoneOffset.UTC);

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserFollowPk implements Serializable {
        private UUID followerUserId;
        private UUID followedUserId;
    }
}

