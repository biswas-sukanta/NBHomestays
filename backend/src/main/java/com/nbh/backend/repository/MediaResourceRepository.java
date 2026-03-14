package com.nbh.backend.repository;

import com.nbh.backend.model.MediaResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MediaResourceRepository extends JpaRepository<MediaResource, UUID> {

    /**
     * Delete all media resources associated with the given post IDs.
     * Used during batch wipe to explicitly remove media_resources before posts.
     * 
     * @param postIds List of post IDs whose media resources should be deleted
     * @return Number of rows deleted
     */
    @Modifying
    @Query("DELETE FROM MediaResource m WHERE m.post.id IN :postIds")
    int deleteByPostIdIn(@Param("postIds") List<UUID> postIds);
}
