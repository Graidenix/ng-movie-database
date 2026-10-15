# Review findings

Reviewed `docs/assignment.md` against the current source code, including uncommitted changes.

The core assignment requirements are implemented: popular movies, dynamic search, clearing back to popular results, cards with overviews, routed details, loading/error states, signals, standalone components, and Tailwind.

## Issues

- [ ] **High — Normalize repeated search parameters.** Opening `/?q=alien&q=matrix` produces an array, but the search and list components assume a string and call `.trim()`, causing runtime errors. Angular's URL parser was confirmed to return an array for this URL. Normalize URL inputs before using them. References: [movie-search.ts](../src/app/features/movies/movie-search.ts), [movie-list-page.ts](../src/app/features/movies/movie-list-page.ts).

- [ ] **Medium — Prevent stale trending responses from overwriting the selected language.** Trending requests are neither cancelled nor checked before updating state. An English request completing after a newer Russian request can leave English carousel content under Russian UI; the cache key already says Russian, preventing a corrective fetch. Cancel previous requests or reject stale responses. Reference: [movie.service.ts](../src/app/core/movies/movie.service.ts), `getTrendingMovies()`.

- [ ] **Medium — Validate search length in the client.** The API rejects queries longer than 100 characters, but the search form has no matching validation. Users see a generic server error, and Retry repeats the invalid request. Validate both typed input and URL-provided queries, with an actionable message. References: [movie-search.ts](../src/app/features/movies/movie-search.ts), [search.ts](../api/movies/search.ts).

- [ ] **Medium — Make carousel height accommodate content.** Every slide is absolutely positioned, so its content cannot increase the carousel's height. The container uses a viewport-based minimum height and the host hides overflow. Long titles, landscape phones, and enlarged text can push content beneath controls or clip it. Let the active slide participate in layout and verify narrow viewports and 200% zoom. Reference: [hero-carousel.ts](../src/app/features/movies/hero-carousel.ts).

- [ ] **Medium — Preserve keyboard focus during carousel navigation.** Arrow keys work from the active slide's details link. Changing slides makes that focused link `inert`, without explicitly moving focus somewhere usable. Handle focus when navigation hides the focused slide. Reference: [hero-carousel.ts](../src/app/features/movies/hero-carousel.ts).

- [ ] **Medium — Add or verify proxy abuse controls.** The API key stays server-side and upstream paths are constrained, but arbitrary search queries can generate uncached upstream calls. No application-level rate limiting is implemented in the repository, and edge caching alone does not prevent quota or function-cost abuse. Add deployment-level rate limits if they are not configured externally. Reference: [tmdb.ts](../api/movies/_lib/tmdb.ts), `proxyTmdb()`.

- [ ] **Medium — Bound upstream request duration.** TMDb requests have no explicit timeout. A stalled request holds the API request, and potentially SSR, until platform or network limits intervene. Add a bounded timeout and distinguish timeout/rate-limit failures where useful. Reference: [tmdb.ts](../api/movies/_lib/tmdb.ts), `proxyTmdb()`.

- [ ] **Low — Enable strict Angular template checking.** TypeScript strict mode is enabled, but `strictTemplates` is missing. Enable it to catch more template binding and nullability errors during builds. Reference: [tsconfig.json](../tsconfig.json).

## Testing gaps

The existing suite has no search, list-page, detail-page, API-handler, SSR/hydration, or AXE integration tests. Prioritize meaningful coverage for the following behaviors:

- [ ] Repeated search query parameters are normalized without runtime errors.
- [ ] Rapid language changes cannot display stale trending responses.
- [ ] Clearing search restores popular movies.
- [ ] Pagination failures can be retried without losing or duplicating results.
- [ ] Mobile search interaction works with touch and keyboard input.
- [ ] Carousel keyboard navigation preserves usable focus.
- [ ] Carousel content remains usable at narrow viewports and 200% zoom.
- [ ] API handlers validate inputs and handle upstream failures and timeouts.
- [ ] SSR and hydration preserve language and reuse transferred HTTP responses.
- [ ] Representative pages and states pass browser-based AXE checks, with manual keyboard and accessibility verification.
- [ ] Verify deployed Vercel behavior and live TMDb integration.

## Validation at review time

- All 16 existing unit tests passed.
- The production build passed after rerunning outside the sandbox; the initial sandboxed attempt aborted without diagnostics.
- Browser accessibility, deployed Vercel behavior, and live TMDb integration were not verified.
