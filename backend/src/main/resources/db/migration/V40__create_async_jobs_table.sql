CREATE TABLE async_jobs (
    id UUID PRIMARY KEY,
    job_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_async_jobs_status_created_at ON async_jobs(status, created_at);
CREATE INDEX idx_async_jobs_type_status ON async_jobs(job_type, status);
