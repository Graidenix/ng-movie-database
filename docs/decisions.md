# Decisions

## 1. Server-side API proxy to hide the TMDb API key

**Context:** The app calls the TMDb API. If the browser called TMDb directly, the API key would ship in the JS bundle, where anyone could read it.

**Decision:** The browser only calls our own `/api/movies/*` endpoints. These are Vercel Functions in `api/` that add the key and forward the request to TMDb.

- The key comes from the `TMDB_API_KEY` environment variable: `.env` locally (git-ignored), Vercel Environment Variables in production.
- Both TMDb key formats work: a v3 API key (sent as the `api_key` query param) and a v4 read access token (sent as `Authorization: Bearer`).
- The proxy exposes only the endpoints the app needs (popular, search, movie details). Every endpoint validates its params (`page`, `lang`, `query`, `id`), so it can't be used as an open passthrough to TMDb.
- Responses are cached at Vercel's edge (`s-maxage=600`), which reduces TMDb calls.

**Consequences:** The key never reaches the client. Locally, the SSR server mounts the same handlers (see decision 2).

## 2. Angular SSR + Vercel Functions

**Status:** Accepted. Replaces the earlier "static SPA + Vercel Functions" decision.

**Context:** The app needs a server-side proxy to hide the key (see decision 1). It also benefits from server rendering: pages arrive with content already in the HTML, which helps SEO, link previews and first paint.

**Decision:** Render pages with Angular SSR (`@angular/ssr`, hydration enabled), deployed on Vercel. The TMDb proxy stays as standalone Vercel Functions in `api/`, not as Express routes inside the SSR server.

- The SSR server only renders pages. All data goes through `/api/movies/*`, both from the browser and during server rendering.
- HTTP responses fetched during SSR are passed to the browser through Angular's HTTP transfer cache, so the client doesn't request them again during hydration.
- The UI language is stored in a cookie instead of `localStorage`. The server can read the cookie, so it renders the same language the client hydrates with. Without a cookie, the server falls back to the `Accept-Language` header.

**Implementation:**

- **Vercel SSR function.** Vercel has no zero-config support for `@angular/ssr`. `api/ssr.mjs` is a Vercel Function that imports `reqHandler` from the server build (`dist/ng-movie-database/server/server.mjs`). `vercel.json` ships the build with that function (`includeFiles`) and rewrites every non-`/api` path to it. Static assets are served from `dist/ng-movie-database/browser` by the CDN.
- **Express is only the SSR host.** `src/server.ts` renders pages and has no API routes of its own in production.
- **Local development.** Outside Vercel (`ng serve`, or `npm run serve:ssr:ng-movie-database`), the server mounts the same `api/` handlers through a small adapter (`src/server/local-api.ts`) and loads `.env`. The whole app then runs without the Vercel CLI.
- **Allowed hosts.** Angular's SSRF protection only accepts `movie-database.odajiu.eu`, `*.vercel.app` and `localhost` as hosts (`security.allowedHosts` in `angular.json`).
- **Render mode.** Every route uses `RenderMode.Server`, because pages depend on the language cookie and on live data.

**Consequences:** Pages are rendered on the server and stay interactive after hydration. The key stays server-side. The proxy keeps its validation and edge caching. The costs: a server-side render on every request, every SSR data request is an extra HTTP hop to `/api`, and code must be SSR-safe (no direct `window`/`localStorage` access). Hosting depends on Vercel for both the SSR runtime and the functions.

## 3. Runtime i18n with signals (EN / RU)

**Decision:** A small `LanguageService` holds the active language in a signal and exposes the translations as a `computed`. Switching language takes effect instantly, with no reload. The choice is saved in a `lang` cookie so SSR can read it (see decision 2). Without the cookie, the language comes from `Accept-Language` on the server. TMDb content is requested in the same language (`en-US` / `ru-RU`).

**Why not `@angular/localize`:** It produces a separate build per locale, and switching language means reloading the page. That's too heavy for two languages.

## 4. Styling: Tailwind CSS 4 + SCSS

**Decision:** SCSS is the style preprocessor for global and component styles. The Tailwind entry (`src/tailwind.css`) stays plain CSS because Tailwind v4 isn't designed to run through Sass. Design tokens (colors, fonts) are defined in Tailwind's `@theme`, and SCSS uses them as CSS variables.

**Typefaces:** Dela Gothic One for display text: titles, headings and the rating. Onest for body text. Both include Cyrillic, which the RU version needs. Dela Gothic One has a single weight, so display text uses no weight classes, and `font-synthesis: none` prevents faux bold.

## 5. Icons: Atlas Icons, inlined as SVG

