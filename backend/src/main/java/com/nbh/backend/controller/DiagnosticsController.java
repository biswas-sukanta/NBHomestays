package com.nbh.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;

import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Diagnostic probe to verify integrations are working in production.
 */
@RestController
@RequestMapping("/api/diagnostics")
@RequiredArgsConstructor
public class DiagnosticsController {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${SUPABASE_S3_ENDPOINT:}")
    private String s3Endpoint;

    @Value("${SUPABASE_S3_REGION:ap-south-1}")
    private String s3Region;

    @Value("${SUPABASE_ACCESS_KEY:}")
    private String accessKey;

    @Value("${SUPABASE_SECRET_KEY:}")
    private String secretKey;

    @Value("${SUPABASE_BUCKET:community-images}")
    private String bucket;

    @GetMapping
    public ResponseEntity<Map<String, Object>> runDiagnostics() {
        Map<String, Object> report = new HashMap<>();

        // 1. Redis Check
        try {
            String testKey = "diagnostics_test_" + System.currentTimeMillis();
            redisTemplate.opsForValue().set(testKey, "working", Duration.ofSeconds(10));
            Object value = redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);

            if ("working".equals(value)) {
                report.put("redis", Map.of("status", "UP", "message", "Read/Write successful"));
            } else {
                report.put("redis", Map.of("status", "DOWN", "message", "Data mismatch"));
            }
        } catch (Exception e) {
            report.put("redis", Map.of("status", "DOWN", "error", e.getMessage()));
        }

        // 2. Supabase S3 Check
        if (s3Endpoint.isBlank() || accessKey.isBlank()) {
            report.put("supabase_s3", Map.of("status", "SKIPPED", "message", "Credentials not configured"));
        } else {
            try {
                S3Client s3 = S3Client.builder()
                        .endpointOverride(URI.create(s3Endpoint))
                        .region(Region.of(s3Region))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKey, secretKey)))
                        .build();

                ListObjectsV2Response response = s3.listObjectsV2(ListObjectsV2Request.builder()
                        .bucket(bucket)
                        .maxKeys(1)
                        .build());

                report.put("supabase_s3", Map.of(
                        "status", "UP",
                        "bucket", bucket,
                        "object_count_in_test_batch", response.keyCount()));
                s3.close();
            } catch (Exception e) {
                report.put("supabase_s3", Map.of("status", "DOWN", "error", e.getMessage()));
            }
        }

        return ResponseEntity.ok(report);
    }
}
