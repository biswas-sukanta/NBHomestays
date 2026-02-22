package com.nbh.backend.repository;

import com.nbh.backend.model.TripBoardSave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TripBoardSaveRepository extends JpaRepository<TripBoardSave, TripBoardSave.TripBoardPk> {

    boolean existsByUserIdAndHomestayId(UUID userId, UUID homestayId);

    void deleteByUserIdAndHomestayId(UUID userId, UUID homestayId);

    /** Return all homestay IDs saved by a user (for frontend sync). */
    @Query("SELECT t.homestayId FROM TripBoardSave t WHERE t.userId = :userId ORDER BY t.savedAt DESC")
    List<UUID> findHomestayIdsByUserId(@Param("userId") UUID userId);

    long countByUserId(UUID userId);
}
