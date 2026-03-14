package com.nbh.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum PostType {
    QUESTION("Question"),
    TRIP_REPORT("Trip Report"),
    REVIEW("Review"),
    ALERT("Alert"),
    PHOTO("Photo"),
    STORY("Story");

    private final String label;

    PostType(String label) {
        this.label = label;
    }

    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator
    public static PostType fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Arrays.stream(values())
                .filter(type -> type.name().equalsIgnoreCase(value)
                        || type.label.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid postType: " + value));
    }
}

