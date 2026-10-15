import { json, proxyTmdb, tmdbLanguage, tmdbPage } from './_lib/tmdb';

const MAX_QUERY_LENGTH = 100;

/** GET /api/movies/search?query=matrix&page=1&lang=en */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('query')?.trim() ?? '';
  if (!query || query.length > MAX_QUERY_LENGTH) {
    return json({ error: `query is required (max ${MAX_QUERY_LENGTH} characters)` }, 400);
  }

  return proxyTmdb('/search/movie', {
    query,
    language: tmdbLanguage(url),
    page: tmdbPage(url),
    include_adult: 'false',
  });
}
