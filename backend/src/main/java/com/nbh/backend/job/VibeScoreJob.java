package com.nbh.backend.job;

import com.nbh.backend.model.Homestay;
import com.nbh.backend.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class VibeScoreJob {

    private final HomestayRepository homestayRepository;
    private final com.nbh.backend.service.VibeService vibeService;

    @Scheduled(cron = "0 0 * * * *") // Hourly
    @Transactional
    public void calculateVibeScores() {
        log.info("Starting Vibe Score calculation job...");
        List<Homestay> homestays = homestayRepository.findAll();

        for (Homestay homestay : homestays) {
            vibeService.calculateAndSave(homestay);
        }

        log.info("Completed Vibe Score calculation for {} homestays.", homestays.size());
    }
}
