package com.nbh.auth.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    private String name;

    private String provider; // google, facebook
    
    private String providerId;

    @Enumerated(EnumType.STRING)
    private Role role; // USER, ADMIN, OWNER

    public enum Role {
        USER, ADMIN, OWNER
    }
}
