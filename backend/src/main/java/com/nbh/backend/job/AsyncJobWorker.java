package com.nbh.backend.job;

import com.nbh.backend.model.AsyncJob;
import com.nbh.backend.service.AsyncJobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AsyncJobWorker {

    private final AsyncJobService asyncJobService;

    @Value("${jobs.async.batch-size:20}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${jobs.async.poll-delay-ms:1000}")
    public void pollAndProcess() {
        List<AsyncJob> jobs = asyncJobService.claimPendingJobs(batchSize);
        if (jobs.isEmpty()) {
            return;
        }

        log.info("[ASYNC_MEDIA] Claimed {} job(s)", jobs.size());

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<Void>> futures = jobs.stream()
                    .map(job -> CompletableFuture.runAsync(() -> asyncJobService.processJob(job.getId()), executor))
                    .toList();
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        } catch (Exception e) {
            log.error("[ASYNC_MEDIA] Async job worker batch execution failed", e);
        }
    }
}
