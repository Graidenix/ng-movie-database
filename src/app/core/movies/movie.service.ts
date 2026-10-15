import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '@core/i18n/language.service';
import { LoadError, Movie, MovieDetails, PagedResponse } from './movie.models';

/** TMDb reports more pages than it serves; requests past page 500 fail. */
const TMDB_MAX_PAGE = 500;

/** Talks to the `/api/movies` proxy and exposes list and details state as signals. */
@Service()
export class MovieService {
  private readonly http = inject(HttpClient);
  private readonly languageService = inject(LanguageService);

  // List state (popular or search results)
  private readonly moviesState = signal<Movie[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<LoadError | null>(null);
  private readonly queryState = signal('');
  private readonly pageState = signal(0);
  private readonly totalPagesState = signal(0);
  private readonly loadingPageState = signal(0);

  readonly movies = this.moviesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  /** True while a new first page replaces the movies on screen (not while appending a page). */
  readonly refreshing = computed(() => this.loadingState() && this.loadingPageState() === 1);
  readonly error = this.errorState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly hasMore = computed(() => this.pageState() > 0 && this.pageState() < this.totalPagesState());

  // Details state
  private readonly movieDetailsState = signal<MovieDetails | null>(null);
  private readonly detailsLoadingState = signal(false);
  private readonly detailsErrorState = signal<LoadError | null>(null);

  readonly movieDetails = this.movieDetailsState.asReadonly();
  readonly detailsLoading = this.detailsLoadingState.asReadonly();
  readonly detailsError = this.detailsErrorState.asReadonly();

  private listRequest?: Subscription;
  private listKey = '';
  private lastListPage = 1;
  private detailsRequest?: Subscription;
  private detailsKey = '';

  getPopularMovies(page = 1): void {
    this.loadList('', page);
  }

  searchMovies(keyword: string, page = 1): void {
    this.loadList(keyword.trim(), page);
  }

  loadMore(): void {
    if (this.hasMore() && !this.loadingState()) {
      this.loadList(this.queryState(), this.pageState() + 1);
    }
  }

  retry(): void {
    this.loadList(this.queryState(), this.lastListPage);
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
      this.detailsLoadingState.set(false);
      this.detailsErrorState.set('notFound');
      return;
    }

    this.detailsLoadingState.set(true);
    this.detailsErrorState.set(null);
    this.detailsRequest = this.http
      .get<MovieDetails>(`/api/movies/${id}`, { params: { lang: language } })
      .subscribe({
        next: (movie) => {
          this.movieDetailsState.set(movie);
          this.detailsLoadingState.set(false);
        },
        error: (error: unknown) => {
          this.detailsErrorState.set(toLoadError(error));
          this.detailsLoadingState.set(false);
        },
      });
  }

  private loadList(query: string, page: number): void {
    const language = this.languageService.language();
    const key = `${language}|${query}`;
    // Page 1 of the same query and language is already loaded (or loading): keep it, including
    // pages added by "load more", so returning from a details page restores the list.
    if (page === 1 && key === this.listKey && !this.errorState()) {
      return;
    }
    this.listKey = key;
    this.lastListPage = page;
    this.listRequest?.unsubscribe();

    this.queryState.set(query);
    this.loadingPageState.set(page);
    this.loadingState.set(true);
    this.errorState.set(null);

    const url = query ? '/api/movies/search' : '/api/movies/popular';
    const params: Record<string, string | number> = { page, lang: language };
    if (query) {
      params['query'] = query;
    }
    this.listRequest = this.http.get<PagedResponse<Movie>>(url, { params }).subscribe({
      next: (response) => {
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
        this.errorState.set(toLoadError(error));
        this.loadingState.set(false);
      },
    });
  }
}

/** TMDb pages can overlap when popularity shifts between requests; drop repeated ids. */
function appendUnique(current: Movie[], next: Movie[]): Movie[] {
  const seen = new Set(current.map((movie) => movie.id));
  return [...current, ...next.filter((movie) => !seen.has(movie.id))];
}

function toLoadError(error: unknown): LoadError {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'network';
    if (error.status === 404) return 'notFound';
  }
  return 'server';
}
