package com.nbh.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InfrastructureDetailsService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${IMAGEKIT_PUBLIC_KEY:}")
    private String imageKitPublicKey;

    @Value("${IMAGEKIT_URL_ENDPOINT:}")
    private String imageKitEndpoint;

    public Map<String, Object> checkRedis() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("host", redisHost);
        stats.put("port", redisPort);

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

    public Map<String, Object> checkImageKit() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("endpoint", imageKitEndpoint);

        if (imageKitPublicKey.isBlank() || imageKitEndpoint.isBlank()) {
            stats.put("status", "DOWN");
            stats.put("error", "ImageKit credentials or endpoint missing in environment variables.");
            return stats;
        }

        try {
            // Check if SDK is initialized
            // Note: imagekit-java SDK doesn't have a direct 'isInitialized' check,
            // but we can check if the config is set on the instance.
            // If the user hasn't set it, ImageKit operations would fail.
            // For now, we verify the presence of env vars as a proxy for 'Ready'.
            stats.put("status", "UP");
            stats.put("message", "ImageKit SDK configuration detected.");
        } catch (Exception e) {
            stats.put("status", "DOWN");
            stats.put("error", "ImageKit diagnostic failed: " + e.getMessage());
        }
        return stats;
    }

    /** Clear all keys from the current Redis database. */
    public void clearAllCaches() {
        if (redisTemplate.getConnectionFactory() != null
                && redisTemplate.getConnectionFactory().getConnection() != null) {
            redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
        }
    }
}
