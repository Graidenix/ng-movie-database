import { MAX_SEARCH_QUERY_LENGTH } from './limits';
import { fetchTmdb, json, proxyTmdb, tmdbLanguage, tmdbPage, tmdbResponse } from './tmdb';

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

// GET /api/movies/genre?id=28&page=1&lang=en
// Most popular movies in a genre. Adds the localized genre name for the heading.
export const getGenreMovies: Handler = async (request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  if (!/^\d{1,10}$/.test(id)) {
    return json({ error: 'Invalid genre id' }, 400);
  }

  const language = tmdbLanguage(url);
  const [genres, movies] = await Promise.all([
    fetchTmdb('/genre/movie/list', { language }),
    fetchTmdb('/discover/movie', {
      with_genres: id,
      sort_by: 'popularity.desc',
      include_adult: 'false',
      language,
      page: tmdbPage(url),
    }),
  ]);
  if (!genres.ok) {
    return tmdbResponse(genres);
  }
  const genre = (genres.data as { genres: { id: number; name: string }[] }).genres.find(
    (candidate) => String(candidate.id) === id,
  );
  if (!genre) {
    return json({ error: 'Genre not found' }, 404);
  }
  if (!movies.ok) {
    return tmdbResponse(movies);
  }
  return tmdbResponse({ ok: true, data: { ...(movies.data as object), genre } });
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
    case 'genre':
      return getGenreMovies;
    default:
      return getMovie;
  }
}
