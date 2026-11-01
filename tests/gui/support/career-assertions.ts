import { expect } from '@playwright/test';

import type { CareerPage } from '../pages/career-page.ts';

/**
 * Filters positions by city and verifies that the city is selected and exactly
 * the positions offered in that city stay visible (and all others are hidden).
 */
export async function filterAndValidatePositions(careerPage: CareerPage, city: string): Promise<void> {
    const allPositions = await careerPage.getPositions();
    const expectedNames = allPositions
        .filter((position) => position.cities.includes(city))
        .map((position) => position.name);

    expect(allPositions.length, 'there should be some open positions').toBeGreaterThan(0);
    expect(expectedNames.length, `at least one position should be offered in "${city}"`).toBeGreaterThan(0);

    await careerPage.filterByCity(city);

    await expect(careerPage.cityFilterToggle).toHaveText(city);
    await expect(careerPage.visiblePositionNames).toHaveText(expectedNames);
}
