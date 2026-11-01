export type VisualPage = {
    /** Used in the snapshot file name. */
    name: string;
    url: string;
    /**
     * Sections whose content changes on the live website (job openings, articles, the team carousel).
     * They are removed from the layout before the screenshot, so they change neither the image nor the
     * page height; the rest of the page is compared.
     */
    hiddenSections: string[];
};

export const VISUAL_PAGES: VisualPage[] = [
    {
        name: 'home',
        url: 'https://www.morosystems.cz/',
        hiddenSections: ['.c-team', '.c-related-posts'],
    },
    {
        name: 'kariera',
        url: 'https://www.morosystems.cz/kariera/',
        hiddenSections: ['.c-team', '.c-positions__wrap'],
    },
];
