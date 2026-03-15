package com.nbh.backend.repository;

import com.nbh.backend.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    /**
     * Fetch top-level comments for a post (parent IS NULL), newest-first.
     */
    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.parent IS NULL ORDER BY c.createdAt ASC")
    Page<Comment> findTopLevelByPostId(@Param("postId") UUID postId, Pageable pageable);

    /**
     * Delete all comment_images (ElementCollection table) for comments belonging to the given post IDs.
     * The comment_images table is created by @ElementCollection on Comment.legacyImageUrls and lacks ON DELETE CASCADE.
     * 
     * @param postIds List of post IDs whose comment images should be deleted
     * @return Number of rows deleted
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM comment_images WHERE comment_id IN (SELECT id FROM comments WHERE post_id IN :postIds)", nativeQuery = true)
    int deleteCommentImagesByPostIdIn(@Param("postIds") List<UUID> postIds);

    /**
     * Delete all comment_images (for full wipe).
     * The comment_images table is created by @ElementCollection on Comment.legacyImageUrls and lacks ON DELETE CASCADE.
     * 
     * @return Number of rows deleted
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM comment_images", nativeQuery = true)
    int deleteAllCommentImages();
    
    /**
     * Count comments by user that have been marked as helpful.
     * Used for Helper badge eligibility (The Margdarshak badge).
     */
    @Query("SELECT SUM(c.helpfulCount) FROM Comment c WHERE c.user.id = :userId")
    long countHelpfulByUserId(@Param("userId") UUID userId);
}
