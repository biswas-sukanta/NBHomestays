package com.nbh.backend.repository;

import com.nbh.backend.model.SavedItem;
import com.nbh.backend.model.User;
import com.nbh.backend.model.Homestay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedItemRepository extends JpaRepository<SavedItem, UUID> {
    List<SavedItem> findAllByUserOrderByCreatedAtDesc(User user);

    Optional<SavedItem> findByUserAndHomestay(User user, Homestay homestay);

    boolean existsByUserAndHomestay(User user, Homestay homestay);

    void deleteByUserAndHomestay(User user, Homestay homestay);
}
