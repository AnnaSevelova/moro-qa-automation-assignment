import type { Locator, Page } from '@playwright/test';

import { dismissIfPresent } from '../support/dismiss-if-present.ts';

export class GoogleSearchPage {
    static readonly URL = 'https://www.google.com/';

    /** The form the search box submits, the structure the search flow relies on. */
    readonly searchForm: Locator;
    readonly searchInput: Locator;
    readonly results: Locator;
    readonly resultStats: Locator;
    private readonly rejectAllCookiesButton: Locator;

    constructor(private readonly page: Page) {
        this.searchInput = page.locator('[name="q"]');
        this.searchForm = page.locator('form').filter({ has: this.searchInput });
        this.results = page.locator('#search');
        this.resultStats = page.locator('#result-stats');
        this.rejectAllCookiesButton = page.getByRole('button', { name: /^(Odmítnout vše|Reject all)$/ });
    }

    async open(): Promise<void> {
        await this.page.goto(GoogleSearchPage.URL);
        await dismissIfPresent(this.rejectAllCookiesButton);
    }

    async search(query: string): Promise<void> {
        await this.searchInput.fill(query);
        await this.searchInput.press('Enter');
        await this.page.waitForURL(
            (url) => url.pathname === '/search' && url.searchParams.get('q') === query,
        );
    }

    resultLink(title: string): Locator {
        return this.results
            .getByRole('link')
            .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) })
            .first();
    }
}
