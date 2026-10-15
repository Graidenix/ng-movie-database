import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { LanguageService } from '@core/i18n/language.service';
import { MovieService } from '@core/movies/movie.service';
import { SITE_URL, SeoService } from '@core/seo/seo.service';
import { HeroCarousel } from './hero-carousel';
import { firstQueryParam } from '@shared/query-param';
import { MovieCard } from './movie-card';

const SKELETON_CARDS = Array.from({ length: 10 }, (_, index) => index);
const PRIORITY_CARDS = 5;
/** TMDb list page size; the reveal wave restarts for each loaded page. */
const PAGE_SIZE = 20;

@Component({
  selector: 'app-movie-list-page',
  imports: [Icon, MovieCard, HeroCarousel, RouterLink],
  template: `
    <h1 class="sr-only">{{ t().appName }}</h1>

    @if (heroMovies().length) {
      <app-hero-carousel data-testid="hero-carousel" [movies]="heroMovies()" />
    } @else {
      <div class="h-4 sm:h-28"></div>
    }

    <section
      aria-labelledby="movie-list-heading"
      data-testid="movie-list"
      class="page-container pt-6"
      [attr.aria-busy]="loading()"
    >
      <h2 id="movie-list-heading" class="mb-6 font-display text-xl sm:text-2xl">
        {{ heading() }}
      </h2>
      <p role="status" class="sr-only">{{ status() }}</p>

      @if (error(); as error) {
        <div
          data-testid="movie-list-error"
          class="mb-8 flex flex-col items-start gap-4 rounded-md border border-alert/60 p-5"
        >
          <p class="flex items-start gap-3 text-alert">
            <app-icon name="alert" class="mt-0.5 size-5" />
            {{ t().errors[error] }}
          </p>
          @if (error === 'queryTooLong') {
            <a routerLink="/" class="font-medium text-marquee underline underline-offset-4">
              {{ t().showPopular }}
            </a>
          } @else {
            <button
              type="button"
              data-testid="movie-list-retry"
              class="btn-secondary"
              (click)="movieService.retry()"
            >
              {{ t().retry }}
            </button>
          }
        </div>
      }

      @if (movies().length) {
        <ul
          data-testid="movie-grid"
          class="grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5"
          [class.opacity-60]="refreshing()"
        >
          @for (movie of movies(); track movie.id; let index = $index) {
            <li class="card-rise" [style.--i]="index % pageSize">
              <app-movie-card [movie]="movie" [priority]="index < priorityCards" />
            </li>
          }
        </ul>

        @if (hasMore()) {
          <div class="mt-12 flex justify-center">
            <button
              type="button"
              data-testid="load-more"
              class="btn-secondary min-w-48"
              [disabled]="loading()"
              (click)="movieService.loadMore()"
            >
              {{ loading() ? t().loading : t().loadMore }}
            </button>
          </div>
        }
      } @else if (loading()) {
        <ul
          aria-hidden="true"
          data-testid="movie-list-skeleton"
          class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5"
        >
          @for (item of skeletonCards; track item) {
            <li class="flex animate-pulse flex-col gap-3">
              <div class="aspect-[2/3] rounded-md bg-reel"></div>
              <div class="h-4 w-3/4 rounded bg-reel"></div>
              <div class="h-3 w-1/3 rounded bg-reel"></div>
            </li>
          }
        </ul>
      } @else if (!error() && searchQuery()) {
        <div data-testid="movie-list-empty" class="flex max-w-xl flex-col items-start gap-3 py-8">
          <p class="text-lg font-medium">{{ t().noResultsTitle(searchQuery()) }}</p>
          <p class="text-dim">{{ t().noResultsHint }}</p>
          <a routerLink="/" class="mt-2 font-medium text-marquee underline underline-offset-4">
            {{ t().showPopular }}
          </a>
        </div>
      }
    </section>
  `,
})
export class MovieListPage {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  protected readonly movieService = inject(MovieService);

  /** `q` query param, bound by the router. */
  readonly q = input('', { transform: firstQueryParam });

  protected readonly t = this.languageService.t;
  protected readonly query = this.q;
  protected readonly movies = this.movieService.movies;
  protected readonly loading = this.movieService.loading;
  protected readonly error = this.movieService.error;
  protected readonly hasMore = this.movieService.hasMore;
  protected readonly searchQuery = this.movieService.query;
  protected readonly skeletonCards = SKELETON_CARDS;
  protected readonly priorityCards = PRIORITY_CARDS;
  protected readonly pageSize = PAGE_SIZE;
  /** Trending carousel; only on the popular list, hidden while searching. */
  protected readonly heroMovies = computed(() =>
    this.query().trim() ? [] : this.movieService.trending(),
  );

  protected readonly refreshing = this.movieService.refreshing;

  protected readonly heading = computed(() => {
    const query = this.query().trim();
    return query ? this.t().resultsHeading(query) : this.t().popularHeading;
  });

  protected readonly status = computed(() => {
    if (this.loading()) return this.t().loading;
    if (this.error()) return '';
    return this.t().resultsCount(this.movies().length);
  });

  constructor() {
    effect(() => {
      const query = this.query().trim();
      this.languageService.language();
      untracked(() => {
        this.movieService.getTrendingMovies();
        if (query) {
          this.movieService.searchMovies(query);
        } else {
          this.movieService.getPopularMovies();
        }
      });
    });

    effect(() => {
      const t = this.t();
      const query = this.query().trim();
      this.seo.update({
        title: query ? `${t.resultsHeading(query)} — ${t.appName}` : t.appName,
        description: t.seoDescription,
        path: '/',
        // Branded share card: stable, unlike this week's trending backdrop.
        image: null,
        // Search result pages are thin duplicates of TMDb's own search; keep them out of the index.
        noindex: !!query,
        jsonLd: query
          ? null
          : {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: t.appName,
              url: `${SITE_URL}/`,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${SITE_URL}/?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            },
      });
    });
  }
}
