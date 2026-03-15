package com.nbh.backend.repository;

import com.nbh.backend.model.HelpfulVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HelpfulVoteRepository extends JpaRepository<HelpfulVote, UUID> {
    
    @Query("SELECT COUNT(hv) FROM HelpfulVote hv WHERE hv.postId = :postId")
    int countByPostId(@Param("postId") UUID postId);
    
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);
}
