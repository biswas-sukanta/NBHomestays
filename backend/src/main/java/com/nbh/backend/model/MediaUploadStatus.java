package com.nbh.backend.model;

/**
 * Status of a media upload in the orphan tracking system.
 */
public enum MediaUploadStatus {
    /**
     * File uploaded to ImageKit but not yet attached to any entity.
     */
    PENDING,

    /**
     * File successfully attached to a post, homestay, or comment.
     */
    ATTACHED,

    /**
     * File was orphaned (never attached) and deleted by cleanup job.
     */
    ORPHANED_DELETED
}
