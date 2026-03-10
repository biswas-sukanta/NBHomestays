package com.nbh.backend.perf;

import java.util.LinkedHashMap;
import java.util.Map;

public final class PerfTimingContext {

    private static final ThreadLocal<PerfTimingContext> CTX = new ThreadLocal<>();

    private final String requestId;
    private final long requestStartNs;
    private final LinkedHashMap<String, Long> phaseDurationsNs = new LinkedHashMap<>();

    private volatile long lastMarkNs;

    public PerfTimingContext(String requestId) {
        this.requestId = requestId;
        this.requestStartNs = System.nanoTime();
        this.lastMarkNs = this.requestStartNs;
    }

    public static void set(PerfTimingContext ctx) {
        CTX.set(ctx);
    }

    public static PerfTimingContext get() {
        return CTX.get();
    }

    public static void clear() {
        CTX.remove();
    }

    public String getRequestId() {
        return requestId;
    }

    public long getRequestStartNs() {
        return requestStartNs;
    }

    public void markPhase(String phaseName) {
        long now = System.nanoTime();
        long delta = now - lastMarkNs;
        phaseDurationsNs.merge(phaseName, delta, Long::sum);
        lastMarkNs = now;
    }

    public void addDurationNs(String phaseName, long durationNs) {
        phaseDurationsNs.merge(phaseName, durationNs, Long::sum);
    }

    public Map<String, Long> snapshotDurationsNs() {
        return new LinkedHashMap<>(phaseDurationsNs);
    }

    public long totalElapsedNs() {
        return System.nanoTime() - requestStartNs;
    }
}
