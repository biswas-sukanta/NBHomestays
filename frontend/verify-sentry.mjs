import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Sentry = require('@sentry/nextjs');
const { init, captureException, flush } = Sentry;

const nextEnv = require('@next/env');
const { loadEnvConfig } = nextEnv;

// Load environment variables from .env.local
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (!dsn) {
    console.error("❌ ERROR: NEXT_PUBLIC_SENTRY_DSN is missing from your environment variables.");
    process.exit(1);
}

console.log("🚀 Initializing Sentry Verification...");

init({
    dsn: dsn,
    tracesSampleRate: 1.0, // Force 100% capture for this test
    // Explicitly enable the Sentry Logs feature for verification
    enableLogs: true,
});

async function verify() {
    try {
        console.log("✅ SDK Initialized.");

        // 1. Generate a Log (Sentry Logs)
        console.log("📢 Automated Verification Log: This should appear in Sentry Logs!");

        // 2. Generate an Error
        const errorId = captureException(new Error("Automated Verification Error: Setup is fully operational!"));
        console.log(`✅ Error generated. Event ID: ${errorId}`);

        // 2. Force the SDK to transmit immediately (wait up to 5 seconds)
        console.log("⏳ Flushing queue to Sentry Cloud...");
        const success = await flush(5000);

        if (success) {
            console.log("🎉 SUCCESS: Verification payload securely transmitted to Sentry!");
            console.log("👉 Check your Sentry Dashboard. The 'Waiting for first trace' screen should now be clear.");
        } else {
            console.log("⚠️ WARNING: Flush timed out. Data might still be in the background queue or transmission failed.");
        }
    } catch (e) {
        console.error("❌ Failed to send Sentry verification:", e);
    }
}

verify();
