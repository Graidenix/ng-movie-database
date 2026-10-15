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

## 5. Icons: Atlas Icons, inlined as SVG

**Decision:** The app uses [Atlas Icons](https://iconsatlas.com) (ISC license) in the regular (1.5) stroke weight. They are inlined as SVG through one `<app-icon>` component (`src/app/shared/icon/icon.ts`), which only contains the icons the app uses.

**Why not the npm package:** `@vectoricons/atlas-icons` ships only webfonts (about 17 MB), and there's no Angular package. An inline SVG renders during SSR, has no font loading or invisible-text flash, and is styled through `currentColor` and Tailwind size classes.

**Note:** The source `Star` glyph includes an extra inner stroke. Only its outline is kept, so it can be drawn as a solid rating star.

## 6. TypeScript path aliases

**Decision:** Imports across folders use path aliases instead of `../`: `@core/*`, `@features/*`, `@layout/*`, `@shared/*` and `@api/*` (configured in `tsconfig.json`). Files in the same folder still use `./`.

**Exception:** Files inside `api/` use relative imports, because Vercel compiles each function on its own and doesn't resolve tsconfig `paths`. The shared proxy code sits next to the handlers (`api/movies/_lib/`), so no `../` is needed there either.
