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

        // 2. S3
        Map<String, Object> s3 = detailsService.checkS3();
        if ("UP".equals(s3.get("status"))) {
            log.info("✅ Supabase S3 Integration: UP - Bucket: {}, Objects: {}", s3.get("bucket"),
                    s3.get("object_count"));
        } else if ("SKIPPED".equals(s3.get("status"))) {
            log.warn("⚠️ Supabase S3 Integration: SKIPPED - {}", s3.get("message"));
        } else {
            log.error("❌ Supabase S3 Integration: DOWN - {}", s3.get("error"));
            log.info("💡 Tip: {}", s3.get("tip"));
        }

        log.info("🏁 Infrastructure Connectivity Check Complete.");
    }
}
