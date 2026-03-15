package com.nbh.backend.job;

import com.nbh.backend.model.MediaUpload;
import com.nbh.backend.service.ImageUploadService;
import com.nbh.backend.service.MediaUploadTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled job that cleans up orphaned media files.
 * Runs every 6 hours to delete files that were uploaded but never attached to any entity.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrphanedMediaCleanupJob {

    private final MediaUploadTrackingService trackingService;
    private final ImageUploadService imageUploadService;

    /**
     * Run every 6 hours: delete orphaned files older than 6 hours.
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 */6 * * *")
    public void cleanupOrphanedMedia() {
        log.info("[ORPHAN CLEANUP] Starting orphaned media cleanup job...");

        // Find uploads that are still PENDING and older than 6 hours
        Instant threshold = Instant.now().minus(6, ChronoUnit.HOURS);
        List<MediaUpload> orphanedUploads = trackingService.findOrphanedUploads(threshold);

        if (orphanedUploads.isEmpty()) {
            log.info("[ORPHAN CLEANUP] No orphaned uploads found older than 6 hours");
            return;
        }

        log.info("[ORPHAN CLEANUP] Found {} orphaned uploads to process", orphanedUploads.size());

        int deleted = 0;
        int failed = 0;

        for (MediaUpload upload : orphanedUploads) {
            try {
                // Delete from ImageKit
                imageUploadService.deleteFileById(upload.getFileId());
                // Mark as deleted in tracking table
                trackingService.markAsDeleted(upload.getId());
                deleted++;
                log.debug("[ORPHAN CLEANUP] Deleted orphaned file: fileId={}", upload.getFileId());
            } catch (Exception e) {
                failed++;
                log.warn("[ORPHAN CLEANUP] Failed to delete orphaned file fileId={}: {}",
                        upload.getFileId(), e.getMessage());
            }
        }

        log.info("[ORPHAN CLEANUP] Completed. Deleted: {}, Failed: {}", deleted, failed);
    }
}
