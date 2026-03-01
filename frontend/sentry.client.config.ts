// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    integrations: [
        Sentry.browserTracingIntegration(),
        // Capture console output as breadcrumbs and logs
        Sentry.consoleIntegration({
            levels: ['log', 'warn', 'error'],
        }),
    ],

    // PERFORMANCE: 10% in production, 100% in local dev
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Explicitly enable the Sentry Logs feature
    enableLogs: true,

    // APM WIRING: Link frontend transactions to backend span
    tracePropagationTargets: [
        "localhost",
        /^https:\/\/thoughtful-jemie-droidmaniac-8802977f\.koyeb\.app\/api/
    ],

    // SESSION REPLAY INTENTIONALLY OMITTED (Handled by PostHog)
    // LOGS & METRICS INTENTIONALLY DISABLED (Handled by Logtail & PostHog)

    debug: false,
});
