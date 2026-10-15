# Movie Database

Browse popular movies and search [TMDB](https://www.themoviedb.org/), in English or Russian. Built with Angular 22 (SSR with hydration, standalone components, signals, Signal Forms), Tailwind CSS 4, SCSS and Atlas Icons, hosted on Vercel at [movie-database.odajiu.eu](https://movie-database.odajiu.eu).

The assignment is in [docs/assignment.md](docs/assignment.md), and the architecture decisions are in [docs/decisions.md](docs/decisions.md).

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `TMDB_API_KEY`. Either a v3 API key or a v4 read access token works.

## Development

```bash
ng serve
```

This runs the app with SSR at `http://localhost:4200`. The browser and SSR both get their data from `/api/movies/*`, which are Vercel Functions in `api/`. Outside Vercel, the dev server mounts those same handlers itself (`src/server/local-api.ts`) and reads `.env`, so the Vercel CLI isn't needed.

To run the production build locally: `ng build && npm run serve:ssr:ng-movie-database` (port 4000).

## Tests and build

```bash
ng test    # Vitest unit tests
ng build   # output: dist/ng-movie-database/{browser,server}
```

## Deployment (Vercel)

- **Import the repo.** `vercel.json` routes every page to the SSR function (`api/ssr.mjs`), and static assets are served from `dist/ng-movie-database/browser`.
- **Add the key.** Add `TMDB_API_KEY` under Project → Settings → Environment Variables.
- **Connect the domain.** Add `movie-database.odajiu.eu` under Project → Domains, then create a DNS record: `CNAME movie-database → cname.vercel-dns.com`.

## Structure

```
api/                       Vercel Functions
  ssr.mjs                  renders pages with Angular SSR
  movies/_lib/tmdb.ts      TMDb proxy: key stays server-side, param validation, caching
  movies/popular.ts        GET /api/movies/popular?page&lang
  movies/search.ts         GET /api/movies/search?query&page&lang
  movies/[id].ts           GET /api/movies/:id?lang
src/server.ts              Express SSR host (+ local /api in development)
src/app/
  core/i18n/               signal-based EN/RU translations (cookie, SSR-aware)
  core/movies/             MovieService (signals), models, TMDb image loader
  features/movies/         list page, search, card, detail page
  layout/                  language switcher
  shared/icon/             Atlas Icons as inline SVG
```

Imports use path aliases (`@core`, `@features`, `@layout`, `@shared`, `@api`); see [docs/decisions.md](docs/decisions.md).

---

This product uses the TMDB API but is not endorsed or certified by TMDB.
