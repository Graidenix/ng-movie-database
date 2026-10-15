import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { InProcessApiBackend } from './in-process-api-backend';

describe('InProcessApiBackend', () => {
  const realFetch = globalThis.fetch;
  let upstream: ReturnType<typeof vi.fn>;
  let http: HttpClient;

  beforeEach(() => {
    process.env['TMDB_API_KEY'] = 'test-key';
    upstream = vi.fn(async () => Response.json({ page: 1, results: [], total_pages: 1 }));
    globalThis.fetch = upstream as unknown as typeof fetch;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        { provide: HttpBackend, useClass: InProcessApiBackend },
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('should call the api handlers without going through /api', async () => {
    const body = await firstValueFrom(
      http.get('http://localhost:4000/api/movies/popular', { params: { page: 2, lang: 'ru' } }),
    );
    const url = new URL(String(upstream.mock.calls[0][0]));

    expect(body).toEqual({ page: 1, results: [], total_pages: 1 });
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(url.origin).toBe('https://api.themoviedb.org');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('language')).toBe('ru-RU');
  });

  it('should turn error responses into HttpErrorResponse', async () => {
    upstream.mockResolvedValueOnce(new Response('{}', { status: 404 }));
    const error = await firstValueFrom(http.get('/api/movies/42')).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(404);
  });

  it('should not rate limit', async () => {
    for (let i = 0; i < 61; i++) {
      await firstValueFrom(http.get('/api/movies/trending'));
    }
    expect(upstream).toHaveBeenCalledTimes(61);
  });
});
