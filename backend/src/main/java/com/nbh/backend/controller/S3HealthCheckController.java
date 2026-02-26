package com.nbh.backend.controller;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListBucketsResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/health")
@RequiredArgsConstructor
@Slf4j
public class S3HealthCheckController {

    private final S3Client s3Client;

    @Value("${SUPABASE_S3_ENDPOINT:}")
    private String s3Endpoint;

    @PostConstruct
    public void startupDiagnostic() {
        if (s3Endpoint == null || s3Endpoint.isBlank()) {
            log.warn("[SUPABASE S3 STATUS] SKIPPED: No S3 endpoint configured. Is SUPABASE_S3_ENDPOINT set?");
            return;
        }

        try {
            log.info("[SUPABASE S3 STATUS] Attempting to connect to Superbase S3 at {}...", s3Endpoint);
            ListBucketsResponse response = s3Client.listBuckets();
            log.info(
                    "[SUPABASE S3 STATUS] SUCCESS: Successfully connected to Supabase S3 and verified bucket access. Found {} buckets.",
                    response.buckets().size());
        } catch (S3Exception e) {
            log.error("[SUPABASE S3 STATUS] FAILED S3Exception: {}", e.awsErrorDetails().errorMessage(), e);
        } catch (Exception e) {
            log.error("[SUPABASE S3 STATUS] FAILED Exception: {}", e.getMessage(), e);
        }
    }

    @GetMapping("/s3")
    public ResponseEntity<Map<String, String>> checkS3Health() {
        Map<String, String> response = new HashMap<>();
        try {
            s3Client.listBuckets();
            response.put("status", "connected");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
