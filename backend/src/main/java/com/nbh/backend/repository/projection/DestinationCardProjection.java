package com.nbh.backend.repository.projection;

import java.util.List;
import java.util.UUID;

/**
 * Projection interface for destination card data with homestay count.
 * Used by optimized queries to avoid N+1 lazy loading issues.
 */
public interface DestinationCardProjection {
    UUID getId();
    String getSlug();
    String getName();
    String getLocalImageName();
    Long getHomestayCount();
    String getStateName();
    String getStateSlug();
    List<String> getTags();
}
