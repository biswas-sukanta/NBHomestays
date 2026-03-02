package com.nbh.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "states")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class State {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 100, unique = true, nullable = false)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "hero_image_name")
    private String heroImageName;

    @OneToMany(mappedBy = "state", fetch = FetchType.LAZY)
    @JsonIgnore
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    @Builder.Default
    private List<Destination> destinations = new ArrayList<>();
}