**Decision:** The app uses [Atlas Icons](https://iconsatlas.com) (ISC license) in the regular (1.5) stroke weight. They are inlined as SVG through one `<app-icon>` component (`src/app/shared/icon/icon.ts`), which only contains the icons the app uses.

**Why not the npm package:** `@vectoricons/atlas-icons` ships only webfonts (about 17 MB), and there's no Angular package. An inline SVG renders during SSR, has no font loading or invisible-text flash, and is styled through `currentColor` and Tailwind size classes.

**Note:** The source `Star` glyph includes an extra inner stroke. Only its outline is kept, so it can be drawn as a solid rating star.

## 6. TypeScript path aliases

**Decision:** Imports across folders use path aliases instead of `../`: `@core/*`, `@features/*`, `@layout/*`, `@shared/*` and `@api/*` (configured in `tsconfig.json`). Files in the same folder still use `./`.

**Exception:** Files inside `api/` use relative imports, because Vercel compiles each function on its own and doesn't resolve tsconfig `paths`. The shared proxy code sits next to the handlers (`api/movies/_lib/`), so no `../` is needed there either.

## 7. Motion: one cinematic moment per page, CSS only

**Decision:** Three effects, all without an animation library, and all turned off under `prefers-reduced-motion`:

- **Cinematic backdrops.** The home hero shows the backdrop of the first popular movie. The detail page shows the movie's own backdrop. Each backdrop settles in once on load (scale and fade), then drifts slower than the page while scrolling. The drift uses CSS scroll-driven animations; browsers without support show a static backdrop. The header floats over the hero.
- **Poster morph.** The router's View Transitions (`withViewTransitions`) morph the poster from its card into the detail page, and back again. Only the clicked or last-viewed poster gets a `view-transition-name` (`PosterTransition`), so names stay unique. Browsers without support navigate normally.
- **Staggered grid reveal.** Cards rise in a 40 ms wave. The wave restarts for each loaded page and is capped at 12 steps, so it never runs longer than about 1 s.

Only `transform` (`scale`, `translate`) and `opacity` are animated, so nothing causes layout shift.

## 8. Search lives in the header; the home hero is a trending carousel

**Decision:** The search box moves into the header, so it's available on every page.

- **Desktop:** a compact pill that widens while focused or holding a query.
- **Mobile:** a search icon. While it's focused, the search takes the whole header row and the logo and language switcher are hidden. The focus state is two-way bound (`[(focused)]`) between the search and the header.
- **Searching:** results still update as you type. The assignment's Search button sits inside the pill while it's open; Enter and the mobile keyboard's "Search" key do the same.
- **From a detail page:** searching opens the list as a new history entry, so Back returns to the movie.

The home hero is a carousel of up to 6 movies trending this week (`GET /api/movies/trending`, TMDb `/trending/movie/week`). Each slide shows a backdrop, title, rating, year, overview and a "View details" link. The carousel is hidden while a search is active.

It follows the WAI-ARIA carousel pattern:

- **Autoplay** advances every 7 s. The active progress bar's CSS animation is the timer.
- **Controls:** the only visible controls are the progress lines, centered under the slide. Each line picks its slide. The active line pauses and resumes autoplay (WCAG 2.2.2 requires a way to pause), and its bar freezes mid-fill while paused.
- **Pausing:** autoplay also pauses on hover, while focus is inside the carousel, and while the tab is hidden.
- **Reduced motion:** autoplay never starts.
- **Navigation:** arrow keys and swipe on touch screens also move between slides.
- **Inactive slides** are `inert` and hidden from assistive tech. The slide region is announced politely only when autoplay is off.
- **No timer before hydration:** the timer starts only after the page becomes interactive, never during SSR.

**Consequence:** Signal Forms now load with the main bundle, about 15 kB larger gzipped.

## 9. Sticky header

**Decision:** The header is sticky. It is transparent over page heroes and turns into a solid, blurred bar once the page scrolls. From `sm` up, a negative bottom margin lets heroes run underneath it. On phones the header takes its own space, so the backdrop band starts below it and shows in full (see decision 11). `scroll-padding-top` keeps keyboard focus and in-page jumps clear of the bar (WCAG 2.4.11).

## 10. SEO

**Decision:** Every page sets its SEO tags while it renders on the server (`SeoService`), so crawlers and link previews get them without running JavaScript:

- **Basics:** title, meta description (cut at a word boundary, at most 160 characters), robots and a canonical URL. The canonical always points to `https://movie-database.odajiu.eu`.
- **Link previews:** Open Graph and Twitter Card tags. The image is the TMDb backdrop at 1280px.
- **Structured data (JSON-LD):** the home page describes a `WebSite` with a `SearchAction`. Movie pages describe a `Movie`: name, description, poster, release date, genres, runtime and `AggregateRating`.
- **Search results** (`?q=`) are `noindex, follow`. They are thin duplicates of TMDb's own search.
- **Unknown movies** respond with HTTP 404 (through `RESPONSE_INIT`) and `noindex`.
- **`robots.txt`** allows everything except `/api/` and points to the sitemap.
- **`sitemap.xml`** is a Vercel Function (`api/sitemap.ts`, reached through a rewrite in `vercel.json`). It lists the home page plus every movie on this week's trending list and the first three popular pages, and is cached at the edge for a day.
- **Manifest:** `manifest.webmanifest` holds the name, colors, display mode and icons (see decision 12).

**Language:** EN and RU share one URL, and the language comes from a cookie. Crawlers send no cookie, so they get English (from `Accept-Language`), and Russian pages are not indexed separately. This was a deliberate choice: adding `?lang=` URLs with `hreflang` alternates would change that.

## 11. Hero on phones

**Decision:** Backdrops are landscape, but a phone screen is portrait. Below `sm`, the carousel and the movie page show the backdrop as a 16:10 band at the top that fades into the page, with the text underneath, instead of a full-height, heavily cropped image. From `sm` up, the backdrop fills the hero behind the text. Carousel slides share one grid cell, so the carousel takes the height of its tallest slide. On phones each slide starts at the top, so the band never floats down on slides with shorter text.

## 12. App icon

**Decision:** The icon is a film frame with a play button and a rating star, in marquee yellow on ink. It was redrawn as clean vector geometry (`public/favicon.svg`) from a supplied raster sketch, not traced, so it stays sharp and tiny. Every other format is rendered from that SVG:

| File | Used by |
|---|---|
| `favicon.svg` | Modern browsers' tabs |
| `favicon.ico` (16, 32, 48 px, PNG-encoded) | Older browsers, Windows, crawlers that request `/favicon.ico` |
| `apple-touch-icon.png` (180 px, full-bleed) | iOS home screen (iOS rounds the corners) |
| `icons/icon-192.png`, `icons/icon-512.png` | Web app manifest, installed app |
| `icons/icon-maskable-512.png` | Android adaptive icons; the glyph sits inside the 80% safe zone |
