package com.nbh.backend.repository;

import com.nbh.backend.model.HomestayQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomestayQuestionRepository extends JpaRepository<HomestayQuestion, UUID> {
    List<HomestayQuestion> findByHomestayIdOrderByCreatedAtDesc(UUID homestayId);
}
