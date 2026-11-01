import type { Page } from '@playwright/test';

import type { VisualPage } from '../pages.ts';

/** Only what the layout is made of is loaded; scripts (including the cookie banner), media and tracking are not. */
const LOADED_RESOURCE_TYPES = new Set(['document', 'stylesheet', 'font', 'image']);

/**
 * Opens a page in a state that looks the same on every run: no scripts, no animations or scrollbars,
 * images and background images hidden (they are photos that change), changing sections removed.
 */
export async function openStablePage(page: Page, target: VisualPage): Promise<void> {
    await page.route('**/*', (route) => (
        LOADED_RESOURCE_TYPES.has(route.request().resourceType()) ? route.continue() : route.abort()
    ));

    // With scripts blocked, the load event already covers HTML, CSS, fonts and images; fonts are checked explicitly
    await page.goto(target.url);
    await page.evaluate(async () => {
        await document.fonts.ready;
    });

    await page.addStyleTag({
        content: `
            *, *::before, *::after { animation: none !important; transition: none !important; }
            *, *::before, *::after { background-image: none !important; }
            img, video, picture, svg image { opacity: 0 !important; }
            ::-webkit-scrollbar { display: none !important; }
            * { scrollbar-width: none !important; }
            ${target.hiddenSections.join(', ')} { display: none !important; }
        `,
    });
}

/** Snapshot names include the site's host, so baselines of different environments never mix. */
export function snapshotName(target: VisualPage): string {
    const host = new URL(target.url).hostname.replace(/^www\./, '').replaceAll('.', '-');

    return `${host}-${target.name}.png`;
}
