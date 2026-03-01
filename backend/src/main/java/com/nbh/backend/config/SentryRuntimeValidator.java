package com.nbh.backend.config;

import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SentryRuntimeValidator implements ApplicationRunner {
    private static final Logger logger = LoggerFactory.getLogger(SentryRuntimeValidator.class);

    @Value("${sentry.dsn:NOT_CONFIGURED}")
    private String sentryDsn;

    // KOYEB_GIT_SHA is automatically injected by the Koyeb platform
    @Value("${KOYEB_GIT_SHA:local-dev}")
    private String gitSha;

    @Override
    public void run(ApplicationArguments args) {
        if ("NOT_CONFIGURED".equals(sentryDsn) || sentryDsn.isEmpty()) {
            logger.error("❌ SENTRY ERROR: DSN is missing. Observability is offline.");
        } else {
            logger.info("✅ SENTRY SUCCESS: Connection established to DSN.");
            logger.info("📦 RELEASE TAG: {}", gitSha);

            // Ship a test message to Sentry to confirm the 'Logs' tab is active
            Sentry.captureMessage("System Online: Release " + gitSha + " is now being monitored.");
        }
    }
}
