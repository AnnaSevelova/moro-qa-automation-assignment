export type Sitelink = {
    title: string;
    url: string;
};

export type SearchResult = {
    title: string;
    url: string;
    siteName: string;
    /** URL as Google displays it under the title, e.g. "https://www.morosystems.cz › kariera" */
    displayedUrl: string;
    snippet: string;
    sitelinks?: Sitelink[];
};

/** Sponsored result, shown above the search results and outside of them (like Google's "Sponzorovaný výsledek"). */
export type Ad = {
    title: string;
    url: string;
    displayedUrl: string;
    snippet: string;
};

export type SearchResponse = {
    totalResults: number;
    ads?: Ad[];
    results: SearchResult[];
};

/**
 * Results served by the Google search stub, keyed by normalized query (trimmed, lower case).
 * Titles, URLs, sitelinks and order follow a real search for "MoroSystems" (checked manually in a browser,
 * November 2026); the snippets and the result count are test data.
 * Queries that are not listed here get the "no results" page.
 */
export const SEARCH_RESPONSES: Record<string, SearchResponse> = {
    morosystems: {
        totalResults: 161,
        ads: [
            {
                title: 'MoroSystems Orchestra',
                url: 'https://orchestra.morosystems.cz/',
                displayedUrl: 'https://orchestra.morosystems.cz',
                snippet: 'Agilní transformace a podpora agilního řízení s nástroji Jira a Confluence.',
            },
        ],
        results: [
            {
                title: 'MoroSystems - smysluplná IT řešení a technologické inovace',
                url: 'https://www.morosystems.cz/',
                siteName: 'morosystems.cz',
                displayedUrl: 'https://www.morosystems.cz',
                snippet: 'Propojujeme expertní týmové práce, technologií a know-how. Pomáháme firmám '
                    + 'digitalizovat složité procesy a zavádět technologické inovace.',
                sitelinks: [
                    { title: 'Kariéra', url: 'https://www.morosystems.cz/kariera/' },
                    { title: 'O nás', url: 'https://www.morosystems.cz/o-nas/' },
                    { title: 'Kontakt', url: 'https://www.morosystems.cz/kontakt/' },
                    { title: 'Naše řešení', url: 'https://www.morosystems.cz/nase-reseni/' },
                ],
            },
            {
                title: 'MoroSystems – Wikipedie',
                url: 'https://cs.wikipedia.org/wiki/Moro_Systems',
                siteName: 'Wikipedie',
                displayedUrl: 'https://cs.wikipedia.org › wiki › Moro_Systems',
                snippet: 'MoroSystems je česká softwarová společnost se sídlem v Brně, '
                    + 'která se zabývá vývojem softwaru a IT konzultacemi.',
            },
            {
                title: 'MoroSystems – Buďte v dobré společnosti',
                url: 'https://www.cocuma.cz/company/morosystems/',
                siteName: 'Cocuma',
                displayedUrl: 'https://www.cocuma.cz › company › morosystems',
                snippet: 'Firemní profil MoroSystems: kultura, benefity a otevřené pozice.',
            },
            {
                title: 'MoroSystems',
                url: 'https://cz.linkedin.com/company/morosystems',
                siteName: 'LinkedIn',
                displayedUrl: 'https://cz.linkedin.com › company › morosystems',
                snippet: 'MoroSystems | Sledující na LinkedIn. Software na míru, IT konzultace a inovace.',
            },
            {
                title: 'About us',
                url: 'https://www.morosystems.com/about-us/',
                siteName: 'morosystems.com',
                displayedUrl: 'https://www.morosystems.com › ...',
                snippet: 'Who we are and how we deliver meaningful software and technology innovations.',
            },
            {
                title: 'MoroSystems',
                url: 'https://www.facebook.com/MoroSystems/',
                siteName: 'Facebook',
                displayedUrl: 'https://www.facebook.com › ... › MoroSystems',
                snippet: 'MoroSystems na Facebooku: novinky, akce a život ve firmě.',
            },
            {
                title: 'MoroSystems - očima zaměstnanců',
                url: 'https://www.atmoskop.cz/nazory-na-zamestnavatele/75505-morosystems',
                siteName: 'Atmoskop',
                displayedUrl: 'https://www.atmoskop.cz › 75505-morosystems',
                snippet: 'Hodnocení zaměstnavatele MoroSystems od současných a bývalých zaměstnanců.',
            },
        ],
    },
};
