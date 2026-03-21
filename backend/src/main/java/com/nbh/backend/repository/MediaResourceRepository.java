package com.nbh.backend.repository;

import com.nbh.backend.model.MediaResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.Set;

@Repository
public interface MediaResourceRepository extends JpaRepository<MediaResource, UUID> {

    /**
     * Delete all media resources associated with the given post IDs.
     * Used during batch wipe to explicitly remove media_resources before posts.
     * 
     * @param postIds List of post IDs whose media resources should be deleted
     * @return Number of rows deleted
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM MediaResource m WHERE m.post.id IN :postIds")
    int deleteByPostIdIn(@Param("postIds") List<UUID> postIds);

    /**
     * Delete all media resources associated with comments belonging to the given post IDs.
     * Used during batch wipe - media_resources.comment_id lacks ON DELETE CASCADE.
     * 
     * @param postIds List of post IDs whose comment media resources should be deleted
     * @return Number of rows deleted
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM media_resources WHERE comment_id IN (SELECT id FROM comments WHERE post_id IN :postIds)", nativeQuery = true)
    int deleteByCommentPostIdIn(@Param("postIds") List<UUID> postIds);

    /**
     * Delete all media resources and return count (for full wipe).
     * Used during deep wipe to clear all media_resources before posts.
     * Named differently to avoid clash with CrudRepository.deleteAll() which returns void.
     *
     * @return Number of rows deleted
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM media_resources", nativeQuery = true)
    int deleteAllAndCount();

    /**
     * Collect all ImageKit fileIds before DB deletion.
     * Safe purge order: collect IDs FIRST, then delete DB records, then delete from ImageKit.
     * Null file_id values are excluded (URL-only resources).
     *
     * @return List of non-null file_id strings
     */
    @Query(value = "SELECT file_id FROM media_resources WHERE file_id IS NOT NULL", nativeQuery = true)
    List<String> findAllFileIds();

    @Query(value = "SELECT file_id FROM media_resources WHERE homestay_id IS NOT NULL AND file_id IS NOT NULL", nativeQuery = true)
    List<String> findHomestayFileIds();

    @Query(value = "SELECT file_id FROM media_resources WHERE homestay_id IN :homestayIds AND file_id IS NOT NULL", nativeQuery = true)
    List<String> findFileIdsByHomestayIdIn(@Param("homestayIds") List<UUID> homestayIds);

    @Query("SELECT m.fileId FROM MediaResource m WHERE m.fileId IN :fileIds")
    Set<String> findExistingFileIds(@Param("fileIds") List<String> fileIds);

    /**
     * Delete media_resources linked to homestays (no ON DELETE CASCADE on homestay_id FK).
     * Must be called before homestays are hard-deleted during seeder purge.
     *
     * @return Number of rows deleted
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM media_resources WHERE homestay_id IS NOT NULL", nativeQuery = true)
    int deleteByHomestayIdIsNotNull();

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM media_resources WHERE homestay_id IN :homestayIds", nativeQuery = true)
    int deleteByHomestayIdIn(@Param("homestayIds") List<UUID> homestayIds);
}
