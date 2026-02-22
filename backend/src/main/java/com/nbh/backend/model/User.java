package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

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

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<Homestay> homestays;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<Post> posts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<com.nbh.backend.model.Comment> comments;

    // PostLike uses raw UUID fields (not @ManyToOne), so @OneToMany mappedBy is
    // incompatible.
    // Likes are managed via LikeService + PostLikeRepository directly.

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<com.nbh.backend.model.Review> reviews;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<HomestayQuestion> questions;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<HomestayAnswer> answers;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
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
}
