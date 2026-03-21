package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@org.hibernate.annotations.SQLDelete(sql = "UPDATE users SET is_deleted = true WHERE id=?")
@org.hibernate.annotations.SQLRestriction("is_deleted = false")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean isDeleted = false;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean enabled;

    // Additional fields for user profile can be added here
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private boolean isVerifiedHost;

    // ========================================================================
    // Frictionless Profile Fields (V58 Migration)
    // ========================================================================

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "location")
    private String location;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "languages", columnDefinition = "TEXT[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Builder.Default
    private String[] languages = new String[0];

    @Column(name = "interests", columnDefinition = "TEXT[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Builder.Default
    private String[] interests = new String[0];

    @Enumerated(EnumType.STRING)
    @Column(name = "traveller_type")
    private TravellerType travellerType;

    @Column(name = "show_email", nullable = false)
    @Builder.Default
    private boolean showEmail = false;

    @Column(name = "allow_messages", nullable = false)
    @Builder.Default
    private boolean allowMessages = true;

    @Column(name = "marketing_opt_in", nullable = false)
    @Builder.Default
    private boolean marketingOptIn = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.UNVERIFIED;

    @Column(name = "social_links", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private Map<String, String> socialLinks = new HashMap<>();

    // ========================================================================
    // Gamification Fields
    // ========================================================================

    @Builder.Default
    private Integer communityPoints = 0;

    @Builder.Default
    private Integer totalXp = 0;

    // ========================================================================
    // Legacy Badges (deprecated - use userBadges relationship)
    // Kept for backward compatibility during migration
    // ========================================================================

    @ElementCollection
    @CollectionTable(name = "user_badges_legacy", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "badge")
    @Builder.Default
    private List<String> legacyBadges = new ArrayList<>();

    // ========================================================================
    // New Badge Relationship (V58 Migration)
    // ========================================================================

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @Builder.Default
    private List<UserBadge> userBadges = new ArrayList<>();

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<Homestay> homestays;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<Post> posts;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<com.nbh.backend.model.Comment> comments;

    // PostLike uses raw UUID fields (not @ManyToOne), so @OneToMany mappedBy is
    // incompatible.
    // Likes are managed via LikeService + PostLikeRepository directly.

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<com.nbh.backend.model.Review> reviews;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<HomestayQuestion> questions;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<HomestayAnswer> answers;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    public List<String> getLanguages() {
        return languages == null ? new ArrayList<>() : new ArrayList<>(Arrays.asList(languages));
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages == null ? new String[0] : languages.toArray(String[]::new);
    }

    public List<String> getInterests() {
        return interests == null ? new ArrayList<>() : new ArrayList<>(Arrays.asList(interests));
    }

    public void setInterests(List<String> interests) {
        this.interests = interests == null ? new String[0] : interests.toArray(String[]::new);
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    public enum Role {
        ROLE_USER, ROLE_HOST, ROLE_ADMIN
    }

    /**
     * Traveller type classification for profile personalization.
     */
    public enum TravellerType {
        SOLO, COUPLE, FAMILY, GROUP, BUSINESS, DIGITAL_NOMAD, BACKPACKER, LUXURY
    }

    /**
     * Account verification status.
     */
    public enum VerificationStatus {
        UNVERIFIED, PENDING, VERIFIED, SUSPENDED
    }
}
