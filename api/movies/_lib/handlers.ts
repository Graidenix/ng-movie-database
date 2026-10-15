import { MAX_SEARCH_QUERY_LENGTH } from './limits';
import { json, proxyTmdb, tmdbLanguage, tmdbPage } from './tmdb';

export type Handler = (request: Request) => Promise<Response>;

// GET /api/movies/popular?page=1&lang=en
export const getPopularMovies: Handler = (request) => {
  const url = new URL(request.url);
  return proxyTmdb('/movie/popular', { language: tmdbLanguage(url), page: tmdbPage(url) });
};

// GET /api/movies/search?query=matrix&page=1&lang=en
export const searchMovies: Handler = async (request) => {
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
};

// GET /api/movies/trending?lang=en
export const getTrendingMovies: Handler = (request) => {
  const url = new URL(request.url);
  return proxyTmdb('/trending/movie/week', { language: tmdbLanguage(url) });
};

// GET /api/movies/:id?lang=en
export const getMovie: Handler = async (request) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').filter(Boolean).at(-1) ?? '';
  if (!/^\d{1,10}$/.test(id)) {
    return json({ error: 'Invalid movie id' }, 400);
  }

  return proxyTmdb(`/movie/${id}`, { language: tmdbLanguage(url) });
};

// Mirrors the file routes in api/movies, for callers that skip HTTP (SSR).
export function movieApiHandler(pathname: string): Handler | undefined {
  const route = pathname.match(/^\/api\/movies\/([^/]+)\/?$/)?.[1];
  switch (route) {
    case undefined:
      return undefined;
    case 'popular':
      return getPopularMovies;
    case 'search':
      return searchMovies;
    case 'trending':
      return getTrendingMovies;
    default:
      return getMovie;
  }
}
