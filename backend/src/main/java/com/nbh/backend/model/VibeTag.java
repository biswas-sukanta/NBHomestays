package com.nbh.backend.model;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

public enum VibeTag {
    HIDDEN_GEM("Hidden Gem"),
    OFFBEAT("Offbeat"),
    SUNRISE("Sunrise"),
    HERITAGE("Heritage"),
    FOOD("Food"),
    LOCAL_TIPS("Local Tips"),
    TRANSPORT("Transport");

    private final String value;

    VibeTag(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static boolean isAllowed(String value) {
        if (value == null) {
            return false;
        }
        return Arrays.stream(values()).anyMatch(tag -> tag.value.equalsIgnoreCase(value));
    }

    public static Set<String> allowedValues() {
        return Arrays.stream(values()).map(VibeTag::getValue).collect(Collectors.toUnmodifiableSet());
    }
}

