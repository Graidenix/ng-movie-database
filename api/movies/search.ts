import { MAX_SEARCH_QUERY_LENGTH } from './_lib/limits';
import { withRateLimit } from './_lib/rate-limit';
import { json, proxyTmdb, tmdbLanguage, tmdbPage } from './_lib/tmdb';

/** GET /api/movies/search?query=matrix&page=1&lang=en */
export const GET = withRateLimit(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.trim() ?? '';
  if (!query || query.length > MAX_SEARCH_QUERY_LENGTH) {
    return json({ error: `query is required (max ${MAX_SEARCH_QUERY_LENGTH} characters)` }, 400);
  }

  return proxyTmdb('/search/movie', {
    query,
    language: tmdbLanguage(url),
    page: tmdbPage(url),
    include_adult: 'false',
  });
});
