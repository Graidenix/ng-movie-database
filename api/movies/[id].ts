import { json, proxyTmdb, tmdbLanguage } from './_lib/tmdb';

/** GET /api/movies/:id?lang=en */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.split('/').filter(Boolean).at(-1) ?? '';
  if (!/^\d{1,10}$/.test(id)) {
    return json({ error: 'Invalid movie id' }, 400);
  }

  return proxyTmdb(`/movie/${id}`, { language: tmdbLanguage(url) });
}
