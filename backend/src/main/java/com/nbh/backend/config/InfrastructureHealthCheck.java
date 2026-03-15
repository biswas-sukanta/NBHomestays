package com.nbh.backend.config;

import com.nbh.backend.service.InfrastructureDetailsService;
import com.nbh.backend.service.TimelineService;
import com.nbh.backend.service.TrendingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class InfrastructureHealthCheck implements CommandLineRunner {

    private final InfrastructureDetailsService detailsService;
    private final TimelineService timelineService;
    private final TrendingService trendingService;

    @Override
    public void run(String... args) {
        log.info("Starting infrastructure connectivity check...");

        // 0. Database
        Map<String, Object> db = detailsService.checkDatabase();
        if ("UP".equals(db.get("status"))) {
            log.info("Database probe: UP - acquireMs={}, select1RoundTripMs={}, estimatedNetworkMs={}, mode={}",
                    db.get("connectionAcquireMs"),
                    db.get("select1RoundTripMs"),
                    db.get("estimatedNetworkMs"),
                    db.get("connectionMode"));
        } else {
            log.error("Database probe: DOWN - {}", db.get("error"));
        }

        // 1. Redis
        Map<String, Object> redis = detailsService.checkRedis();
        if ("UP".equals(redis.get("status"))) {
            log.info("Redis integration: UP - {}", redis.get("message"));
        } else {
            log.error("Redis integration: DOWN - {}", redis.get("error"));
        }

        // 2. ImageKit
        Map<String, Object> imageKit = detailsService.checkImageKit();
        if ("UP".equals(imageKit.get("status"))) {
            log.info("ImageKit integration: UP - endpoint={}", imageKit.get("endpoint"));
        } else {
            log.error("ImageKit integration: DOWN - {}", imageKit.get("error"));
        }

        // 3. Trending scores - compute on startup to ensure feed ordering
        log.info("Computing trending scores for feed ranking...");
        try {
            trendingService.refreshTrendingScores();
            log.info("Trending scores computed successfully.");
        } catch (Exception e) {
            log.warn("Failed to compute trending scores on startup: {}", e.getMessage());
        }

        // 4. Timeline - always check for missing posts and backfill if needed
        long timelineCount = timelineService.getTimelineCount();
        if (timelineCount == 0) {
            log.warn("Timeline table is empty - running backfill to populate feed...");
            int backfilled = timelineService.backfillTimeline();
            log.info("Timeline backfill complete. Backfilled {} posts.", backfilled);
        } else {
            // Check if timeline is missing posts (partial sync)
            int missing = timelineService.backfillMissingPosts();
            if (missing > 0) {
                log.info("Timeline partial sync complete. Added {} missing posts.", missing);
            } else {
                log.debug("Timeline table already populated and in sync.");
            }
        }

        log.info("Infrastructure connectivity check complete.");
    }
}
