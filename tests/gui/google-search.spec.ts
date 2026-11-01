import { expect, test } from './fixtures/fixtures.ts';
import { stubGoogleSearchResults } from './mocks/google-search.ts';
import { CareerPage } from './pages/career-page.ts';
import { MoroSystemsHomePage } from './pages/moro-systems-home-page.ts';
import { SEARCH_QUERY } from './fixtures/test-data.ts';

test.describe('Google search page', () => {
    test.beforeEach(async ({ page, googleSearchPage }) => {
        // The search request is still captured and checked, but answered locally,
        // so no automated query reaches Google Search (see README).
        await stubGoogleSearchResults(page);

        const response = await googleSearchPage.goTo();

        expect(response?.status()).toBe(200);
    });

    test('searches for MoroSystems and sends the correct search request', async ({
        page,
        googleSearchPage,
    }) => {
        await test.step('Cookie consent dialog is closed', async () => {
            // goTo() rejects optional cookies when Google asks for consent (it doesn't in every region)
            await expect(googleSearchPage.rejectAllCookiesButton).toBeHidden();
        });

        await test.step('Check the Google search page', async () => {
            await expect(page).toHaveTitle('Google');

            // The logo is not checked: Google replaces it with a Doodle on some days and in some regions
            await expect(googleSearchPage.searchForm).toHaveAttribute('action', /\/search$/);

            await expect(googleSearchPage.searchInput).toBeVisible();

            await expect(googleSearchPage.searchInput).toBeEditable();

            await expect(googleSearchPage.searchInput).toBeEmpty();
        });

        await test.step(`Search for "${SEARCH_QUERY}"`, async () => {
            await googleSearchPage.searchInput.fill(SEARCH_QUERY);

            const searchRequestPromise = page.waitForRequest(
                (request) => {
                    const url = new URL(request.url());

                    return (
                        request.isNavigationRequest() &&
                        url.hostname === 'www.google.com' &&
                        url.pathname === '/search'
                    );
                },
                { timeout: 15000 },
            );

            await googleSearchPage.searchInput.press('Enter');

            const searchRequest = await searchRequestPromise;
            const searchUrl = new URL(searchRequest.url());

            expect(searchRequest.method()).toBe('GET');
            expect(searchUrl.hostname).toBe('www.google.com');
            expect(searchUrl.searchParams.get('q')).toBe(SEARCH_QUERY);
        });

        await test.step('Check the (stubbed) search results page', async () => {
            await expect(page).toHaveURL(/\/search\?/);
            await expect(googleSearchPage.searchInput).toHaveValue(SEARCH_QUERY);
            await expect(
                googleSearchPage.resultLink(MoroSystemsHomePage.TITLE),
            ).toBeVisible();
        });
    });
});

