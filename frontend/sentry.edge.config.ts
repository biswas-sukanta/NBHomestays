// This file configures the initialization of Sentry for edge functions.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // PERFORMANCE: 10% in production, 100% in local dev
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Explicitly enable the Sentry Logs feature
    enableLogs: true,

    debug: false,
});
