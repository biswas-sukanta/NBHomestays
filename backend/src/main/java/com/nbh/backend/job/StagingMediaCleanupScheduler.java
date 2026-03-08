package com.nbh.backend.job;

import com.nbh.backend.service.AsyncJobService;
import com.nbh.backend.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StagingMediaCleanupScheduler {

    private final ImageUploadService imageUploadService;
    private final AsyncJobService asyncJobService;

    @Value("${media.staging.folder:uploads/staging}")
    private String stagingFolder;

    @Value("${media.staging.cleanup.enabled:true}")
    private boolean cleanupEnabled;

    @Value("${media.staging.cleanup.max-file-ids-per-run:200}")
    private int maxFileIdsPerRun;

    @Scheduled(fixedDelayString = "${media.staging.cleanup.fixed-delay-ms:3600000}")
    public void cleanupStaging() {
        if (!cleanupEnabled) {
            return;
        }

        OffsetDateTime cutoff = OffsetDateTime.now().minusHours(24);
        List<String> oldFileIds;
        try {
            oldFileIds = imageUploadService.listFileIdsOlderThan(stagingFolder, cutoff);
        } catch (Exception e) {
            log.error("[ASYNC_MEDIA] Failed to list staging media for cleanup", e);
            return;
        }

        if (oldFileIds == null || oldFileIds.isEmpty()) {
            return;
        }

        List<String> limited = oldFileIds.size() > maxFileIdsPerRun ? oldFileIds.subList(0, maxFileIdsPerRun) : oldFileIds;
        log.info("[ASYNC_MEDIA] Enqueuing staging cleanup for {} file(s)", limited.size());
        asyncJobService.enqueueCleanupStagingMedia(limited);
    }
}
