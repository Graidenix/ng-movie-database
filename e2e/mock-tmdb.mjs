// Preloaded into the SSR server for e2e/ssr.test.mjs: answers TMDb calls with fixed data,
// so the test needs no API key or network. Every other request goes through untouched.
const realFetch = globalThis.fetch;

const movie = (id, ru) => ({
  id,
  title: ru ? `Фильм ${id}` : `Movie ${id}`,
  overview: ru ? 'Описание фильма.' : 'A movie overview.',
  poster_path: `/p${id}.jpg`,
  backdrop_path: `/b${id}.jpg`,
  release_date: '2024-05-01',
  vote_average: 7.4,
});

globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.hostname !== 'api.themoviedb.org') {
    return realFetch(input, init);
  }
  const ru = url.searchParams.get('language') === 'ru-RU';
  const page = (ids) => Response.json({ page: 1, results: ids.map((id) => movie(id, ru)), total_pages: 3, total_results: 60 });
  if (url.pathname.endsWith('/trending/movie/week')) return page([11, 12, 13]);
  if (url.pathname.endsWith('/movie/popular')) return page([1, 2, 3]);
  if (url.pathname.endsWith('/search/movie')) return page([21]);
  if (url.pathname.endsWith('/movie/404404')) return new Response('{}', { status: 404 });
  const id = Number(url.pathname.split('/').at(-1));
  return Response.json({ ...movie(id, ru), genres: [{ id: 1, name: 'Drama' }], runtime: 101, tagline: null, vote_count: 50 });
};
