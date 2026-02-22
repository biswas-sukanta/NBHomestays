package com.nbh.backend.repository;

import com.nbh.backend.model.HomestayAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HomestayAnswerRepository extends JpaRepository<HomestayAnswer, UUID> {
}
