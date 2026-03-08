package com.nbh.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class AsyncJobRepositoryImpl implements AsyncJobRepositoryCustom {

    private final JdbcTemplate jdbcTemplate;

    public AsyncJobRepositoryImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<UUID> claimPendingJobIds(int limit, int maxAttempts) {
        String sql = """
                WITH claimed AS (
                    SELECT id
                    FROM async_jobs
                    WHERE status = 'PENDING'
                      AND attempts < ?
                    ORDER BY created_at ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT ?
                )
                UPDATE async_jobs j
                SET status = 'IN_PROGRESS',
                    updated_at = NOW()
                FROM claimed
                WHERE j.id = claimed.id
                RETURNING j.id
                """;
        return jdbcTemplate.queryForList(sql, UUID.class, maxAttempts, limit);
    }
}
