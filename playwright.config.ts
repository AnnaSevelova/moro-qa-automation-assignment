import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 2 : undefined,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    // Everything a run generates goes to test-output (gitignored).
    outputDir: './test-output/results',
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: './test-output/report' }],
    ],
    use: {
        locale: 'cs-CZ',
        timezoneId: 'Europe/Prague',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'gui-chromium',
            testDir: './tests/gui',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
