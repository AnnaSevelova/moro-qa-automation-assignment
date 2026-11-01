import { expect, test } from "./fixtures/fixtures.ts";
import { CareerPage } from "./pages/career-page.ts";
import { filterAndValidatePositions } from "./support/career-assertions.ts";
import { PREFERRED_CITY } from "./fixtures/test-data.ts";

/**
 * Covers the MoroSystems part of the scenario independently of Google,
 * which tends to block automated browsers with a CAPTCHA.
 */
test.describe("MoroSystems career page", () => {
    test.beforeEach(async ({ moroSystemsHomePage }) => {
        await moroSystemsHomePage.open();
    });

    test('navigates from homepage to "Kariéra" and filters open positions by city', async ({
        page,
        moroSystemsHomePage,
        careerPage,
    }) => {
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
