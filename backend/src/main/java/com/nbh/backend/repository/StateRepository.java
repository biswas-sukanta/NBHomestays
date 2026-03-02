package com.nbh.backend.repository;

import com.nbh.backend.model.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StateRepository extends JpaRepository<State, UUID> {

    Optional<State> findBySlug(String slug);

    @Query("SELECT COUNT(d) FROM Destination d WHERE d.state.id = :stateId")
    long countDestinationsByStateId(@Param("stateId") UUID stateId);

    @Query("SELECT COUNT(h) FROM Homestay h WHERE h.destination.state.id = :stateId AND h.isDeleted = false")
    long countHomestaysByStateId(@Param("stateId") UUID stateId);
}
