import type { Locator, Page, Response } from '@playwright/test';

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

    /** Opens the Google homepage and rejects optional cookies if the consent dialog appears. */
    async goTo(): Promise<Response | null> {
        const response = await this.page.goto(GoogleSearchPage.URL, { waitUntil: 'domcontentloaded' });
        await dismissIfPresent(this.rejectAllCookiesButton);

        return response;
    }

    /** Opens the results page for a query directly, as a link to a Google search would. */
    async goToResults(query: string): Promise<Response | null> {
        const url = new URL('search', GoogleSearchPage.URL);
        url.searchParams.set('q', query);
        url.searchParams.set('hl', 'cs');

        return this.page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
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
