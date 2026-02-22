package com.nbh.backend.config;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Jackson mixin for {@link org.springframework.data.domain.PageImpl}.
 *
 * PageImpl has no default constructor, so Jackson cannot deserialize
 * it from Redis. This mixin tells Jackson to use a @JsonCreator
 * constructor that maps the JSON properties to constructor parameters.
 *
 * Registered in {@link RedisConfig#redisObjectMapper()}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class RestPageImplMixin {

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    RestPageImplMixin(
            @JsonProperty("content") java.util.List<?> content,
            @JsonProperty("number") int number,
            @JsonProperty("size") int size,
            @JsonProperty("totalElements") Long totalElements,
            @JsonProperty("pageable") JsonNode pageable,
            @JsonProperty("last") boolean last,
            @JsonProperty("totalPages") int totalPages,
            @JsonProperty("sort") JsonNode sort,
            @JsonProperty("first") boolean first,
            @JsonProperty("numberOfElements") int numberOfElements) {
    }
}
