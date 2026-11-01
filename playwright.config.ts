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
    ...(isEdgeInstalled ? [{ name: 'gui-edge', use: { ...devices['Desktop Edge'] } }] : []),
];

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
        ...guiBrowsers.map((project) => ({ ...project, testDir: './tests/gui' })),
    ],
});
