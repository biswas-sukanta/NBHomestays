package com.nbh.backend.repository;

import com.nbh.backend.model.AsyncJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AsyncJobRepository extends JpaRepository<AsyncJob, UUID>, AsyncJobRepositoryCustom {
}
