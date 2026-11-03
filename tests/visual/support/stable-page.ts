import type { Page } from '@playwright/test';

import { MoroSystemsHomePage } from '../../gui/pages/moro-systems-home-page.ts';
import type { VisualPage } from '../pages.ts';

/** Overlays of third-party services (cookie banner and its settings icon, reCAPTCHA badge), not website content. */
const THIRD_PARTY_OVERLAYS = ['#cookiescript_injected_wrapper', '#cookiescript_badge', '.grecaptcha-badge'];

/**
 * Opens a page as users see it (scripts, images and background images included), but in a state that
 * looks the same on every run: optional cookies rejected, animations and third-party overlays off, every
 * image loaded and the sections whose content changes removed from the layout, so they change neither the
 * image nor the page height.
 */
export async function openStablePage(page: Page, target: VisualPage): Promise<void> {
    await page.goto(target.url);
    await new MoroSystemsHomePage(page).rejectOptionalCookies();

    await page.addStyleTag({
        content: `
            *, *::before, *::after { animation: none !important; transition: none !important; }
            html { scroll-behavior: auto !important; }
            ${[...target.hiddenSections, ...THIRD_PARTY_OVERLAYS].join(', ')} { display: none !important; }
        `,
    });

    await page.evaluate(async () => {
        // Images with loading="lazy" (e.g. the photo gallery) would otherwise only load when scrolled into view,
        // which browsers don't do reliably while the page is scrolled quickly
        for (const image of document.images) {
            image.loading = 'eager';
        }

        // Visit the full page, so content that a script loads on scrolling can initialize too
        for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
        window.scrollTo(0, 0);

        // Wait until every image has finished loading (or failed) and is decoded, and for the web fonts
        await Promise.all(Array.from(document.images, async (image) => {
            if (!image.complete) {
                await new Promise((resolve) => {
                    image.addEventListener('load', resolve, { once: true });
                    image.addEventListener('error', resolve, { once: true });
                });
            }
            await image.decode().catch(() => undefined);
        }));
        await document.fonts.ready;
    });
}

/** Snapshot names include the site's host, so baselines of different environments never mix. */
export function snapshotName(target: VisualPage): string {
    const host = new URL(target.url).hostname.replace(/^www\./, '').replaceAll('.', '-');

    return `${host}-${target.name}.png`;
}