test.describe('Google search results page (mocked)', () => {
    test.beforeEach(async ({ page }) => {
        await stubGoogleSearchResults(page);
    });

    test('shows the MoroSystems website in mocked results', async ({
        page,
        googleSearchPage,
    }) => {
        const response = await googleSearchPage.goToResults(SEARCH_QUERY);

        expect(response?.status()).toBe(200);

        const moroSystemsResult = googleSearchPage.resultLink(
            MoroSystemsHomePage.TITLE,
        );

        await test.step('Verify mocked search results', async () => {
            await expect(page).toHaveURL(/\/search\?/);

            await expect(googleSearchPage.searchInput).toHaveValue(
                SEARCH_QUERY,
            );

            await expect(moroSystemsResult).toBeVisible();

            await expect(moroSystemsResult).toContainText(
                MoroSystemsHomePage.ORIGIN,
            );
        });
    });

    test('shows MoroSystems as the first result with sitelinks', async ({
        page,
        googleSearchPage,
    }) => {
        await googleSearchPage.goToResults(SEARCH_QUERY);

        await test.step('Verify result count and the first result', async () => {
            // Like on Google, the result count is only shown after opening "Nástroje" (tools)
            await expect(googleSearchPage.resultStats).toBeHidden();
            await expect(googleSearchPage.resultStats).toContainText(
                'Přibližný počet výsledků',
            );
            await expect(
                googleSearchPage.results.getByRole('heading', { level: 3 }).first(),
            ).toHaveText(MoroSystemsHomePage.TITLE);
        });

        await test.step('Sponsored result is shown above, but not counted as a search result', async () => {
            const sponsoredResult = page.getByRole('heading', { name: 'MoroSystems Orchestra' });

            await expect(sponsoredResult).toBeVisible();
            await expect(
                googleSearchPage.results.getByRole('heading', { name: 'MoroSystems Orchestra' }),
            ).toHaveCount(0);
        });

        await test.step('Open "Kariéra" from the sitelinks', async () => {
            await googleSearchPage.results
                .getByRole('link', { name: 'Kariéra', exact: true })
                .click();

            await expect(page).toHaveURL(CareerPage.URL_PATTERN);
        });
    });

    test('shows no results for an unknown query and allows searching again', async ({
        page,
        googleSearchPage,
    }) => {
        const unknownQuery = 'neexistujici dotaz 12345';

        await googleSearchPage.goToResults(unknownQuery);

        await test.step('Verify the no results message', async () => {
            await expect(googleSearchPage.results).toContainText(
                `Zadanému vyhledávání - ${unknownQuery} - neodpovídají žádné dokumenty.`,
            );
            await expect(googleSearchPage.resultStats).toBeEmpty();
        });

        await test.step(`Search again for "${SEARCH_QUERY}"`, async () => {
            await googleSearchPage.search(SEARCH_QUERY);

            await expect(googleSearchPage.searchInput).toHaveValue(SEARCH_QUERY);
            await expect(
                googleSearchPage.resultLink(MoroSystemsHomePage.TITLE),
            ).toBeVisible();
        });
    });
});

/**
 * Sends a real automated query to Google Search, which Google's spam policies
 * do not allow without permission and which usually ends on a CAPTCHA page.
 * Tagged @live so it is excluded from the default run, see README.
 */
test.describe('Google search results page (live)', { tag: '@live' }, () => {
    test('shows MoroSystems in real Google results', async ({
        page,
        googleSearchPage,
    }, testInfo) => {
        await test.step('Navigate directly to Google results and record diagnostics', async () => {
            const response = await googleSearchPage.goToResults(SEARCH_QUERY);
            await googleSearchPage.rejectCookiesIfAsked();
            const isCaptcha = new URL(page.url()).pathname.startsWith('/sorry');

            // Diagnostics end up in the HTML report, so a failed live check can be explained afterwards
            await testInfo.attach('google-live-diagnostic', {
                body: [
                    `Browser project: ${testInfo.project.name}`,
                    `HTTP status: ${response?.status() ?? 'none'}`,
                    `Final URL path: ${new URL(page.url()).pathname}`,
                    `CAPTCHA detected: ${isCaptcha}`,
                    `Page title: ${await page.title()}`,
                    `MoroSystems links found: ${await page.locator('a[href*="morosystems.cz"]').count()}`,
                ].join('\n'),
                contentType: 'text/plain',
            });
            await testInfo.attach('google-live-results', {
                body: await page.screenshot({ fullPage: true }),
                contentType: 'image/png',
            });

            expect(
                isCaptcha,
                'Google redirected Playwright to a CAPTCHA page, live search results could not be verified',
            ).toBe(false);
            await expect(page).toHaveURL(/\/search\?/);
        });

        await test.step('Verify MoroSystems appears in Google results', async () => {
            await expect(googleSearchPage.searchInput).toHaveValue(
                SEARCH_QUERY,
            );

            const moroSystemsResult = googleSearchPage.resultLink(
                MoroSystemsHomePage.TITLE,
            );

            await expect(moroSystemsResult).toBeVisible();

            await expect(moroSystemsResult).toContainText(
                MoroSystemsHomePage.ORIGIN,
            );
        });
    });
});
