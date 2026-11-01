import { test as base } from '@playwright/test';

import { CareerPage } from '../pages/career-page.ts';
import { GoogleSearchPage } from '../pages/google-search-page.ts';
import { MoroSystemsHomePage } from '../pages/moro-systems-home-page.ts';

type PageObjects = {
    googleSearchPage: GoogleSearchPage;
    moroSystemsHomePage: MoroSystemsHomePage;
    careerPage: CareerPage;
};

export const test = base.extend<PageObjects>({
    googleSearchPage: async ({ page }, use) => use(new GoogleSearchPage(page)),
    moroSystemsHomePage: async ({ page }, use) =>
        use(new MoroSystemsHomePage(page)),
    careerPage: async ({ page }, use) => use(new CareerPage(page)),
});

export { expect } from '@playwright/test';
