import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Page } from '@playwright/test';

import { SEARCH_RESPONSES, type Ad, type SearchResult } from './google-search-data.ts';

const RESULTS_PAGE_PATH = path.join(import.meta.dirname, 'google-search-results.html');

const isGoogleHost = (url: URL): boolean => /^(www\.)?google\.[a-z.]+$/.test(url.hostname);

const isGoogleSearchUrl = (url: URL): boolean => isGoogleHost(url) && url.pathname === '/search';

/** Search suggestions Google fetches while the user types into the search box, e.g. /complete/s?q=Moro */
const isGoogleSuggestUrl = (url: URL): boolean => isGoogleHost(url) && url.pathname.startsWith('/complete/');

/**
 * An empty suggestion list in Google's format: JSON behind the ")]}'" prefix Google uses
 * against JSON hijacking (`[suggestions, metadata]`).
 */
const EMPTY_SUGGESTIONS = ')]}\'\n[[],{}]';

const escapeHtml = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll('\'', '&#39;');

const normalizeQuery = (query: string): string => query.trim().toLowerCase();

const renderResult = (result: SearchResult): string => {
    const sitelinks = result.sitelinks?.length
        ? `<ul class="sitelinks" aria-label="Odkazy webu ${escapeHtml(result.siteName)}">
            ${result.sitelinks.map((link) => `<li><a href="${escapeHtml(link.url)}"><h3>${escapeHtml(link.title)}</h3></a></li>`).join('')}
        </ul>`
        : '';

    return `<div class="result">
        <a href="${escapeHtml(result.url)}">
            <h3>${escapeHtml(result.title)}</h3>
            <div class="result-site">
                <span>${escapeHtml(result.siteName)}</span>
                <cite>${escapeHtml(result.displayedUrl)}</cite>
            </div>
        </a>
        <p class="result-snippet">${escapeHtml(result.snippet)}</p>
        ${sitelinks}
    </div>`;
};

const renderAds = (ads: Ad[]): string =>
    `<div id="tads" class="ads" aria-label="Reklamy">
        <h2 class="ads-label">Sponzorovaný výsledek</h2>
        ${ads.map((ad) => `<div class="result">
            <a href="${escapeHtml(ad.url)}">
                <h3>${escapeHtml(ad.title)}</h3>
                <div class="result-site"><cite>${escapeHtml(ad.displayedUrl)}</cite></div>
            </a>
            <p class="result-snippet">${escapeHtml(ad.snippet)}</p>
        </div>`).join('')}
    </div>`;

const renderNoResults = (query: string): string =>
    `<p class="no-results">Zadanému vyhledávání - <b>${escapeHtml(query)}</b> - neodpovídají žádné dokumenty.</p>`;

/** Fills the template placeholders in a single pass, so inserted content is never re-processed. */
const fillTemplate = (template: string, values: Record<string, string>): string =>
    template.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) => values[key] ?? placeholder);

function renderSearchResultsPage(template: string, query: string): string {
    const response = SEARCH_RESPONSES[normalizeQuery(query)];
    const resultStats = response
        ? `Přibližný počet výsledků: ${response.totalResults.toLocaleString('cs-CZ')}`
        : '';

    return fillTemplate(template, {
        query: escapeHtml(query),
        encodedQuery: escapeHtml(encodeURIComponent(query)),
        ads: response?.ads?.length ? renderAds(response.ads) : '',
        resultStats,
        results: response ? response.results.map(renderResult).join('') : renderNoResults(query),
    });
}

/**
 * Serves a local stand-in instead of Google's search results page.
 * Automated queries to Google Search are not allowed and end on a CAPTCHA page,
 * so the request is answered locally; the GUI flow around it (typing, submitting,
 * picking the right result, navigating away) still runs in the real browser.
 * The search suggestions Google requests while typing are answered locally (empty) too,
 * so no query typed by a test reaches Google.
 */
export async function stubGoogleSearchResults(page: Page): Promise<void> {
    const template = await readFile(RESULTS_PAGE_PATH, 'utf8');

    await page.route(isGoogleSuggestUrl, (route) => route.fulfill({
        contentType: 'application/json; charset=utf-8',
        body: EMPTY_SUGGESTIONS,
    }));

    await page.route(isGoogleSearchUrl, async (route) => {
        if (!route.request().isNavigationRequest()) {
            await route.fallback();
            return;
        }

        const query = new URL(route.request().url()).searchParams.get('q') ?? '';
        await route.fulfill({
            contentType: 'text/html; charset=utf-8',
            body: renderSearchResultsPage(template, query),
        });
    });
}
