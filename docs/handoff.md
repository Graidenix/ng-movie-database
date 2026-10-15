# Handoff

Context for whoever picks this up next. Details live in [decisions.md](decisions.md), [findings.md](findings.md) and the [README](../README.md); this file is the short version.

## What this is

A test assignment ([assignment.md](assignment.md), in Russian): an Angular app that lists and searches movies from TMDb, with a detail page. It will be hosted on Vercel at `movie-database.odajiu.eu`.

## Stack

- Angular 22: standalone components, signals, Signal Forms, `@Service()`, zoneless.
- SSR with hydration via `@angular/ssr`. Every route uses `RenderMode.Server`; nothing is prerendered.
- Tailwind CSS 4, plus SCSS for global styles. The Tailwind entry `src/tailwind.css` stays plain CSS on purpose.
- Fonts: Dela Gothic One for display text, Onest for body text. Both include Cyrillic.
- Icons: Atlas Icons, inlined in `shared/icon`. The app logo and favicon are custom (`shared/logo`, `public/favicon.svg`).
- Tests: Vitest through `ng test`, plus `node --test` SSR and axe tests in `e2e/`.

## Architecture

```
browser ──> /api/movies/*  (Vercel Functions in api/, TMDb key server-side) ──> api.themoviedb.org
SSR     ──> same handlers in-process (InProcessApiBackend replaces HttpBackend on the server)
Vercel: /api/* -> functions; /sitemap.xml -> api/sitemap.ts; everything else -> api/ssr.mjs
        (imports reqHandler from the Angular server build)
Local:  src/server.ts mounts the same api/ handlers on Express and loads .env
```

- **Endpoints:** `popular`, `search`, `[id]`, `trending` and `sitemap`.
  - Every handler is wrapped in `withRateLimit` (60 requests a minute per IP, per function instance).
  - TMDb calls time out after 8 s.
  - Responses are cached at the edge for 10 minutes and in the browser for 1 minute.
- **SSR doesn't call `/api` over HTTP.** It calls the handlers in `api/movies/_lib/handlers.ts` directly, so it skips the rate limit with no secret. It replaces the backend, not an interceptor, so the hydration transfer cache still works (decision 13).
- **i18n:** EN and RU at runtime, through `LanguageService` and signals. The language is kept in a `lang` cookie; the server falls back to `Accept-Language`. The language the server rendered with is passed to the browser in `TransferState`. The texts are in `core/i18n/locales/*.json`, with `{name}` placeholders and plural objects (decision 3).
- **SEO:** `SeoService` sets meta, Open Graph/Twitter, canonical and JSON-LD for each page. There's also a branded `og-image.jpg`, `robots.txt`, a dynamic sitemap, and real 404s: unknown movies through `RESPONSE_INIT`, unknown paths through `status: 404` on the `**` server route.
- **Import aliases:** `@core`, `@features`, `@layout`, `@shared`, `@api`. Files in `api/` use relative imports, because Vercel doesn't resolve tsconfig paths.

## UI

- **Header:** sticky. It overlays the hero from `sm` up; on phones it takes its own row.
- **Search:** in the header. It's a pill on desktop and an icon on mobile that takes the whole header row while focused. Results update after 350 ms of typing, and the Search button and Enter search right away. Queries are capped at 100 characters.
- **Home:** a carousel of trending movies (autoplay, progress lines only, the active line pauses it), then a grid of popular movies or search results with "Show more".
- **Phones:** backdrops show as a 16:10 band with the text below it.
- **Motion:** CSS only, turned off under reduced motion: backdrop settle and drift, a staggered card reveal, and a poster morph between list and details through View Transitions.
- **Test IDs:** key elements have `data-testid` attributes (listed in the README).

## Running

```bash
npm install
cp .env.example .env    # set TMDB_API_KEY (v3 key or v4 token)
ng serve                # full app incl. API on :4200
ng test                 # 48 unit tests
npm run test:ssr        # build + 14 SSR/axe tests (TMDb mocked)
```

The local `.env` already holds a working TMDb v4 token. It's git-ignored; don't commit it. The token was pasted in chat, so consider rotating it.

## State

- **Tests:** unit and SSR tests pass, and the production build passes with `strictTemplates`.
- **Code style:** a cleanup pass trimmed comments and test names to read as hand-written. Keep new code in the same style: few comments, only for a non-obvious *why*.

## Open items

1. **Fuzzy search (proposed, waiting on the user).** TMDb search doesn't tolerate typos (`matrx` returns 0 results). The plan: when a search finds nothing, retry in the proxy with word stems and re-rank the results by similarity.
2. **Vercel.**
   - **First deploy:** not done yet. The SSR setup follows a community pattern, since Vercel has no official zero-config support for `@angular/ssr`, so the first deploy is the real test.
   - **Settings:** add `TMDB_API_KEY`.
   - **Firewall:** add a rate-limit rule on `/api/*`.
   - **Domain:** `CNAME movie-database -> cname.vercel-dns.com`.
3. **Manual checks still needed:**
   - colour contrast and focus visibility in a real browser
   - 200% zoom
   - keyboard and screen reader
   - touch on real phones, especially the mobile search pill and the carousel band

## Working with this user

- Answers should be short and to the point.
- Ask targeted questions, one at a time, when you're unsure (under ~95% confident), rather than guessing.
- Record architecture choices in `docs/decisions.md`.
- Things the user chose explicitly: SCSS, TS path aliases, Atlas icons, Dela Gothic One, header search, the trending carousel, one URL for both languages (no `?lang=`), lines-only carousel controls, `data-testid` on key elements, translations in JSON files with `{name}` placeholders and plural objects, and CLI-style component folders with external `.html`/`.scss` (decision 14).
- WCAG AA and AXE compliance are required (`CLAUDE.md`).
