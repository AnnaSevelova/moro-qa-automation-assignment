import { expect, test } from "./fixtures/fixtures.ts";
import { stubGoogleSearchResults } from "./mocks/google-search.ts";
import { dismissIfPresent } from "./support/dismiss-if-present.ts";
import { CareerPage } from "./pages/career-page.ts";
import { GoogleSearchPage } from "./pages/google-search-page.ts";
import { MoroSystemsHomePage } from "./pages/moro-systems-home-page.ts";

const SEARCH_QUERY = "morosystems";
const SEARCH_RESULTS_URL = `https://www.google.com/search?q=${SEARCH_QUERY}&hl=cs`;

test.describe("Google search page", () => {
    test.beforeEach(async ({ page }) => {
        // The search request is still captured and checked, but answered locally,
        // so no automated query reaches Google Search (see README).
        await stubGoogleSearchResults(page);

        const response = await page.goto(GoogleSearchPage.URL, {
            waitUntil: "domcontentloaded",
        });

        expect(response?.status()).toBe(200);
    });

    test("searches for morosystems and sends the correct search request", async ({
        page,
        googleSearchPage,
    }) => {
        await test.step("Reject cookies if consent dialog appears", async () => {
            const rejectAllButton = page.getByRole("button", {
                name: "Odmítnout vše",
            });

            await dismissIfPresent(rejectAllButton);
            await expect(rejectAllButton).toBeHidden();
        });

        await test.step("Check the Google search page", async () => {
            await expect(page).toHaveTitle("Google");

            await expect(
                page.getByRole("img", { name: "Google" }),
            ).toBeVisible();

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
                        url.hostname === "www.google.com" &&
                        url.pathname === "/search"
                    );
                },
                { timeout: 15000 },
            );

            await googleSearchPage.searchInput.press("Enter");

            const searchRequest = await searchRequestPromise;
            const searchUrl = new URL(searchRequest.url());

            expect(searchRequest.method()).toBe("GET");
            expect(searchUrl.hostname).toBe("www.google.com");
            expect(searchUrl.searchParams.get("q")).toBe(SEARCH_QUERY);
        });

        await test.step("Check the (stubbed) search results page", async () => {
            await expect(page).toHaveURL(/\/search\?/);
            await expect(googleSearchPage.searchInput).toHaveValue(SEARCH_QUERY);
            await expect(
                googleSearchPage.resultLink(MoroSystemsHomePage.TITLE),
            ).toBeVisible();
        });
    });
});

test.describe("Google search results page (mocked)", () => {
    test.beforeEach(async ({ page }) => {
        await stubGoogleSearchResults(page);
    });

    test("shows the MoroSystems website in mocked results", async ({
        page,
        googleSearchPage,
    }) => {
        const response = await page.goto(SEARCH_RESULTS_URL);

        expect(response?.status()).toBe(200);

        const moroSystemsResult = googleSearchPage.resultLink(
            MoroSystemsHomePage.TITLE,
        );

        await test.step("Verify mocked search results", async () => {
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

    test("shows MoroSystems as the first result with sitelinks", async ({
        page,
        googleSearchPage,
    }) => {
        await page.goto(SEARCH_RESULTS_URL);

        await test.step("Verify result count and the first result", async () => {
            // Like on Google, the result count is only shown after opening "Nástroje" (tools)
            await expect(googleSearchPage.resultStats).toBeHidden();
            await expect(googleSearchPage.resultStats).toContainText(
                "Přibližný počet výsledků",
            );
            await expect(
                googleSearchPage.results.getByRole("heading", { level: 3 }).first(),
            ).toHaveText(MoroSystemsHomePage.TITLE);
        });

        await test.step("Sponsored result is shown above, but not counted as a search result", async () => {
            const sponsoredResult = page.getByRole("heading", { name: "MoroSystems Orchestra" });

            await expect(sponsoredResult).toBeVisible();
            await expect(
                googleSearchPage.results.getByRole("heading", { name: "MoroSystems Orchestra" }),
            ).toHaveCount(0);
        });

        await test.step('Open "Kariéra" from the sitelinks', async () => {
            await googleSearchPage.results
                .getByRole("link", { name: "Kariéra", exact: true })
                .click();

            await expect(page).toHaveURL(CareerPage.URL_PATTERN);
        });
    });

    test("shows no results for an unknown query and allows searching again", async ({
        page,
        googleSearchPage,
    }) => {
        const unknownQuery = "neexistujici dotaz 12345";

        await page.goto(
            `https://www.google.com/search?q=${encodeURIComponent(unknownQuery)}&hl=cs`,
        );

        await test.step("Verify the no results message", async () => {
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
test.describe("Google search results page (live)", { tag: "@live" }, () => {
    test("shows MoroSystems in real Google results", async ({
        page,
        googleSearchPage,
    }, testInfo) => {
        await test.step("Navigate directly to Google results", async () => {
            const response = await page.goto(SEARCH_RESULTS_URL, {
                waitUntil: "domcontentloaded",
            });

            console.log("\n[Google diagnostic] Direct navigation");
            console.log(`Browser project: ${testInfo.project.name}`);
            console.log(`HTTP status: ${response?.status() ?? "none"}`);
            console.log(`Final URL path: ${new URL(page.url()).pathname}`);
        });

        await test.step("Inspect live Google results", async () => {
            const currentUrl = new URL(page.url());
            const isCaptcha = currentUrl.pathname.startsWith("/sorry");

            console.log("\n[Google diagnostic] Live results");
            console.log(`CAPTCHA detected: ${isCaptcha}`);
            console.log(`Page title: ${await page.title()}`);

            const resultLinks = page.locator('a[href*="morosystems.cz"]');

            console.log(
                `MoroSystems links found: ${await resultLinks.count()}`,
            );

            await testInfo.attach("google-live-results", {
                body: await page.screenshot({ fullPage: true }),
                contentType: "image/png",
            });

            if (isCaptcha) {
                throw new Error(
                    "Google redirected Playwright to a CAPTCHA page. " +
                        "Live search results could not be verified.",
                );
            }

            await expect(page).toHaveURL(/\/search\?/);
        });

        await test.step("Verify MoroSystems appears in Google results", async () => {
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
