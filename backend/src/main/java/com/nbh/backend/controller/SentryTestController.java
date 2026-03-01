package com.nbh.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SentryTestController {

    @GetMapping("/api/sentry-test")
    public String triggerSentryError() {
        throw new RuntimeException(
                "Sentry Test Exception: If you see this in the Sentry dashboard, the backend integration is perfectly successful!");
    }
}
