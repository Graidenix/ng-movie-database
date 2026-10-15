import { fetchTmdb } from './movies/_lib/tmdb';

const SITE_URL = 'https://movie-database.odajiu.eu';
const POPULAR_PAGES = 3;

interface MovieList {
  results: { id: number }[];
}

/**
 * GET /sitemap.xml (rewritten here in vercel.json): the home page plus movies that are
 * currently popular or trending. Cached at the edge for a day.
 */
export async function GET(): Promise<Response> {
  const lists = await Promise.all([
    fetchTmdb('/trending/movie/week', { language: 'en-US' }),
    ...Array.from({ length: POPULAR_PAGES }, (_, i) =>
      fetchTmdb('/movie/popular', { language: 'en-US', page: String(i + 1) }),
    ),
  ]);

  const ids = new Set<number>();
  for (const list of lists) {
    if (list.ok) {
      for (const movie of (list.data as MovieList).results) {
        ids.add(movie.id);
      }
    }
  }

  const urls = [
    `  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...[...ids].map(
      (id) => `  <url><loc>${SITE_URL}/movie/${id}</loc><changefreq>weekly</changefreq></url>`,
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
