package com.nbh.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class InfrastructureDetailsService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final DataSource dataSource;

    @Value("${app.cache.redis.enabled:true}")
    private boolean redisEnabled;

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${IMAGEKIT_PUBLIC_KEY:}")
    private String imageKitPublicKey;

    @Value("${IMAGEKIT_URL_ENDPOINT:}")
    private String imageKitEndpoint;

    @Value("${KOYEB_REGION:}")
    private String koyebRegion;

    @Value("${SUPABASE_REGION:}")
    private String supabaseRegion;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    public Map<String, Object> checkRedis() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("host", redisHost);
        stats.put("port", redisPort);

        if (!redisEnabled) {
            stats.put("status", "DISABLED");
            stats.put("message", "Redis is disabled via kill switch (app.cache.redis.enabled=false). Diagnostics do not perform Redis operations.");
            return stats;
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

    public Map<String, Object> checkDatabase() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("datasourceUrl", sanitizeJdbcUrl(datasourceUrl));
        stats.put("connectionMode", inferConnectionMode(datasourceUrl));
        stats.put("koyebRegion", koyebRegion.isBlank() ? "unknown" : koyebRegion);
        stats.put("supabaseRegion", supabaseRegion.isBlank() ? "unknown" : supabaseRegion);

        addHikariConfig(stats);

        long acquireStart = System.nanoTime();
        try (Connection connection = dataSource.getConnection()) {
            long acquireMs = nanosToMs(System.nanoTime() - acquireStart);
            stats.put("connectionAcquireMs", acquireMs);

            long roundTripStart = System.nanoTime();
            try (Statement selectStmt = connection.createStatement()) {
                ResultSet rs = selectStmt.executeQuery("SELECT 1");
                if (rs.next()) {
                    stats.put("select1Result", rs.getInt(1));
                }
            }
            long roundTripMs = nanosToMs(System.nanoTime() - roundTripStart);
            stats.put("select1RoundTripMs", roundTripMs);

            Double serverExecutionMs = readExplainExecutionMs(connection);
            if (serverExecutionMs != null) {
                stats.put("serverExecutionMs", serverExecutionMs);
                stats.put("estimatedNetworkMs", Math.max(0.0, roundTripMs - serverExecutionMs));
            }

            stats.put("status", "UP");
            stats.put("message", "Database connectivity probe succeeded");
        } catch (Exception e) {
            stats.put("status", "DOWN");
            stats.put("error", e.getMessage());
        }

        return stats;
    }

    public void warmupDatabaseConnections() {
        Map<String, Object> dbStats = checkDatabase();
        if ("UP".equals(dbStats.get("status"))) {
            log.info("DB warmup completed. acquireMs={}, select1RoundTripMs={}, mode={}",
                    dbStats.get("connectionAcquireMs"),
                    dbStats.get("select1RoundTripMs"),
                    dbStats.get("connectionMode"));
        } else {
            log.warn("DB warmup failed: {}", dbStats.get("error"));
        }
    }

    private void addHikariConfig(Map<String, Object> stats) {
        if (dataSource instanceof HikariDataSource hikari) {
            Map<String, Object> pool = new HashMap<>();
            pool.put("minimumIdle", hikari.getMinimumIdle());
            pool.put("maximumPoolSize", hikari.getMaximumPoolSize());
            pool.put("connectionTimeoutMs", hikari.getConnectionTimeout());
            pool.put("idleTimeoutMs", hikari.getIdleTimeout());
            pool.put("maxLifetimeMs", hikari.getMaxLifetime());
            stats.put("hikari", pool);
        }
    }

    private Double readExplainExecutionMs(Connection connection) {
        try (Statement explainStmt = connection.createStatement()) {
            ResultSet rs = explainStmt.executeQuery("EXPLAIN (ANALYZE, FORMAT TEXT) SELECT 1");
            Pattern pattern = Pattern.compile("Execution Time: ([0-9.]+) ms");
            while (rs.next()) {
                String line = rs.getString(1);
                Matcher matcher = pattern.matcher(line);
                if (matcher.find()) {
                    return Double.parseDouble(matcher.group(1));
                }
            }
        } catch (Exception ignored) {
            // Some pool modes can reject EXPLAIN ANALYZE on proxied sessions; skip server timing in that case.
        }
        return null;
    }

    private long nanosToMs(long nanos) {
        return nanos / 1_000_000;
    }

    private String inferConnectionMode(String jdbcUrl) {
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            return "unknown";
        }
        Integer port = extractPort(jdbcUrl);
        if (port == null) {
            return "unknown";
        }
        if (port == 6543) {
            return "pooled (pgbouncer)";
        }
        if (port == 5432) {
            return "direct";
        }
        return "custom-port-" + port;
    }

    private String sanitizeJdbcUrl(String jdbcUrl) {
        if (jdbcUrl == null) {
            return "";
        }
        return jdbcUrl.replaceAll("password=[^&;]+", "password=***");
    }

    private Integer extractPort(String jdbcUrl) {
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            return null;
        }
        Matcher matcher = Pattern.compile("jdbc:postgresql://[^:/]+:(\\d+)").matcher(jdbcUrl);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return null;
    }

    /** Clear all keys from the current Redis database. */
    public void clearAllCaches() {
        if (!redisEnabled) {
            return;
        }
        var factory = redisTemplate.getConnectionFactory();
        if (factory != null) {
            try (var connection = factory.getConnection()) {
                if (connection != null) {
                    connection.serverCommands().flushDb();
                }
            }
        }
    }
}
