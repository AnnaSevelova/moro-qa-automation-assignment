export const SEARCH_QUERY = 'MoroSystems';

/** City used for filtering open positions, can be overridden via PREFERRED_CITY env variable. */
export const PREFERRED_CITY = process.env.PREFERRED_CITY ?? 'Brno';

/** Screen sizes for the responsive design check (CSS pixels). */
export const SCREENS = [
    { name: 'phone', viewport: { width: 375, height: 812 }, collapsedMenu: true },
    { name: 'tablet', viewport: { width: 768, height: 1024 }, collapsedMenu: true },
    { name: 'laptop', viewport: { width: 1280, height: 800 }, collapsedMenu: false },
    { name: 'desktop', viewport: { width: 1920, height: 1080 }, collapsedMenu: false },
] as const;
