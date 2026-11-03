import { errors, type Locator } from '@playwright/test';

/**
 * Clicks an element that may or may not appear (e.g. cookie consent dialogs, which depend on region
 * and previous consent). Only the element not appearing is tolerated: once it is visible, a failed
 * click is reported, so real problems are not hidden.
 */
export async function dismissIfPresent(locator: Locator, timeout = 5_000): Promise<void> {
    try {
        await locator.waitFor({ state: 'visible', timeout });
    } catch (error) {
        if (!(error instanceof errors.TimeoutError)) {
            throw error;
        }

        return;
    }

    await locator.click({ timeout });
}
