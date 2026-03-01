package com.nbh.backend.config;

import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SentryRuntimeValidator implements ApplicationRunner {
    private static final Logger logger = LoggerFactory.getLogger(SentryRuntimeValidator.class);

    @Value("${sentry.dsn:NOT_CONFIGURED}")
    private String sentryDsn;

    // KOYEB_GIT_SHA is automatically injected by the Koyeb platform
    @Value("${KOYEB_GIT_SHA:local-dev}")
    private String gitSha;

    private final JdbcTemplate jdbcTemplate;

    public SentryRuntimeValidator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if ("NOT_CONFIGURED".equals(sentryDsn) || sentryDsn.isEmpty()) {
            logger.error("❌ SENTRY ERROR: DSN is missing. Observability is offline.");
            return;
        }

        try {
            // Resilient Check: Ensure DB is reachable before signaling full system success
            jdbcTemplate.execute("SELECT 1");
            logger.info("✅ SENTRY SUCCESS: Connection established.");
            logger.info("📦 MONITORING RELEASE: {}", gitSha);

            // Ship a test message to Sentry to confirm the 'Logs' tab is receiving data
            Sentry.captureMessage("System Online: Release " + gitSha + " is active and DB is stable.");
        } catch (Exception e) {
            logger.warn(
                    "⚠️ SENTRY SEMI-SUCCESS: SDK active but Database is currently unreachable/locked. (Service will retry in background)");
            Sentry.captureException(e);
        }
    }
}
