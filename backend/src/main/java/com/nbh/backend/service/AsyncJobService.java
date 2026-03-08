package com.nbh.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nbh.backend.dto.AsyncJobPayload;
import com.nbh.backend.model.AsyncJob;
import com.nbh.backend.model.AsyncJobStatus;
import com.nbh.backend.model.AsyncJobType;
import com.nbh.backend.repository.AsyncJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncJobService {

    private final AsyncJobRepository asyncJobRepository;
    private final ImageUploadService imageUploadService;
    private final ObjectMapper objectMapper;

    @Value("${jobs.async.max-attempts:5}")
    private int maxAttempts;

    public void enqueueDeleteMedia(List<String> fileIds) {
        List<String> safeFileIds = sanitizeFileIds(fileIds);
        if (safeFileIds.isEmpty()) {
            return;
        }
        enqueue(AsyncJobType.DELETE_MEDIA, AsyncJobPayload.builder().fileIds(safeFileIds).build());
    }

    public void enqueueCleanupStagingMedia(List<String> fileIds) {
        List<String> safeFileIds = sanitizeFileIds(fileIds);
        if (safeFileIds.isEmpty()) {
            return;
        }
        enqueue(AsyncJobType.CLEANUP_STAGING_MEDIA, AsyncJobPayload.builder().fileIds(safeFileIds).build());
    }

    public void enqueueMoveMediaToFolder(List<String> fileIds, String folder) {
        List<String> safeFileIds = sanitizeFileIds(fileIds);
        if (safeFileIds.isEmpty() || folder == null || folder.isBlank()) {
            return;
        }
        enqueue(AsyncJobType.MOVE_MEDIA_TO_FOLDER, AsyncJobPayload.builder()
                .fileIds(safeFileIds)
                .targetFolder(folder)
                .build());
    }

    public void enqueuePostProcessMedia(List<String> fileIds, String folder) {
        List<String> safeFileIds = sanitizeFileIds(fileIds);
        if (safeFileIds.isEmpty() || folder == null || folder.isBlank()) {
            return;
        }
        enqueue(AsyncJobType.POST_PROCESS_MEDIA, AsyncJobPayload.builder()
                .fileIds(safeFileIds)
                .targetFolder(folder)
                .build());
    }

    @Transactional
    public void enqueue(AsyncJobType jobType, AsyncJobPayload payload) {
        AsyncJob job = AsyncJob.builder()
                .jobType(jobType)
                .payload(objectMapper.valueToTree(payload))
                .status(AsyncJobStatus.PENDING)
                .attempts(0)
                .build();
        asyncJobRepository.save(job);
    }

    @Transactional
    public List<AsyncJob> claimPendingJobs(int limit) {
        List<UUID> claimedIds = asyncJobRepository.claimPendingJobIds(limit, maxAttempts);
        if (claimedIds.isEmpty()) {
            return List.of();
        }
        List<AsyncJob> jobs = asyncJobRepository.findAllById(claimedIds);
        List<AsyncJob> ordered = new ArrayList<>();
        for (UUID id : claimedIds) {
            jobs.stream()
                    .filter(job -> job.getId().equals(id))
                    .findFirst()
                    .ifPresent(ordered::add);
        }
        return ordered;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processJob(UUID jobId) {
        AsyncJob job = asyncJobRepository.findById(jobId).orElse(null);
        if (job == null || job.getStatus() != AsyncJobStatus.IN_PROGRESS) {
            return;
        }

        try {
            log.info("[ASYNC_MEDIA] Processing {} job id={} attempt={}", job.getJobType(), job.getId(), job.getAttempts());
            AsyncJobPayload payload = objectMapper.treeToValue(job.getPayload(), AsyncJobPayload.class);
            runJob(job.getJobType(), payload);
            job.setStatus(AsyncJobStatus.DONE);
            job.setLastError(null);
            asyncJobRepository.save(job);
        } catch (Exception e) {
            int nextAttempts = (job.getAttempts() == null ? 0 : job.getAttempts()) + 1;
            job.setAttempts(nextAttempts);
            job.setLastError(truncateError(e.getMessage()));
            job.setStatus(nextAttempts >= maxAttempts ? AsyncJobStatus.FAILED : AsyncJobStatus.PENDING);
            asyncJobRepository.save(job);
            log.error("[ASYNC_MEDIA] Async job {} failed on attempt {}/{}", job.getId(), nextAttempts, maxAttempts, e);
        }
    }

    private void runJob(AsyncJobType jobType, AsyncJobPayload payload) {
        List<String> fileIds = sanitizeFileIds(payload.getFileIds());
        if (fileIds.isEmpty()) {
            return;
        }

        // Safety guard: even if upstream sends a bad payload, never crash the worker.
        // sanitizeFileIds already removed null/blank, but keep this guard defensive.
        if (fileIds.stream().anyMatch(id -> id == null || id.isBlank())) {
            log.warn("[ASYNC_MEDIA] Job contains null/blank fileId(s); skipping invalid entries. type={}", jobType);
            fileIds = fileIds.stream().filter(id -> id != null && !id.isBlank()).toList();
            if (fileIds.isEmpty()) {
                return;
            }
        }

        switch (jobType) {
            case DELETE_MEDIA -> fileIds.forEach(imageUploadService::deleteFileById);
            case CLEANUP_STAGING_MEDIA -> fileIds.forEach(imageUploadService::deleteFileById);
            case MOVE_MEDIA_TO_FOLDER, POST_PROCESS_MEDIA -> {
                if (payload.getTargetFolder() == null || payload.getTargetFolder().isBlank()) {
                    return;
                }
                fileIds.forEach(fileId -> imageUploadService.moveToFolder(fileId, payload.getTargetFolder()));
            }
        }
    }

    private List<String> sanitizeFileIds(List<String> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return List.of();
        }
        return fileIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .distinct()
                .toList();
    }

    private String truncateError(String error) {
        if (error == null) {
            return "Unknown async job error";
        }
        return error.length() <= 1000 ? error : error.substring(0, 1000);
    }
}
