package com.nbh.backend.repository.projection;

import java.util.UUID;

public interface StateSummaryProjection {
    UUID getId();

    String getSlug();

    String getName();

    String getDescription();

    String getHeroImageName();

    long getDestinationCount();

    long getHomestayCount();
}

