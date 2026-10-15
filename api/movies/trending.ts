import { proxyTmdb, tmdbLanguage } from './_lib/tmdb';

/** GET /api/movies/trending?lang=en — movies trending this week. */
export function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return proxyTmdb('/trending/movie/week', { language: tmdbLanguage(url) });
}
