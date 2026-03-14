package com.nbh.backend.job;

import com.nbh.backend.service.TrendingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(value = "application.jobs.trending.enabled", havingValue = "true", matchIfMissing = true)
public class TrendingScoreJob {

    private final TrendingService trendingService;

    @Scheduled(cron = "0 */15 * * * *")
    public void refreshTrending() {
        log.info("Refreshing post trending scores");
        trendingService.refreshTrendingScores();
    }
}
