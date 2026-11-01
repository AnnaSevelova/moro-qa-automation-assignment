import { existsSync } from 'node:fs';
import path from 'node:path';

import { defineConfig, devices, type Project } from '@playwright/test';

const isCI = !!process.env.CI;

/**
 * Edge is not bundled with Playwright, it is used only when installed on the machine
 * (the same locations Playwright looks in for the `msedge` channel).
 */
const isEdgeInstalled = [
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/opt/microsoft/msedge/msedge',
    ...['PROGRAMFILES(X86)', 'PROGRAMFILES', 'LOCALAPPDATA']
        .map((variable) => process.env[variable])
        .filter((dir): dir is string => !!dir)
        .map((dir) => path.join(dir, 'Microsoft', 'Edge', 'Application', 'msedge.exe')),
].some((executable) => existsSync(executable));

/** GUI tests run in every browser: Chromium, Firefox, WebKit (Safari's engine) and Edge if installed. */
const guiBrowsers: Project[] = [
    { name: 'gui-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'gui-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'gui-webkit', use: { ...devices['Desktop Safari'] } },
    // The "Desktop Edge" preset only sets Edge's viewport and user agent, the channel launches the real Edge
    ...(isEdgeInstalled ? [{ name: 'gui-edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } }] : []),
];

/**
 * Todo backend under test. By default the copy in `apps/todo-be` is started on port 8080 (or an already
 * running one is reused). Setting API_BASE_URL tests a backend running elsewhere instead.
 */
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

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
    webServer: process.env.API_BASE_URL ? undefined : {
        command: 'npm run api:start',
        // GET /tasks waits 3 seconds on purpose, the completed tasks endpoint answers right away.
        url: `${API_BASE_URL}/tasks/completed`,
        reuseExistingServer: !isCI,
        timeout: 30_000,
    },
    projects: [
        ...guiBrowsers.map((project) => ({ ...project, testDir: './tests/gui' })),
        {
            name: 'api',
            testDir: './tests/api',
            use: {
                baseURL: API_BASE_URL,
                extraHTTPHeaders: { Accept: 'application/json' },
            },
        },
    ],
});
