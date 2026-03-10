package com.nbh.backend.perf;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PerfTimingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(PerfTimingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!shouldProfile(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        PerfTimingContext ctx = new PerfTimingContext(requestId);
        PerfTimingContext.set(ctx);

        long beforeChainNs = System.nanoTime();
        try {
            ctx.markPhase("request_received");
            filterChain.doFilter(request, response);
        } finally {
            long afterChainNs = System.nanoTime();
            long chainNs = afterChainNs - beforeChainNs;

            // Anything not explicitly accounted for by AOP/DB instrumentation lands here.
            ctx.addDurationNs("response_send_time", 0L);

            logSummary(request, response, ctx, chainNs);
            PerfTimingContext.clear();
        }
    }

    private boolean shouldProfile(String path) {
        if (path == null) {
            return false;
        }
        return path.startsWith("/api/posts")
                || path.startsWith("/api/destinations")
                || path.startsWith("/api/states")
                || path.startsWith("/api/homestays/search");
    }

    private void logSummary(HttpServletRequest request, HttpServletResponse response, PerfTimingContext ctx, long chainNs) {
        Map<String, Long> phases = ctx.snapshotDurationsNs();

        StringBuilder sb = new StringBuilder();
        sb.append("PERF requestId=").append(ctx.getRequestId())
                .append(" method=").append(request.getMethod())
                .append(" uri=").append(request.getRequestURI())
                .append(" status=").append(response.getStatus())
                .append(" totalMs=").append(nsToMs(chainNs));

        for (Map.Entry<String, Long> e : phases.entrySet()) {
            sb.append(" ").append(e.getKey()).append("Ms=").append(nsToMs(e.getValue()));
        }

        log.info(sb.toString());
    }

    private long nsToMs(long ns) {
        return ns / 1_000_000;
    }
}
