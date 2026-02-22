package com.nbh.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
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

@Service
@RequiredArgsConstructor
public class InfrastructureDetailsService {

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

    public Map<String, Object> checkRedis() {
        Map<String, Object> stats = new HashMap<>();
        try {
            String testKey = "diag_" + System.currentTimeMillis();
            redisTemplate.opsForValue().set(testKey, "OK", Duration.ofSeconds(5));
            Object val = redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);

            stats.put("status", "OK".equals(val) ? "UP" : "DOWN");
            stats.put("message", "OK".equals(val) ? "Read/Write success" : "Data mismatch");
        } catch (Exception e) {
            stats.put("status", "DOWN");
            stats.put("error", e.getMessage());
        }
        return stats;
    }

    public Map<String, Object> checkS3() {
        Map<String, Object> stats = new HashMap<>();
        if (s3Endpoint == null || s3Endpoint.isBlank()) {
            stats.put("status", "SKIPPED");
            stats.put("message", "SUPABASE_S3_ENDPOINT is missing");
            return stats;
        }

        stats.put("attempted_endpoint", s3Endpoint);
        try (S3Client s3 = S3Client.builder()
                .endpointOverride(URI.create(s3Endpoint))
                .region(Region.of(s3Region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build()) {

            ListObjectsV2Response res = s3.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(bucket).maxKeys(1).build());

            stats.put("status", "UP");
            stats.put("bucket", bucket);
            stats.put("object_count", res.keyCount());
        } catch (Exception e) {
            stats.put("status", "DOWN");
            stats.put("error", e.getMessage());
            stats.put("tip", "Check if SUPABASE_S3_ENDPOINT is correct and reachable. Provided: " + s3Endpoint);
        }
        return stats;
    }
}
