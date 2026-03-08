package com.nbh.backend.diagnostics;

import java.util.concurrent.atomic.AtomicLong;

public final class RequestDbMetricsContext {

    private static final ThreadLocal<Metrics> CONTEXT = new ThreadLocal<>();

    private RequestDbMetricsContext() {
    }

    public static void start() {
        CONTEXT.set(new Metrics());
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public static void addConnectionAcquireNanos(long nanos) {
        Metrics metrics = CONTEXT.get();
        if (metrics != null && nanos >= 0) {
            metrics.connectionAcquireNanos.addAndGet(nanos);
        }
    }

    public static void addSqlExecutionNanos(long nanos) {
        Metrics metrics = CONTEXT.get();
        if (metrics != null && nanos >= 0) {
            metrics.sqlExecutionNanos.addAndGet(nanos);
            metrics.sqlStatementCount.incrementAndGet();
        }
    }

    public static Snapshot snapshot() {
        Metrics metrics = CONTEXT.get();
        if (metrics == null) {
            return Snapshot.empty();
        }
        return new Snapshot(
                nanosToMs(metrics.connectionAcquireNanos.get()),
                nanosToMs(metrics.sqlExecutionNanos.get()),
                metrics.sqlStatementCount.get());
    }

    private static long nanosToMs(long nanos) {
        return nanos / 1_000_000;
    }

    private static final class Metrics {
        private final AtomicLong connectionAcquireNanos = new AtomicLong();
        private final AtomicLong sqlExecutionNanos = new AtomicLong();
        private final AtomicLong sqlStatementCount = new AtomicLong();
    }

    public record Snapshot(long connectionAcquireMs, long sqlExecutionMs, long sqlStatementCount) {
        private static Snapshot empty() {
            return new Snapshot(0, 0, 0);
        }
    }
}
