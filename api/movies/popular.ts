import { withRateLimit } from './_lib/rate-limit';
import { proxyTmdb, tmdbLanguage, tmdbPage } from './_lib/tmdb';

/** GET /api/movies/popular?page=1&lang=en */
export const GET = withRateLimit((request: Request): Promise<Response> => {
  const url = new URL(request.url);
  return proxyTmdb('/movie/popular', { language: tmdbLanguage(url), page: tmdbPage(url) });
});
