package com.nbh.backend.repository;

import com.nbh.backend.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    /**
     * Fetch top-level comments for a post (parent IS NULL), newest-first.
     */
    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.parent IS NULL ORDER BY c.createdAt ASC")
    Page<Comment> findTopLevelByPostId(@Param("postId") UUID postId, Pageable pageable);

    /**
     * Count comments by user that have been marked as helpful.
     * Used for Helper badge eligibility (The Margdarshak badge).
     */
    @Query("SELECT SUM(c.helpfulCount) FROM Comment c WHERE c.user.id = :userId")
    long countHelpfulByUserId(@Param("userId") UUID userId);

}
