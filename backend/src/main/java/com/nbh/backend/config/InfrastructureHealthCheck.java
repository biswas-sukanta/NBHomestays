package com.nbh.backend.config;

import com.nbh.backend.service.InfrastructureDetailsService;
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

    @Override
    public void run(String... args) {
        log.info("🚀 Starting Infrastructure Connectivity Check...");

        // 1. Redis
        Map<String, Object> redis = detailsService.checkRedis();
        if ("UP".equals(redis.get("status"))) {
            log.info("✅ Redis Integration: UP - {}", redis.get("message"));
        } else {
            log.error("❌ Redis Integration: DOWN - {}", redis.get("error"));
        }

        // 2. ImageKit
        Map<String, Object> imageKit = detailsService.checkImageKit();
        if ("UP".equals(imageKit.get("status"))) {
            log.info("✅ ImageKit Integration: UP - Endpoint: {}", imageKit.get("endpoint"));
        } else {
            log.error("❌ ImageKit Integration: DOWN - {}", imageKit.get("error"));
        }

        log.info("🏁 Infrastructure Connectivity Check Complete.");
    }
}
