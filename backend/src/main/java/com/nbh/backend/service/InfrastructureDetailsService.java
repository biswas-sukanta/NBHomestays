package com.nbh.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
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
    private final S3Client s3Client;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${SUPABASE_S3_ENDPOINT:}")
    private String s3Endpoint;

    @Value("${SUPABASE_BUCKET:community-images}")
    private String bucket;

    public Map<String, Object> checkRedis() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("host", redisHost);
        stats.put("port", redisPort);

        if (redisHost.contains("localhost") || redisHost.contains("127.0.0.1")) {
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
        String bucketName = bucket != null ? bucket.trim() : "community-images";

        if (endpoint.isBlank()) {
            stats.put("status", "SKIPPED");
            stats.put("message", "SUPABASE_S3_ENDPOINT env var is missing");
            return stats;
        }

        if (s3Client == null) {
            stats.put("status", "DOWN");
            stats.put("error", "S3Client bean is null. Check configuration.");
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

        try {
            ListObjectsV2Response res = s3Client.listObjectsV2(ListObjectsV2Request.builder()
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

    /** Clear all keys from the current Redis database. */
    public void clearAllCaches() {
        if (redisTemplate.getConnectionFactory() != null) {
            redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
        }
    }
}
