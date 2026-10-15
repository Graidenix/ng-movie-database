const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_LANGUAGES: Record<string, string> = { en: 'en-US', ru: 'ru-RU' };
const MAX_PAGE = 500;
const CACHE_CONTROL = 'public, s-maxage=600, stale-while-revalidate=3600';

/** Builds a JSON response. */
export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(body, { status, headers });
}

/** Maps the `lang` query param (`en` | `ru`) to a TMDb language code. Defaults to English. */
export function tmdbLanguage(url: URL): string {
  return TMDB_LANGUAGES[url.searchParams.get('lang') ?? ''] ?? TMDB_LANGUAGES['en'];
}

/** Reads the `page` query param, clamped to the range TMDb accepts. */
export function tmdbPage(url: URL): string {
  const page = Number(url.searchParams.get('page') ?? '1');
  return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? String(page) : '1';
}

/**
 * Calls TMDb with the server-side API key and forwards the JSON result.
 * Supports both a v3 API key and a v4 read access token (JWT, starts with `eyJ`).
 */
export async function proxyTmdb(path: string, params: Record<string, string>): Promise<Response> {
  const apiKey = process.env['TMDB_API_KEY'];
  if (!apiKey) {
    return json({ error: 'TMDB_API_KEY is not configured' }, 500);
  }

  const url = new URL(TMDB_BASE_URL + path);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  const headers: Record<string, string> = { accept: 'application/json' };
  if (apiKey.startsWith('eyJ')) {
    headers['authorization'] = `Bearer ${apiKey}`;
  } else {
    url.searchParams.set('api_key', apiKey);
  }

  try {
    const response = await fetch(url, { headers });
    if (response.status === 404) {
      return json({ error: 'Not found' }, 404);
    }
    if (!response.ok) {
      return json({ error: 'TMDb request failed' }, 502);
    }
    return json(await response.json(), 200, { 'cache-control': CACHE_CONTROL });
  } catch {
    return json({ error: 'TMDb is unavailable' }, 502);
  }
}
