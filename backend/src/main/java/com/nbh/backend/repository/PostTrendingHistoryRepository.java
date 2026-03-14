package com.nbh.backend.repository;

import com.nbh.backend.model.PostTrendingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostTrendingHistoryRepository extends JpaRepository<PostTrendingHistory, Long> {
}
