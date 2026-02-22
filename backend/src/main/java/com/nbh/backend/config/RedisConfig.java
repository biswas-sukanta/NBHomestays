package com.nbh.backend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis cache configuration.
 *
 * Reads REDIS_URL from environment (set as Koyeb app var):
 * redis://default:<password>@<host>:<port>
 *
 * Falls back to localhost:6379 for local dev.
 */
@Configuration
@EnableCaching
public class RedisConfig {

    @Value("${REDIS_URL:redis://localhost:6379}")
    private String redisUrl;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        try {
            URI uri = URI.create(redisUrl);
            RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
            config.setHostName(uri.getHost());
            config.setPort(uri.getPort() == -1 ? 6379 : uri.getPort());
            // Extract password from userinfo: "default:<password>"
            String userInfo = uri.getUserInfo();
            if (userInfo != null && userInfo.contains(":")) {
                config.setPassword(userInfo.substring(userInfo.indexOf(':') + 1));
            }
            return new LettuceConnectionFactory(config);
        } catch (Exception e) {
            // Graceful fallback — Redis down won't crash the app
            RedisStandaloneConfiguration fallback = new RedisStandaloneConfiguration("localhost", 6379);
            return new LettuceConnectionFactory(fallback);
        }
    }

    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        // Store type info so polymorphic objects deserialise correctly
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

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        GenericJackson2JsonRedisSerializer serializer = jsonRedisSerializer();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        // Per-cache TTL overrides
        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("homestays", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigs.put("feed", defaultConfig.entryTtl(Duration.ofSeconds(30)));
        cacheConfigs.put("homestay-list", defaultConfig.entryTtl(Duration.ofMinutes(2)));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

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
