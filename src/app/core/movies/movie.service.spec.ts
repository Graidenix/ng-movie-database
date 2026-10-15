import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from '@core/i18n/language.service';
import { Movie, PagedResponse } from './movie.models';
import { MovieService } from './movie.service';

function movie(id: number): Movie {
  return {
    id,
    title: `Movie ${id}`,
    overview: '',
    poster_path: null,
    backdrop_path: null,
    release_date: '2020-01-01',
    vote_average: 7,
  };
}

function page(pageNumber: number, ids: number[], totalPages = 3): PagedResponse<Movie> {
  return { page: pageNumber, results: ids.map(movie), total_pages: totalPages, total_results: 60 };
}

describe('MovieService', () => {
  let service: MovieService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(LanguageService).setLanguage('en');
    service = TestBed.inject(MovieService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should load popular movies', () => {
    service.getPopularMovies();
    expect(service.loading()).toBe(true);

    const request = http.expectOne((r) => r.url === '/api/movies/popular');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('lang')).toBe('en');
    request.flush(page(1, [1, 2]));

    expect(service.loading()).toBe(false);
    expect(service.movies().map((m) => m.id)).toEqual([1, 2]);
    expect(service.hasMore()).toBe(true);
  });

  it('should search and dedupe on load more', () => {
    service.searchMovies('  matrix ');
    const first = http.expectOne((r) => r.url === '/api/movies/search');
    expect(first.request.params.get('query')).toBe('matrix');
    first.flush(page(1, [1, 2]));

    service.loadMore();
    http.expectOne((r) => r.params.get('page') === '2').flush(page(2, [2, 3]));

    expect(service.query()).toBe('matrix');
    expect(service.movies().map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it('should not refetch a loaded list', () => {
    service.getPopularMovies();
    http.expectOne('/api/movies/popular?page=1&lang=en').flush(page(1, [1]));

    service.getPopularMovies();
    http.expectNone(() => true);
  });

  it('should retry after an error', () => {
    service.getPopularMovies();
    http
      .expectOne((r) => r.url === '/api/movies/popular')
      .flush(null, { status: 500, statusText: 'Error' });

    expect(service.error()).toBe('server');
    expect(service.movies()).toEqual([]);

    service.retry();
    http.expectOne((r) => r.url === '/api/movies/popular').flush(page(1, [1]));
    expect(service.error()).toBeNull();
    expect(service.movies().length).toBe(1);
  });

  it('should load details and map 404', () => {
    service.getMovieDetails(42);
    http
      .expectOne('/api/movies/42?lang=en')
      .flush({ ...movie(42), genres: [], runtime: 120, tagline: null, vote_count: 10 });
    expect(service.movieDetails()?.id).toBe(42);

    service.getMovieDetails(7);
    expect(service.movieDetails()).toBeNull();
    http.expectOne('/api/movies/7?lang=en').flush(null, { status: 404, statusText: 'Not Found' });
    expect(service.detailsError()).toBe('notFound');
  });

  it('should reject invalid ids', () => {
    service.getMovieDetails(Number.NaN);
    expect(service.detailsError()).toBe('notFound');
  });

  it('should drop stale trending responses', () => {
    const language = TestBed.inject(LanguageService);
    service.getTrendingMovies();
    const english = http.expectOne((r) => r.url === '/api/movies/trending');

    language.setLanguage('ru');
    service.getTrendingMovies();
    const russian = http.expectOne((r) => r.params.get('lang') === 'ru');

    expect(english.cancelled).toBe(true);
    russian.flush({ ...page(1, []), results: [{ ...movie(7), backdrop_path: '/b.jpg' }] });
    expect(service.trending().map((m) => m.id)).toEqual([7]);
  });

  it('should not send too long queries', () => {
    service.searchMovies('x'.repeat(101));

    http.expectNone(() => true);
    expect(service.error()).toBe('queryTooLong');
    expect(service.loading()).toBe(false);
    expect(service.movies()).toEqual([]);
  });

  it('should map 429 to rateLimited', () => {
    service.getPopularMovies();
    http
      .expectOne((r) => r.url === '/api/movies/popular')
      .flush(null, { status: 429, statusText: 'Too Many' });
    expect(service.error()).toBe('rateLimited');
  });

  it('should retry a failed page without duplicates', () => {
    service.getPopularMovies();
    http.expectOne((r) => r.params.get('page') === '1').flush(page(1, [1, 2]));

    service.loadMore();
    http
      .expectOne((r) => r.params.get('page') === '2')
      .flush(null, { status: 500, statusText: 'Error' });
    expect(service.error()).toBe('server');
    expect(service.movies().map((m) => m.id)).toEqual([1, 2]);

    service.retry();
    http.expectOne((r) => r.params.get('page') === '2').flush(page(2, [2, 3]));
    expect(service.error()).toBeNull();
    expect(service.movies().map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it('should go back to popular after search', () => {
    service.searchMovies('matrix');
    http.expectOne((r) => r.url === '/api/movies/search').flush(page(1, [9]));

    service.getPopularMovies();
    http.expectOne((r) => r.url === '/api/movies/popular').flush(page(1, [1, 2]));
    expect(service.query()).toBe('');
    expect(service.movies().map((m) => m.id)).toEqual([1, 2]);
  });
});
