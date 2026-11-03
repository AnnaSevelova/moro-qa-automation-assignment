import { defineConfig, devices, type Project } from '@playwright/test';

const isCI = !!process.env.CI;

/**
 * Visual regression tests have their own config: they compare screenshots of the MoroSystems website
 * against baseline images and need neither the todo backend nor the GUI browser projects.
 * Traces, videos and failure screenshots are off, the report shows the expected, actual and diff images.
 */
const visualProject = (name: string, device: string): Project => ({
    name,
    use: {
        ...devices[device],
        trace: 'off',
        video: 'off',
        screenshot: 'off',
    },
});

export default defineConfig({
    testDir: './tests/visual',
    fullyParallel: true,
    forbidOnly: isCI,
    // A visual difference is a result, not a flaky failure, so it is never retried
    retries: 0,
    workers: isCI ? 2 : undefined,
    timeout: 60_000,
    // Baselines are kept per platform (fonts render differently on macOS and Linux), only Linux ones are committed
    snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{platform}/{arg}{-projectName}{ext}',
    expect: {
        // Comparing full-page screenshots of long pages takes a while
        timeout: 20_000,
        toHaveScreenshot: {
            // Per-pixel color tolerance (0 = exact) and share of pixels allowed to differ
            threshold: 0.2,
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
        },
    },
    outputDir: './test-output/visual-results',
    reporter: [
        ['list'],
        ['html', { open: 'never', outputFolder: './test-output/visual-report' }],
    ],
    use: {
        locale: 'cs-CZ',
        timezoneId: 'Europe/Prague',
    },
    projects: [
        visualProject('visual-chromium', 'Desktop Chrome'),
        visualProject('visual-firefox', 'Desktop Firefox'),
        // WebKit renders blank or broken screenshots on Linux, so it is compared locally on macOS only
        visualProject('visual-webkit', 'Desktop Safari'),
    ],
});
