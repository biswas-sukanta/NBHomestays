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

    @Value("${REDIS_URL:redis://localhost:6379}")
    private String redisUrl;

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
        String url = redisUrl != null ? redisUrl.trim() : "";
        if (url.isBlank()) {
            stats.put("status", "DOWN");
            stats.put("error", "REDIS_URL env var is missing.");
            return stats;
        }

        if (url.contains("localhost") || url.contains("127.0.0.1")) {
            stats.put("note", "Running on localhost (Development Mode)");
        }

        try {
            String testKey = "diag_" + System.currentTimeMillis();
            redisTemplate.opsForValue().set(testKey, "OK", Duration.ofSeconds(5));
            Object val = redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);

            stats.put("status", "OK".equals(val) ? "UP" : "DOWN");
            stats.put("message", "OK".equals(val) ? "Read/Write success" : "Data mismatch");
        } catch (Exception e) {
            stats.put("status", "DOWN");
            stats.put("error", "Error connecting to Redis: " + e.getMessage());
        }
        return stats;
    }

    public Map<String, Object> checkS3() {
        Map<String, Object> stats = new HashMap<>();
        String endpoint = s3Endpoint != null ? s3Endpoint.trim() : "";
        String regionStr = s3Region != null ? s3Region.trim() : "us-east-1";
        String access = accessKey != null ? accessKey.trim() : "";
        String secret = secretKey != null ? secretKey.trim() : "";
        String bucketName = bucket != null ? bucket.trim() : "community-images";

        if (endpoint.isBlank()) {
            stats.put("status", "SKIPPED");
            stats.put("message", "SUPABASE_S3_ENDPOINT env var is missing");
            return stats;
        }

        if (access.isBlank()) {
            stats.put("status", "DOWN");
            stats.put("error", "SUPABASE_ACCESS_KEY env var is missing");
            return stats;
        }

        stats.put("endpoint", endpoint);
        try {
            URI uri = URI.create(endpoint);
            String host = uri.getHost();
            stats.put("detected_host", host);
            java.net.InetAddress.getByName(host);
            stats.put("dns_resolution", "SUCCESS");
        } catch (Exception e) {
            stats.put("dns_resolution", "FAILED: " + e.getMessage());
        }

        try (S3Client s3 = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(regionStr))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(access, secret)))
                .serviceConfiguration(sc -> sc.pathStyleAccessEnabled(true))
                .build()) {

            ListObjectsV2Response res = s3.listObjectsV2(ListObjectsV2Request.builder()
                    .bucket(bucketName).maxKeys(1).build());

            stats.put("status", "UP");
            stats.put("bucket", bucketName);
            stats.put("object_count", res.keyCount());
        } catch (Exception e) {
            stats.put("status", "DOWN");
            stats.put("error", "Error connecting to S3 on " + endpoint + ": " + e.getMessage());
            stats.put("tip",
                    "UnknownHostException usually means DNS resolution failed. Check the endpoint URL: " + endpoint);
        }
        return stats;
    }
}
