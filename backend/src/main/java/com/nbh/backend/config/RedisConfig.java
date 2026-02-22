package com.nbh.backend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis cache configuration — hardened for production.
 *
 * Kill Switch:
 * Set app.cache.redis.enabled=false (or env APP_CACHE_REDIS_ENABLED=false)
 * to bypass Redis entirely. All @Cacheable annotations become no-ops and
 * every request reads directly from PostgreSQL. The Service layer is
 * completely untouched — routing is handled here at the CacheManager level.
 *
 * Serialization Fixes:
 * - Hibernate6Module for lazy proxy handling.
 * - PageImpl mixin for correct deserialization from Redis.
 * - FAIL_ON_UNKNOWN_PROPERTIES = false for forward-compatibility.
 */
@Configuration
@EnableCaching
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    // ── Kill Switch ───────────────────────────────────────────
    @Value("${app.cache.redis.enabled:true}")
    private boolean cacheEnabled;

    // ── Redis Connection Properties ───────────────────────────
    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Value("${spring.data.redis.ssl.enabled:false}")
    private boolean sslEnabled;

    // ── Connection Factory ────────────────────────────────────
    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(redisHost);
        config.setPort(redisPort);
        if (redisPassword != null && !redisPassword.isBlank()) {
            config.setPassword(redisPassword);
        }

        LettuceClientConfiguration.LettuceClientConfigurationBuilder lettuceConfigBuilder = LettuceClientConfiguration
                .builder();

        if (sslEnabled) {
            lettuceConfigBuilder.useSsl();
        }

        return new LettuceConnectionFactory(config, lettuceConfigBuilder.build());
    }

    // ── Jackson ObjectMapper (hardened for Redis) ─────────────
    private ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Module 1: Java 8 Date/Time
        mapper.registerModule(new JavaTimeModule());

        // Module 2: Hibernate lazy-proxy handling
        mapper.registerModule(new com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module());

        // Fix 3: Teach Jackson how to deserialize PageImpl from Redis
        mapper.addMixIn(PageImpl.class, RestPageImplMixin.class);

        // Fix 4: Don't crash if Redis has a field we don't expect
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Store type info so polymorphic objects deserialize correctly
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);

        return mapper;
    }

    @Bean
    public GenericJackson2JsonRedisSerializer jsonRedisSerializer() {
        return new GenericJackson2JsonRedisSerializer(redisObjectMapper());
    }

    // ══════════════════════════════════════════════════════════
    // THE KILL SWITCH — Global CacheManager Routing
    // ══════════════════════════════════════════════════════════
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {

        // ── Kill Switch OFF → bypass Redis entirely ──────────
        if (!cacheEnabled) {
            log.warn("🛑 Redis caching is DISABLED via kill switch (app.cache.redis.enabled=false). "
                    + "Routing ALL traffic directly to PostgreSQL. "
                    + "Every @Cacheable annotation is now a no-op.");
            return new NoOpCacheManager();
        }

        // ── Kill Switch ON → full Redis caching ──────────────
        log.info("✅ Redis caching is ENABLED. All @Cacheable routes will be served from Redis.");

        GenericJackson2JsonRedisSerializer serializer = jsonRedisSerializer();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        // Per-cache TTL overrides
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("homestay", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigs.put("homestaysSearch", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigs.put("postsList", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigs.put("postDetail", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigs.put("homestayQA", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigs.put("postComments", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigs.put("homestayReviews", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigs.put("adminStats", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    // ── RedisTemplate (for non-cache operations like diagnostics) ──
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}
