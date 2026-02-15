package com.nbh.backend.repository;

import com.nbh.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByHomestayId(UUID homestayId);
}
