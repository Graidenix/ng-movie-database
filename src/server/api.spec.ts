import { GET as getMovie } from '@api/movies/[id]';
import { GET as getGenreMovies } from '@api/movies/genre';
import { resetRateLimit } from '@api/movies/_lib/rate-limit';
import { GET as getPopular } from '@api/movies/popular';
import { GET as search } from '@api/movies/search';

describe('api', () => {
  const realFetch = globalThis.fetch;
  let upstream: ReturnType<typeof vi.fn>;
  const request = (path: string, headers: Record<string, string> = {}) =>
    new Request(`http://localhost${path}`, { headers });

  beforeEach(() => {
    process.env['TMDB_API_KEY'] = 'test-key';
    resetRateLimit();
    upstream = vi.fn(async () => Response.json({ page: 1, results: [], total_pages: 1 }));
    globalThis.fetch = upstream as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('should validate params', async () => {
    expect((await search(request('/api/movies/search?query=%20'))).status).toBe(400);
    expect((await search(request(`/api/movies/search?query=${'x'.repeat(101)}`))).status).toBe(400);
    expect((await getMovie(request('/api/movies/abc'))).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('should clamp page and language', async () => {
    const response = await getPopular(request('/api/movies/popular?page=9999&lang=xx'));
    const url = new URL(String(upstream.mock.calls[0][0]));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('language')).toBe('en-US');
    expect(url.searchParams.get('api_key')).toBe('test-key');
  });

  it('should map upstream errors', async () => {
    upstream.mockResolvedValueOnce(new Response('{}', { status: 404 }));
    expect((await getMovie(request('/api/movies/1'))).status).toBe(404);

    upstream.mockResolvedValueOnce(
      new Response('{}', { status: 429, headers: { 'retry-after': '10' } }),
    );
    const limited = await getMovie(request('/api/movies/1'));
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('10');

    upstream.mockResolvedValueOnce(new Response('{}', { status: 500 }));
    expect((await getMovie(request('/api/movies/1'))).status).toBe(502);

    upstream.mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'));
    expect((await getMovie(request('/api/movies/1'))).status).toBe(504);

    const signal = upstream.mock.calls[0][1]?.signal as AbortSignal | undefined;
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('should rate limit per client', async () => {
    const client = { 'x-forwarded-for': '203.0.113.7' };
    for (let i = 0; i < 60; i++) {
      await getPopular(request('/api/movies/popular', client));
    }
    const blocked = await getPopular(request('/api/movies/popular', client));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);

    const otherClient = await getPopular(
      request('/api/movies/popular', { 'x-forwarded-for': '198.51.100.1' }),
    );
    expect(otherClient.status).toBe(200);
  });

  it('should add the genre name to genre results', async () => {
    upstream.mockImplementation(async (input: string | URL) =>
      String(input).includes('/genre/movie/list')
        ? Response.json({ genres: [{ id: 28, name: 'Action' }] })
        : Response.json({ page: 1, results: [], total_pages: 1 }),
    );

    expect((await getGenreMovies(request('/api/movies/genre?id=abc'))).status).toBe(400);
    expect((await getGenreMovies(request('/api/movies/genre?id=99'))).status).toBe(404);

    const response = await getGenreMovies(request('/api/movies/genre?id=28&page=2&lang=ru'));
    const discover = new URL(
      String(
        upstream.mock.calls.filter(([url]) => String(url).includes('/discover/movie')).at(-1)![0],
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ genre: { id: 28, name: 'Action' } });
    expect(discover.searchParams.get('with_genres')).toBe('28');
    expect(discover.searchParams.get('page')).toBe('2');
    expect(discover.searchParams.get('language')).toBe('ru-RU');
  });
});
