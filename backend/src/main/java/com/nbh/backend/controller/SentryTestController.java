package com.nbh.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SentryTestController {

    private static final Logger logger = LoggerFactory.getLogger(SentryTestController.class);

    @GetMapping("/api/sentry-test")
    public String triggerSentryError() {
        logger.info("📢 Sentry Test: INFO log (breadcrumb)");
        logger.warn("⚠️ Sentry Test: WARNING log (captured as event)");
        try {
            throw new RuntimeException("Sentry Test Exception: Verification in progress");
        } catch (Exception e) {
            logger.error("❌ Sentry Test: ERROR log with exception", e);
            throw e;
        }
    }
}
