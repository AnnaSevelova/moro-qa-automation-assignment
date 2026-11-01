import { errors, type Locator } from '@playwright/test';

/**
 * Clicks an element that may or may not appear (e.g. cookie consent dialogs,
 * which depend on region and previous consent). Only a timeout is tolerated,
 * any other failure is rethrown so real problems are not hidden.
 */
export async function dismissIfPresent(locator: Locator, timeout = 5_000): Promise<void> {
    try {
        await locator.click({ timeout });
    } catch (error) {
        if (!(error instanceof errors.TimeoutError)) {
            throw error;
        }
    }
}
