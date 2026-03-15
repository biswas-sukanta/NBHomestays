package com.nbh.backend.repository;

import com.nbh.backend.model.MediaUpload;
import com.nbh.backend.model.MediaUploadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MediaUploadRepository extends JpaRepository<MediaUpload, String> {

    List<MediaUpload> findByStatus(MediaUploadStatus status);

    List<MediaUpload> findByFileIdIn(List<String> fileIds);

    @Query("SELECT m FROM MediaUpload m WHERE m.status = :status AND m.createdAt < :threshold")
    List<MediaUpload> findByStatusAndCreatedAtBefore(
            @Param("status") MediaUploadStatus status,
            @Param("threshold") Instant threshold
    );

    @Modifying
    @Query("UPDATE MediaUpload m SET m.status = :status, m.attachedAt = :attachedAt, " +
            "m.attachedEntityType = :entityType, m.attachedEntityId = :entityId " +
            "WHERE m.fileId IN :fileIds")
    int markAsAttached(
            @Param("fileIds") List<String> fileIds,
            @Param("status") MediaUploadStatus status,
            @Param("attachedAt") Instant attachedAt,
            @Param("entityType") String entityType,
            @Param("entityId") String entityId
    );

    @Modifying
    @Query("UPDATE MediaUpload m SET m.status = :status WHERE m.id = :id")
    int updateStatus(@Param("id") String id, @Param("status") MediaUploadStatus status);
}
