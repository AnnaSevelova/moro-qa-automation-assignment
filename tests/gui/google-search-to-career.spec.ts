import { expect, test } from "./fixtures/fixtures.ts";
import { stubGoogleSearchResults } from "./mocks/google-search.ts";
import { CareerPage } from "./pages/career-page.ts";
import { MoroSystemsHomePage } from "./pages/moro-systems-home-page.ts";
import { filterAndValidatePositions } from "./support/career-assertions.ts";
import { PREFERRED_CITY, SEARCH_QUERY } from "./fixtures/test-data.ts";

test.describe("Google search to MoroSystems career", () => {
    // Google blocks automated browsers with a CAPTCHA, so its results page is served from a local snapshot.
    test.beforeEach(async ({ page }) => {
        await stubGoogleSearchResults(page);
    });

    test("finds MoroSystems on Google and filters open positions by city", async ({
        page,
        googleSearchPage,
        moroSystemsHomePage,
        careerPage,
    }) => {
        await test.step("Navigate to Google", async () => {
            await googleSearchPage.open();
            await expect(googleSearchPage.searchInput).toBeVisible();
        });

        await test.step(`Search for "${SEARCH_QUERY}"`, async () => {
            await googleSearchPage.search(SEARCH_QUERY);
        });

        const moroSystemsResult = googleSearchPage.resultLink(
            MoroSystemsHomePage.TITLE,
        );

        await test.step("Validate search results page and MoroSystems link", async () => {
            expect(new URL(page.url()).searchParams.get("q")).toBe(SEARCH_QUERY);
            await expect(googleSearchPage.searchInput).toHaveValue(SEARCH_QUERY);
            await expect(googleSearchPage.results).toBeVisible();
            await expect(moroSystemsResult).toBeVisible();
            // live Google may link through a redirect (e.g. /url?q=...) instead of the website directly,
            // so the displayed result URL is validated instead of href
            await expect(moroSystemsResult).toContainText(
                MoroSystemsHomePage.ORIGIN,
            );
        });

        await test.step("Navigate to MoroSystems website", async () => {
            await moroSystemsResult.click();
            await expect(page).toHaveURL(MoroSystemsHomePage.URL_PATTERN);
            await expect(page).toHaveTitle(MoroSystemsHomePage.TITLE);
            await moroSystemsHomePage.rejectOptionalCookies();
        });

        await test.step('Visit the "Kariéra" page', async () => {
            await moroSystemsHomePage.goToCareer();
            await expect(page).toHaveURL(CareerPage.URL_PATTERN);
            await expect(careerPage.heading).toBeVisible();
        });

        await test.step(`Filter open positions by "${PREFERRED_CITY}"`, async () => {
            await filterAndValidatePositions(careerPage, PREFERRED_CITY);
        });
    });
});
