package com.nbh.backend.repository;

import java.util.List;
import java.util.UUID;

public interface AsyncJobRepositoryCustom {
    List<UUID> claimPendingJobIds(int limit, int maxAttempts);
}
