import type { Locator, Page } from '@playwright/test';

export type Position = {
    name: string;
    cities: string[];
};

export class CareerPage {
    static readonly URL_PATTERN = /\/kariera\/?$/;

    readonly heading: Locator;
    readonly positions: Locator;
    readonly visiblePositionNames: Locator;
    /*
     * The city filter is a custom select without accessible roles to locate it by: its options are radio
     * buttons hidden from the accessibility tree, and the toggle link's name changes to the selected city.
     */
    readonly cityFilter: Locator;
    /** Shows the selected city, "Všechna města" when no city is selected. */
    readonly cityFilterToggle: Locator;

    constructor(page: Page) {
        const positionsSection = page.locator('#pozice');

        this.heading = positionsSection.getByRole('heading', { name: 'Koho hledáme' });
        this.positions = positionsSection.getByRole('listitem');
        this.visiblePositionNames = this.positions.filter({ visible: true }).locator('.c-positions__name');
        this.cityFilter = positionsSection.locator('.inp-custom-select');
        this.cityFilterToggle = this.cityFilter.locator('.inp-custom-select__select');
    }

    /** Reads all positions (including currently hidden ones) with the cities they are offered in. */
    async getPositions(): Promise<Position[]> {
        return this.positions.evaluateAll((items) => items.map((item) => ({
            name: item.querySelector('.c-positions__name')?.textContent?.trim() ?? '',
            cities: (item.querySelector('.c-positions__info > span')?.textContent ?? '')
                .split(',')
                .map((city) => city.trim())
                .filter(Boolean),
        })));
    }

    async filterByCity(city: string): Promise<void> {
        await this.cityFilterToggle.click();
        await this.cityFilter.locator('label').getByText(city, { exact: true }).click();
    }
}
