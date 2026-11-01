import type { Locator, Page } from '@playwright/test';

import { dismissIfPresent } from '../support/dismiss-if-present.ts';

export class MoroSystemsHomePage {
    static readonly ORIGIN = 'https://www.morosystems.cz';
    static readonly URL = `${MoroSystemsHomePage.ORIGIN}/`;
    static readonly URL_PATTERN = /^https:\/\/www\.morosystems\.cz\/?(\?.*)?$/;
    static readonly TITLE = 'MoroSystems - smysluplná IT řešení a technologické inovace';

    /** The logo image has no alt text, so the link has no accessible name to find it by. */
    readonly logo: Locator;
    readonly heading: Locator;
    /** "Menu" (burger) button, shown instead of the navigation on narrow screens. */
    readonly menuButton: Locator;
    private readonly mainNavigation: Locator;
    private readonly onlyNecessaryCookiesButton: Locator;

    constructor(private readonly page: Page) {
        const header = page.getByRole('banner');

        this.logo = header.locator('a[href="/"]').first();
        this.heading = page.getByRole('heading', { level: 1 });
        this.mainNavigation = header.getByRole('navigation');
        this.menuButton = this.mainNavigation.getByRole('link', { name: 'Menu', exact: true });
        this.onlyNecessaryCookiesButton = page.getByRole('button', { name: 'Pouze nutné' });
    }

    async open(): Promise<void> {
        await this.page.goto(MoroSystemsHomePage.URL);
        await this.rejectOptionalCookies();
    }

    async rejectOptionalCookies(): Promise<void> {
        await dismissIfPresent(this.onlyNecessaryCookiesButton);
    }

    /** Links of the main navigation the user can see right now. */
    visibleNavigationLinks(): Locator {
        return this.mainNavigation.getByRole('link').filter({ visible: true });
    }

    /**
     * Where "Kariéra" is depends on the screen width: on narrow screens (phones, tablets) it is
     * hidden behind the "Menu" button, on wide ones it is nested in the "O nás" dropdown,
     * and in between it is a top-level menu item.
     */
    async goToCareer(): Promise<void> {
        const visibleCareerLinks = this.navigationLink('Kariéra').filter({ visible: true });

        if (await this.menuButton.isVisible()) {
            await this.menuButton.click();
        } else if (await visibleCareerLinks.count() === 0) {
            await this.navigationLink('O nás').filter({ visible: true }).hover();
        }

        await visibleCareerLinks.first().click();
        await this.page.waitForURL(/\/kariera\/?$/);
    }

    private navigationLink(name: string): Locator {
        return this.mainNavigation.getByRole('link', { name, exact: true });
    }
}
