package com.nbh.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "destinations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(nullable = false)
    private String name;

    private String district;

    private String heroTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String localImageName;

    @ElementCollection
    @CollectionTable(name = "destination_tags", joinColumns = @JoinColumn(name = "destination_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();
}
