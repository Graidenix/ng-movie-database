# Review findings

Reviewed `docs/assignment.md` against the current source code, including uncommitted changes.

The core assignment requirements are implemented: popular movies, dynamic search, clearing back to popular results, cards with overviews, routed details, loading/error states, signals, standalone components, and Tailwind.

## Issues

- [x] **High — Normalize repeated search parameters.** Opening `/?q=alien&q=matrix` produces an array, but the search and list components assume a string and call `.trim()`, causing runtime errors. Angular's URL parser was confirmed to return an array for this URL. Normalize URL inputs before using them. References: [movie-search.ts](../src/app/features/movies/movie-search.ts), [movie-list-page.ts](../src/app/features/movies/movie-list-page.ts).
  Fixed: `firstQueryParam()` (`src/app/shared/query-param.ts`) normalizes `q` in the list page's input transform and in the search component; the first value wins.

- [x] **Medium — Prevent stale trending responses from overwriting the selected language.** Trending requests are neither cancelled nor checked before updating state. An English request completing after a newer Russian request can leave English carousel content under Russian UI; the cache key already says Russian, preventing a corrective fetch. Cancel previous requests or reject stale responses. Reference: [movie.service.ts](../src/app/core/movies/movie.service.ts), `getTrendingMovies()`.
  Fixed: a new trending request cancels the previous one, and a response is dropped unless its language is still the selected one.

- [x] **Medium — Validate search length in the client.** The API rejects queries longer than 100 characters, but the search form has no matching validation. Users see a generic server error, and Retry repeats the invalid request. Validate both typed input and URL-provided queries, with an actionable message. References: [movie-search.ts](../src/app/features/movies/movie-search.ts), [search.ts](../api/movies/search.ts).
  Fixed: the limit lives in `api/movies/_lib/limits.ts` and is shared by the API and the app. The search field has a Signal Forms `maxLength` validator, which also sets the native `maxlength`, so typing can't exceed it. A longer query from the URL shows an inline message under the field and is never sent. The list explains the limit and offers popular movies instead of Retry.

- [x] **Medium — Make carousel height accommodate content.** Every slide is absolutely positioned, so its content cannot increase the carousel's height. The container uses a viewport-based minimum height and the host hides overflow. Long titles, landscape phones, and enlarged text can push content beneath controls or clip it. Let the active slide participate in layout and verify narrow viewports and 200% zoom. Reference: [hero-carousel.ts](../src/app/features/movies/hero-carousel.ts).
  Fixed: slides were already moved to a shared grid cell, so they take part in layout and the carousel grows to its tallest slide. The host no longer clips overflow; backdrops clip themselves.

- [x] **Medium — Preserve keyboard focus during carousel navigation.** Arrow keys work from the active slide's details link. Changing slides makes that focused link `inert`, without explicitly moving focus somewhere usable. Handle focus when navigation hides the focused slide. Reference: [hero-carousel.ts](../src/app/features/movies/hero-carousel.ts).
  Fixed: when navigation hides the slide that holds focus, focus moves to the new slide's details link.

- [x] **Medium — Add or verify proxy abuse controls.** The API key stays server-side and upstream paths are constrained, but arbitrary search queries can generate uncached upstream calls. No application-level rate limiting is implemented in the repository, and edge caching alone does not prevent quota or function-cost abuse. Add deployment-level rate limits if they are not configured externally. Reference: [tmdb.ts](../api/movies/_lib/tmdb.ts), `proxyTmdb()`.
  Fixed in code, with one setting still needed in Vercel: every API handler goes through a per-IP fixed-window limit (60 requests a minute per function instance) that returns 429 with `Retry-After`. The app's own SSR calls carry a server-only `INTERNAL_API_TOKEN` and are exempt. Because function instances don't share memory, the deployment also needs a Vercel Firewall rate-limit rule on `/api/*` (decision 13).

- [x] **Medium — Bound upstream request duration.** TMDb requests have no explicit timeout. A stalled request holds the API request, and potentially SSR, until platform or network limits intervene. Add a bounded timeout and distinguish timeout/rate-limit failures where useful. Reference: [tmdb.ts](../api/movies/_lib/tmdb.ts), `proxyTmdb()`.
  Fixed: TMDb calls time out after 8 s and return 504. A TMDb 429 is passed through with its `Retry-After`, and the app shows a "too many requests" message.

- [x] **Low — Enable strict Angular template checking.** TypeScript strict mode is enabled, but `strictTemplates` is missing. Enable it to catch more template binding and nullability errors during builds. Reference: [tsconfig.json](../tsconfig.json).
  Fixed: `strictTemplates` is on; the build passed with no new template errors.

## Testing gaps

The existing suite has no search, list-page, detail-page, API-handler, SSR/hydration, or AXE integration tests. Prioritize meaningful coverage for the following behaviors:

- [x] Repeated search query parameters are normalized without runtime errors. Covered by `query-param.spec.ts`, `movie-list-page.spec.ts`, `movie-search.spec.ts`, `e2e/ssr.test.mjs`.
- [x] Rapid language changes cannot display stale trending responses. Covered by `movie.service.spec.ts`.
- [x] Clearing search restores popular movies. Covered by `movie-list-page.spec.ts`, `movie.service.spec.ts`.
- [x] Pagination failures can be retried without losing or duplicating results. Covered by `movie.service.spec.ts`.
- [x] Mobile search interaction works with touch and keyboard input. Covered by `movie-search.spec.ts` (debounced typing, Enter/Search key, keyboard closes, history entry) and `app.spec.ts` (search takes the header row). Real touch devices still need a manual check.
- [x] Carousel keyboard navigation preserves usable focus. Covered by `hero-carousel.spec.ts`.
- [ ] Carousel content remains usable at narrow viewports and 200% zoom. The layout fix is in, but it hasn't been checked in a real browser yet (jsdom has no layout).
- [x] API handlers validate inputs and handle upstream failures and timeouts. Covered by `src/server/api.spec.ts` (validation, 404/429/502/504, timeout signal, rate limit, SSR exemption).
- [x] SSR and hydration preserve language and reuse transferred HTTP responses. Covered by `e2e/ssr.test.mjs` (`npm run test:ssr`): cookie and `Accept-Language` language, `renderedLanguage` and API responses in the transfer state, repeated `q`, 404 status, structured data.
- [ ] Representative pages and states pass browser-based AXE checks, with manual keyboard and accessibility verification. Partly done: `e2e/ssr.test.mjs` runs axe-core on the server-rendered home, search, details and 404 pages, and none has violations. That run uses jsdom, so color contrast and focus visibility still need a browser run, and keyboard and screen-reader checks are still manual.
- [ ] Verify deployed Vercel behavior and live TMDb integration. Live TMDb was checked locally against the production build. The Vercel deployment hasn't been tested yet.

## Validation at review time

- All 16 existing unit tests passed.
- The production build passed after rerunning outside the sandbox; the initial sandboxed attempt aborted without diagnostics.
- Browser accessibility, deployed Vercel behavior, and live TMDb integration were not verified.

## Fix pass

All 8 issues are fixed. Validation after the fixes:

- **Unit tests:** 40 pass (`ng test`).
- **SSR integration and axe tests:** 10 pass (`npm run test:ssr`).
- **Production build:** passes with `strictTemplates` on.

Still open: browser-based contrast and zoom checks, manual keyboard and screen-reader checks, the Vercel Firewall rule, and a real Vercel deploy.
