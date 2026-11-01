import { expect, type Locator, type Page } from '@playwright/test';

/** The page must not be wider than the screen, i.e. it doesn't scroll sideways. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth, 'page should not scroll horizontally').toBeLessThanOrEqual(clientWidth);
}

/** The element is visible and fits into the screen width, so nothing of it is cut off. */
export async function expectFitsScreenWidth(locator: Locator, page: Page): Promise<void> {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    const { width } = page.viewportSize()!;

    expect(box, 'element should have a size').not.toBeNull();
    expect(box!.x, 'element should not start left of the screen').toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, 'element should not end right of the screen').toBeLessThanOrEqual(width);
}
