import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { MAX_SEARCH_QUERY_LENGTH } from '@api/movies/_lib/limits';
import { LanguageService } from '@core/i18n/language.service';
import { Genre, GenreMovies, LoadError, Movie, MovieDetails, PagedResponse } from './movie.models';

// TMDb reports more pages than it serves; anything past 500 fails.
const TMDB_MAX_PAGE = 500;
const TRENDING_SLIDES = 6;

@Service()
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly languageService = inject(LanguageService);

  // popular / search / genre results
  private readonly moviesState = signal<Movie[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<LoadError | null>(null);
  private readonly queryState = signal('');
  private readonly genreIdState = signal<number | null>(null);
  // Names seen on detail pages or in genre responses, so the heading shows before the list loads.
  private readonly genreNamesState = signal<Readonly<Record<number, string>>>({});
  private readonly pageState = signal(0);
  private readonly totalPagesState = signal(0);
  private readonly loadingPageState = signal(0);

  readonly movies = this.moviesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly refreshing = computed(() => this.loadingState() && this.loadingPageState() === 1);
  readonly error = this.errorState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly genreName = computed(() => {
    const id = this.genreIdState();
    return id === null ? null : (this.genreNamesState()[id] ?? null);
  });
  readonly hasMore = computed(
    () => this.pageState() > 0 && this.pageState() < this.totalPagesState(),
  );

  private readonly trendingState = signal<Movie[]>([]);
  readonly trending = this.trendingState.asReadonly();

  // details page
  private readonly movieDetailsState = signal<MovieDetails | null>(null);
  private readonly detailsErrorState = signal<LoadError | null>(null);

  readonly movieDetails = this.movieDetailsState.asReadonly();
  readonly detailsError = this.detailsErrorState.asReadonly();

  private listRequest?: Subscription;
  private listKey = '';
  private lastListPage = 1;
  private trendingKey = '';
  private trendingRequest?: Subscription;
  private detailsRequest?: Subscription;
  private detailsKey = '';

  getPopularMovies(page = 1): void {
    this.loadList('', page);
  }

  searchMovies(keyword: string, page = 1): void {
    this.loadList(keyword.trim(), page);
  }

  getGenreMovies(genreId: number, page = 1): void {
    this.loadList('', page, genreId);
  }

  loadMore(): void {
    if (this.hasMore() && !this.loadingState()) {
      this.loadList(this.queryState(), this.pageState() + 1, this.genreIdState());
    }
  }

  retry(): void {
    this.loadList(this.queryState(), this.lastListPage, this.genreIdState());
  }

  getTrendingMovies(): void {
    const language = this.languageService.language();
    if (language === this.trendingKey) {
      return;
    }
    this.trendingKey = language;
    // a late response for the old language must not win
    this.trendingRequest?.unsubscribe();
    this.trendingRequest = this.http
      .get<PagedResponse<Movie>>('/api/movies/trending', { params: { lang: language } })
      .subscribe({
        next: (response) => {
          if (this.trendingKey !== language) {
            return;
          }
          this.trendingState.set(
            response.results.filter((movie) => movie.backdrop_path).slice(0, TRENDING_SLIDES),
          );
        },
        error: () => {
          if (this.trendingKey === language) {
            this.trendingKey = '';
          }
        },
      });
  }

  getMovieDetails(id: number): void {
    const language = this.languageService.language();
    const key = `${language}|${id}`;
    if (key === this.detailsKey && !this.detailsErrorState()) {
      return;
    }
    this.detailsKey = key;
    this.detailsRequest?.unsubscribe();

    if (this.movieDetailsState()?.id !== id) {
      this.movieDetailsState.set(null);
    }
    if (!Number.isInteger(id) || id <= 0) {
      this.detailsErrorState.set('notFound');
      return;
    }

    this.detailsErrorState.set(null);
    this.detailsRequest = this.http
      .get<MovieDetails>(`/api/movies/${id}`, { params: { lang: language } })
      .subscribe({
        next: (movie) => {
          this.movieDetailsState.set(movie);
          this.rememberGenres(movie.genres);
        },
        error: (error: unknown) => this.detailsErrorState.set(toLoadError(error)),
      });
  }

  private loadList(query: string, page: number, genreId: number | null = null): void {
    const language = this.languageService.language();
    const key = `${language}|${query}|${genreId ?? ''}`;
    // Already loaded (or loading). Keeps the extra "load more" pages when coming back from details.
    if (page === 1 && key === this.listKey && !this.errorState()) {
      return;
    }
    this.listKey = key;
    this.lastListPage = page;
    this.listRequest?.unsubscribe();

    this.queryState.set(query);
    this.genreIdState.set(genreId);

    const invalid =
      query.length > MAX_SEARCH_QUERY_LENGTH
        ? 'queryTooLong'
        : genreId !== null && !(Number.isInteger(genreId) && genreId > 0)
          ? 'genreNotFound'
          : null;
    if (invalid) {
      this.moviesState.set([]);
      this.pageState.set(0);
      this.totalPagesState.set(0);
      this.loadingState.set(false);
      this.errorState.set(invalid);
      return;
    }

    this.loadingPageState.set(page);
    this.loadingState.set(true);
    this.errorState.set(null);

    const url = genreId
      ? '/api/movies/genre'
      : query
        ? '/api/movies/search'
        : '/api/movies/popular';
    const params: Record<string, string | number> = { page, lang: language };
    if (query) {
      params['query'] = query;
    }
    if (genreId) {
      params['id'] = genreId;
    }
    this.listRequest = this.http.get<PagedResponse<Movie>>(url, { params }).subscribe({
      next: (response) => {
        const { genre } = response as Partial<GenreMovies>;
        if (genre) {
          this.rememberGenres([genre]);
        }
        this.moviesState.update((current) =>
          page === 1 ? response.results : appendUnique(current, response.results),
        );
        this.pageState.set(response.page);
        this.totalPagesState.set(Math.min(response.total_pages, TMDB_MAX_PAGE));
        this.loadingState.set(false);
      },
      error: (error: unknown) => {
        if (page === 1) {
          this.moviesState.set([]);
          this.pageState.set(0);
          this.totalPagesState.set(0);
        }
        const loadError = toLoadError(error);
        this.errorState.set(genreId && loadError === 'notFound' ? 'genreNotFound' : loadError);
        this.loadingState.set(false);
      },
    });
  }

  private rememberGenres(genres: Genre[]): void {
    this.genreNamesState.update((names) => ({
      ...names,
      ...Object.fromEntries(genres.map((genre) => [genre.id, genre.name])),
    }));
  }
}

// Popular pages can overlap if the ranking shifts between requests.
function appendUnique(current: Movie[], next: Movie[]): Movie[] {
  const seen = new Set(current.map((movie) => movie.id));
  return [...current, ...next.filter((movie) => !seen.has(movie.id))];
}

function toLoadError(error: unknown): LoadError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'network';
    if (error.status === 404) return 'notFound';
    if (error.status === 429) return 'rateLimited';
  }
  return 'server';
}
