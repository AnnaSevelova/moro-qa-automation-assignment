import { expect, test } from '@playwright/test';

import { VISUAL_PAGES } from './pages.ts';
import { openStablePage, snapshotName } from './support/stable-page.ts';

/**
 * Compares full-page screenshots of the MoroSystems website with the committed baseline images.
 * A missing baseline is written on the first run and the test fails, so it is never created unnoticed:
 * review it and commit it (see README).
 */
test.describe('Visual regression', () => {
    for (const target of VISUAL_PAGES) {
        test(`${target.name} page matches the baseline`, async ({ page }) => {
            await openStablePage(page, target);

            await expect(page).toHaveScreenshot(snapshotName(target), { fullPage: true });
        });
    }
});
