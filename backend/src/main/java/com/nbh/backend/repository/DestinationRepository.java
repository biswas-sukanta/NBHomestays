package com.nbh.backend.repository;

import com.nbh.backend.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, UUID> {
    Optional<Destination> findBySlug(String slug);
}
