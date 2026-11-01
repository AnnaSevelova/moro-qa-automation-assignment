import { expect, test } from './fixtures/fixtures.ts';
import { PREFERRED_CITY, SCREENS } from './fixtures/test-data.ts';
import { CareerPage } from './pages/career-page.ts';
import { filterAndValidatePositions } from './support/career-assertions.ts';
import { expectFitsScreenWidth, expectNoHorizontalScroll } from './support/layout-assertions.ts';

/**
 * Responsive design check: the homepage and the "Kariéra" page are usable on phones, tablets and desktops.
 * "Displays correctly" is checked by what a user relies on: nothing overflows the screen sideways,
 * the key content is visible, the navigation adapts (a "Menu" button on narrow screens) and the
 * city filter still works.
 */
for (const screen of SCREENS) {
    const { width, height } = screen.viewport;

    test.describe(`Responsive design on ${screen.name} (${width}x${height})`, () => {
        test.use({ viewport: screen.viewport });

        test.beforeEach(async ({ moroSystemsHomePage }) => {
            await moroSystemsHomePage.goTo();
        });

        test('homepage fits the screen', async ({ page, moroSystemsHomePage }) => {
            await expectNoHorizontalScroll(page);
            await expectFitsScreenWidth(moroSystemsHomePage.logo, page);
            await expectFitsScreenWidth(moroSystemsHomePage.heading, page);
        });

        // Which navigation a screen gets is test data, so each screen size defines only the test that applies
        if (screen.collapsedMenu) {
            test('navigation is collapsed behind the "Menu" button', async ({ page, moroSystemsHomePage }) => {
                await expectFitsScreenWidth(moroSystemsHomePage.menuButton, page);
                await expect(moroSystemsHomePage.visibleNavigationLinks()).toHaveCount(1);
            });
        } else {
            test('navigation is shown directly', async ({ moroSystemsHomePage }) => {
                await expect(moroSystemsHomePage.menuButton).toBeHidden();
                expect(await moroSystemsHomePage.visibleNavigationLinks().count()).toBeGreaterThan(1);
            });
        }

        test('"Kariéra" page fits the screen and the city filter works', async ({
            page,
            moroSystemsHomePage,
            careerPage,
        }) => {
            await test.step('Visit the "Kariéra" page through the navigation', async () => {
                await moroSystemsHomePage.goToCareer();
                await expect(page).toHaveURL(CareerPage.URL_PATTERN);
            });

            await test.step('Page fits the screen', async () => {
                await expectNoHorizontalScroll(page);
                await careerPage.heading.scrollIntoViewIfNeeded();
                await expectFitsScreenWidth(careerPage.heading, page);
                await expectFitsScreenWidth(careerPage.cityFilter, page);
            });

            await test.step(`Filter open positions by "${PREFERRED_CITY}"`, async () => {
                await filterAndValidatePositions(careerPage, PREFERRED_CITY);
                await expectNoHorizontalScroll(page);
            });
        });
    });
}
