import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    globalSetup: './tests/api/global-setup.ts',
    testDir: './tests',
    timeout: 60000,
    expect: {
        timeout: 10000,
        toHaveScreenshot: {
            maxDiffPixels: 100,
        },
    },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [['line'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        trace: 'on',
        screenshot: 'on',
        video: 'on',
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'Desktop Chrome',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
        },
        {
            name: 'iPhone 13 Pro',
            use: {
                ...devices['iPhone 13 Pro'],
            },
        },
    ],
});
