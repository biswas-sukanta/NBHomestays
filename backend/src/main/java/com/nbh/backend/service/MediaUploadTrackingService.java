package com.nbh.backend.service;

import com.nbh.backend.model.MediaUpload;
import com.nbh.backend.model.MediaUploadStatus;
import com.nbh.backend.repository.MediaUploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaUploadTrackingService {

    private final MediaUploadRepository mediaUploadRepository;

    /**
     * Record a new media upload as PENDING.
     */
    @Transactional
    public void recordPendingUpload(String fileId, String url) {
        MediaUpload upload = MediaUpload.builder()
                .fileId(fileId)
                .url(url)
                .status(MediaUploadStatus.PENDING)
                .createdAt(Instant.now())
                .build();
        mediaUploadRepository.save(upload);
        log.debug("Recorded pending media upload: fileId={}", fileId);
    }

    /**
     * Mark multiple uploads as ATTACHED to an entity.
     */
    @Transactional
    public void markAsAttached(List<String> fileIds, String entityType, String entityId) {
        if (fileIds == null || fileIds.isEmpty()) {
            return;
        }
        int updated = mediaUploadRepository.markAsAttached(
                fileIds,
                MediaUploadStatus.ATTACHED,
                Instant.now(),
                entityType,
                entityId
        );
        log.debug("Marked {} media uploads as ATTACHED to {} {}", updated, entityType, entityId);
    }

    /**
     * Find orphaned uploads older than the threshold.
     */
    @Transactional(readOnly = true)
    public List<MediaUpload> findOrphanedUploads(Instant olderThan) {
        return mediaUploadRepository.findByStatusAndCreatedAtBefore(MediaUploadStatus.PENDING, olderThan);
    }

    /**
     * Mark an upload as deleted.
     */
    @Transactional
    public void markAsDeleted(String id) {
        mediaUploadRepository.updateStatus(id, MediaUploadStatus.ORPHANED_DELETED);
    }

    /**
     * Delete all tracking records for a list of fileIds.
     */
    @Transactional
    public void deleteByFileIds(List<String> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return;
        }
        List<MediaUpload> uploads = mediaUploadRepository.findByFileIdIn(fileIds);
        mediaUploadRepository.deleteAll(uploads);
    }
}
