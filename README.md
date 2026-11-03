# QA Automation Assignment | MoroSystems

Automated GUI, API, responsive and visual regression tests for the MoroSystems QA automation assignment, built with [Playwright](https://playwright.dev/) and TypeScript.

The project covers two systems:

- **MoroSystems website:** Search for MoroSystems, navigate to **Kariéra**, and filter job openings by city. Additional tests cover responsive layout and visual changes.
- **[Todo API](https://github.com/morosystems/todo-be):** Create, list, update, complete and delete tasks, including negative scenarios and response validation.

GUI tests run across **Chromium, Firefox, WebKit and Microsoft Edge** (when Edge is installed). Tests are integrated with **GitHub Actions**, with HTML reports and failure artifacts.

## Quick start

### Prerequisites

- **Node.js 22.6+** (`.nvmrc` specifies Node 22) and **npm 10+**
- **Optional:** Microsoft Edge for Edge tests; Docker to run visual comparisons against committed Linux baselines

### Install

```bash
nvm use                # If you use nvm
npm install            # Also installs the bundled todo backend
npx playwright install # Installs Chromium, Firefox and WebKit
```

Microsoft Edge is not bundled with Playwright. To include it, install it separately (for example, `npx playwright install msedge`). The Edge project is enabled only when Edge is available.

### Run tests

| Command | Purpose |
| --- | --- |
| `npm run test:gui` | Run the GUI suite across available browser projects (excluding live Google checks) |
| `npm run test:api` | Run the API suite; Playwright starts the backend automatically |
| `npm run test:visual` | Run visual comparisons with local, OS-specific baselines |
| `npm run test:visual:docker` | Compare with the committed Linux baselines (Docker required) |
| `npm run lint` | Check code quality |
| `npm run typecheck` | Run TypeScript checks |
| `npm run test:report` | Open the latest standard HTML test report |
| `npm run test:visual:report` | Open the visual regression report |

For a quick, focused GUI run:

```bash
# Firefox only
npx playwright test --project=gui-firefox --grep-invert @live

# Chromium with a visible browser
npx playwright test --project=gui-chromium --headed --grep-invert @live

# Use a different city for the career filter (default: Brno)
PREFERRED_CITY=Praha npm run test:gui
```

> **Important:** The regular GUI suite uses a local stand-in for Google search results. The optional live Google check (`npm run test:gui:live`) is excluded from normal runs and CI because Google commonly presents CAPTCHAs to automated searches. See [Google search strategy](#google-search-strategy).

## Key implementation decisions

| Decision | Reason |
| --- | --- |
| **Stub Google search results** while checking the actual outgoing Google search request | Avoid CAPTCHA-related failures and unauthorized automated search queries, while still validating the user flow |
| **Use `POST /tasks/{id}` for updates** | The supplied backend does not implement the PUT endpoint requested in the assignment; POST is the documented and working operation |
| **Run visual tests separately** | Changes to the live website could create unrelated failures in routine CI runs; visual comparisons are run intentionally |
| **Isolate API test data** | Tests can execute in parallel without depending on seeded data or one another |
| **Generate API types from OpenAPI** | Keep the test client aligned with the documented API contract and detect contract changes in CI |

## Test coverage

### GUI tests (`tests/gui/`)

The main user journey is:

1. Open the real Google homepage and search for **MoroSystems**.
2. Verify the outgoing request and the locally stubbed search results.
3. Open the **real MoroSystems website**.
4. Navigate to **Kariéra**.
5. Filter available positions by city.

| Test file | Coverage |
| --- | --- |
| `google-search-to-career.spec.ts` | Full journey from Google search to career filtering |
| `google-search.spec.ts` | Google homepage, outgoing request method/query, stubbed result, and optional `@live` results check |
| `career-filter.spec.ts` | Career page navigation and city filtering starting directly on MoroSystems |
| `responsive.spec.ts` | Homepage and career page across four viewport sizes |

The GUI suite supports **Chromium (`gui-chromium`)**, **Firefox (`gui-firefox`)**, **WebKit (`gui-webkit`)** and **Edge (`gui-edge`)**. The optional live Google test runs only in Chromium.

#### Responsive checks

Both pages are tested in each browser at these sizes:

| Device | Viewport |
| --- | --- |
| Phone | 375 × 812 |
| Tablet | 768 × 1024 |
| Laptop | 1280 × 800 |
| Desktop | 1920 × 1080 |

Instead of relying on pixel comparison, these tests verify that:

- The page does not overflow horizontally; key elements fit and remain visible.
- Navigation is collapsed under **Menu** on narrow screens and displayed directly on wider screens.
- Users can reach **Kariéra** through the appropriate navigation and filter positions by city.

Viewport definitions are in `tests/gui/fixtures/test-data.ts`.

**Accessibility finding:** the MoroSystems logo link has no accessible name, because its image has no alt text. Screen readers announce it only as "link", and the tests locate it by its link target instead of its name.

### API tests (`tests/api/`)

The tests run against an **unchanged copy** of the [MoroSystems todo backend](https://github.com/morosystems/todo-be), commit `2cfa7c3`, stored in `apps/todo-be`. It retains its own `package-lock.json` and dependencies.

| Test file | Coverage |
| --- | --- |
| `tasks.spec.ts` | Create tasks; validate structure, defaults, timestamps and unique IDs; special characters; list all/completed tasks; update text; complete/reopen; delete; verify PUT is unsupported |
| `tasks-errors.spec.ts` | Missing/empty text (`422`) and unknown task IDs (`404`) |

**Running the backend:**

```bash
npm run test:api                                # Starts/stops the backend automatically
npm run api:start                               # Start it manually
API_BASE_URL=http://host:port npm run test:api  # Test another backend
```

The default backend address is `http://localhost:8080`, with Swagger UI at `http://localhost:8080/api-docs`. Locally, a backend already running on port 8080 is reused; in CI it never is, so CI always tests a freshly started backend.

API tests run in parallel against a shared backend. Each test creates and cleans up its own tasks through the `createTask` fixture; tests do not assume any particular initial task list or order. Cleanup attempts every registered task and fails on responses other than 200 or 404. `GET /tasks` deliberately takes about three seconds, so listing tests may take longer.

The backend persists data in `apps/todo-be/data/db.json`. An interrupted run can leave changes behind. Restore the file with:

```bash
git checkout -- apps/todo-be/data/db.json
```

### Visual regression tests (`tests/visual/`)

Full-page screenshots of the MoroSystems homepage and **Kariéra** page are compared against baseline images. The screenshot comparison allows `threshold: 0.2` per pixel, with no more than **1% of pixels differing**.

The screenshot helper (`tests/visual/support/stable-page.ts`) renders the pages as users see them, with scripts, photos and background images, and makes them comparable between runs:

- Rejects optional cookies and disables animations and transitions.
- Scrolls through the page so lazy-loaded images load, then waits for fonts and images.
- Removes sections whose content changes (open positions, latest articles and the team carousel) from the layout, so new job openings or articles change neither the screenshot nor the page height.

Everything else is compared, including photos and decorative background images. A change to the website's content or images outside the removed sections still causes a difference to review: either a regression, or a reason to update the baselines.

**Visual test commands:**

| Command | Purpose |
| --- | --- |
| `npm run test:visual` | Compare using local platform baselines |
| `npm run test:visual:update` | Update local baselines |
| `npm run test:visual:docker` | Compare against committed Linux baselines |
| `npm run test:visual:docker:update` | Regenerate Linux baselines |
| `npm run test:visual:report` | Inspect expected, actual and diff images |

Local screenshots can differ between macOS, Windows and Linux because of font rendering. Baselines are kept separately in `tests/visual/visual.spec.ts-snapshots/<platform>/`, named `<host>-<page>-<project>.png`. **Only Linux baselines are committed.** A missing baseline is created on first use but the test fails, preventing unnoticed acceptance.

The Docker comparison uses an image matching the installed Playwright version and `linux/amd64` architecture, consistent with GitHub Actions. The Docker suite runs **Chromium and Firefox**; WebKit is excluded there because it produces broken screenshots on Linux. Emulation can make Docker runs slower on Apple Silicon.

**Visual tests are manual-only in CI.** This prevents changes to the live MoroSystems website from blocking unrelated pull requests. Update baselines only after reviewing the resulting images.

## Google search strategy

The assignment includes finding MoroSystems through Google. In automated runs, however, Google frequently serves a CAPTCHA rather than search results, including in headed browsers. Automated Google search queries without permission are restricted by [Google's spam policies](https://developers.google.com/search/docs/essentials/spam-policies#machine-generated-traffic).

The test therefore verifies the **search interaction on the real Google homepage** while intercepting the results request:

- **Real:** Open Google, handle consent, enter the query and submit the form. Verify the outbound request's method, host and query parameter.
- **Stubbed:** Intercept the search request before it reaches Google and respond with a local results page (`tests/gui/mocks/google-search.ts`). Search suggestions are intercepted too.
- **Real again:** Follow the MoroSystems result to the live company website and complete the career-filtering journey.

The stub includes a search input, tabs, sponsored result, organic results, sitelinks, result count, no-results state and follow-up searches. The HTML template and query-specific results are in `tests/gui/mocks/`; query fixtures are defined in `google-search-data.ts`. Unknown queries return the no-results state. The suggestion endpoint (`GET /complete/s?q=...`) returns an empty list with the expected response prefix, so partially typed queries do not reach Google either.

### Coverage boundary

For ongoing monitoring of MoroSystems' visibility in Google results, I would propose setting up **Google Search Console** with access to the verified site property. Its [search performance reports](https://support.google.com/webmasters/answer/10268906?hl=en) track impressions, clicks, CTR and average position over time. I would use this for search visibility monitoring and Playwright for checking user journeys; Search Console does not validate the browser interaction itself.

The normal suite does not verify Google's actual results, ranking, advertisements, sitelinks or no-results behavior. The Google results portion of the assignment is only partially automated: the submitted search request is real, but its response is a local fixture. Tests of fixture-only ranking and no-results behavior are intentionally omitted.

The optional live check starts directly at the results URL and checks that MoroSystems appears; it does not cover the complete journey from the Google homepage to career filtering. The mocked full journey and the live check provide separate evidence and are not equivalent to a fully live end-to-end test.

### What was verified against real Google?

The stub was compared with a manual search for **MoroSystems** in November 2026:

- Form submission uses `GET https://www.google.com/search` and the `q` parameter. Transient parameters such as `ei`, `sxsrf` and `ved` are deliberately not asserted.
- Test-relevant structure matches: search field (combobox labelled **Najít**), `#search` result container, result links with `<h3>` titles and displayed URLs.
- The MoroSystems result appears first among organic results, with sitelinks for **Kariéra**, **O nás**, **Kontakt** and **Naše řešení**.
- A sponsored **MoroSystems Orchestra** result appears separately above the organic results; the fixture keeps it outside the organic-results container.
- Result order, titles and URLs follow the observed search. Snippets and counts are fixtures; the knowledge panel is intentionally omitted.
- Result assertions use the displayed URL instead of the anchor `href`, because Google may use redirects for signed-out sessions.

### Optional live verification

```bash
npm run test:gui:live
```

This `@live` test queries real Google results and checks that MoroSystems appears. It runs **manually, in Chromium only**, and is excluded from default runs and CI. It can fail when Google displays a CAPTCHA; the failure explicitly reports that live results could not be verified. The project does not attempt CAPTCHA bypasses, fingerprint spoofing, proxies or solving services.

## API contract decisions and findings

### Why updates use POST, not PUT

Although the assignment requests PUT for updates, the supplied backend exposes **`POST /tasks/{id}`** for editing task text. Its OpenAPI description (`/v3/api-docs`) lists POST and DELETE for this route, not PUT.

The suite therefore:

1. Uses the supported POST endpoint for successful updates.
2. Checks that the OpenAPI document does not declare PUT for this route.
3. Verifies that PUT returns `404 Cannot PUT /tasks/{id}` without changing the task.

If PUT is implemented later, the explicit negative check will fail and signal that the update tests should be revisited.

### Findings in the supplied application

| Finding | Test approach |
| --- | --- |
| A numeric `text` value (`{"text":123}`) is accepted even though task text should be a string | Marked with Playwright `test.fail()` as a known issue; an unexpected pass highlights a potential fix |
| Unknown IDs are documented as returning `400`, but the backend returns `404` | Assert the observed `404`; documentation needs correction |
| Task-list endpoints use a one-argument `sort()` callback that does not sort by date | Do not assert undocumented ordering |
| OpenAPI describes `422` errors as JSON, but actual responses are plain text with `text/html` | Assert the real response and content type |

### OpenAPI-generated types

The API client uses [openapi-typescript](https://openapi-ts.dev/) to generate types from `/v3/api-docs`:

```bash
npm run api:generate
```

This saves `tests/api/generated/openapi.json` and produces `tests/api/generated/openapi-types.ts`. Both are committed. This generates API types, not a connector: the HTTP client is handwritten, so the optional connector-codegen challenge is only partially implemented. The client's `Task` type and successful-response (`*Ok`) helpers use these definitions; raw client methods can still send invalid bodies for negative tests. CI regenerates the files and fails if they do not match the committed contract.

The generated types reflect **the published specification**, including its documented discrepancies, while negative tests assert the **actual API responses**. Generated files are excluded from linting.

The project uses TypeScript 6.0. Because `openapi-typescript` declares TypeScript 5 as a peer dependency, `package.json` includes an override allowing it to use the project's compiler for code printing.

## CI and reports

The workflow is defined in `.github/workflows/tests.yml`.

| Trigger | Checks |
| --- | --- |
| Push to `main` | Lint, typecheck, API types, API tests and GUI tests |
| Pull request | Same checks as a push to `main` |
| Manual workflow dispatch | Select individual jobs and GUI browsers; optionally include visual tests |

A manual run is available under **GitHub Actions → Tests → Run workflow**. All jobs except visual tests are selected by default. **Live Google checks never run in CI.**

Additional CI details:

- Uses **Ubuntu 24.04** and Node from `.nvmrc`.
- Runs lint, typecheck, API contract verification and API tests as separate jobs.
- Executes GUI projects independently, so failure in one browser does not cancel the others.
- Pins action versions, uses read-only `contents` permissions and caches npm packages and Playwright browsers.
- Disables dependency install scripts in CI; the backend is installed explicitly from its own lockfile.
- Retries failed GUI and API tests up to twice; passing on retry is reported as **flaky**. Visual tests are never retried, because a visual difference is a result, not flakiness.
- Uploads test artifacts after every run, including successful runs; artifacts are retained for **7 days**.

### View results

```bash
npm run test:report         # Regular GUI/API report
npm run test:visual:report  # Visual report with screenshot diffs
```

Generated output is gitignored and stored under `test-output/`:

- `report/` and `results/`: standard HTML report, screenshots, video and traces of failures.
- `visual-report/` and `visual-results/`: visual test report and expected/actual/diff screenshots.

CI artifacts are named `report-api`, `report-gui-<browser>` or `report-visual`. Download and extract an artifact, then open the report with:

```bash
npx playwright show-report <folder>/report
```

## Project structure

```text
apps/
  todo-be/                       Unchanged backend under test

tests/
  gui/
    *.spec.ts                    GUI scenarios
    pages/                       Page objects
    fixtures/                    Fixtures and test data
    mocks/                       Stubbed Google search results
    support/                     Shared assertions and helpers
  api/
    *.spec.ts                    API scenarios
    clients/                     Typed API client
    generated/                   OpenAPI document and TypeScript types
    fixtures/                    Test data and cleanup
    support/                     Shared assertions
  visual/
    visual.spec.ts               Screenshot comparisons
    pages.ts                     Pages and excluded sections
    support/                     Screenshot stabilization
    visual.spec.ts-snapshots/    Platform-specific baselines

scripts/                         Docker visual tooling and API type generation
test-output/                     Generated reports and artifacts (gitignored)
.github/workflows/               GitHub Actions
playwright.config.ts             GUI/API Playwright configuration
playwright.visual.config.ts      Separate visual test configuration
eslint.config.mjs                Lint rules
```

## Development and maintenance

The codebase uses strict TypeScript checks and ESLint, including `typescript-eslint`, stylistic rules and `eslint-plugin-playwright`. Formatting conventions are **single quotes, semicolons and four-space indentation**. The bundled backend in `apps/` is excluded from linting.

```bash
npm run lint
npm run lint:fix
npm run typecheck
```

Before opening a pull request, run lint, typecheck and the relevant tests. Use a topic branch such as `feature/...`, `fix/...` or `refactor/...`, with commits following `type(scope): summary` (for example, `test(gui): add responsive design check`). Changes are merged into `main` through passing pull requests with merge commits.

After changing the API contract, regenerate and commit the OpenAPI files using `npm run api:generate`. After intentional visual changes, update and **review** the relevant baselines before committing them.
