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

/** Upper bound for one TMDb call, so a stalled upstream can't hold a function (or SSR) open. */
const TMDB_TIMEOUT_MS = 8000;

export type TmdbResult =
  | { ok: true; data: unknown }
  | { ok: false; status: 404 | 429 | 500 | 502 | 504; error: string; retryAfter?: string };

/**
 * Calls TMDb with the server-side API key.
 * Supports both a v3 API key and a v4 read access token (JWT, starts with `eyJ`).
 */
export async function fetchTmdb(path: string, params: Record<string, string>): Promise<TmdbResult> {
  const apiKey = process.env['TMDB_API_KEY'];
  if (!apiKey) {
    return { ok: false, status: 500, error: 'TMDB_API_KEY is not configured' };
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
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(TMDB_TIMEOUT_MS) });
    if (response.status === 404) {
      return { ok: false, status: 404, error: 'Not found' };
    }
    if (response.status === 429) {
      return {
        ok: false,
        status: 429,
        error: 'TMDb rate limit reached',
        retryAfter: response.headers.get('retry-after') ?? undefined,
      };
    }
    if (!response.ok) {
      return { ok: false, status: 502, error: 'TMDb request failed' };
    }
    return { ok: true, data: await response.json() };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return { ok: false, status: 504, error: 'TMDb did not respond in time' };
    }
    return { ok: false, status: 502, error: 'TMDb is unavailable' };
  }
}

/** Calls TMDb and forwards the JSON result, cached at the edge. */
export async function proxyTmdb(path: string, params: Record<string, string>): Promise<Response> {
  const result = await fetchTmdb(path, params);
  if (result.ok) {
    return json(result.data, 200, { 'cache-control': CACHE_CONTROL });
  }
  const headers: Record<string, string> = result.retryAfter
    ? { 'retry-after': result.retryAfter }
    : {};
  return json({ error: result.error }, result.status, headers);
}
