import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { LanguageService } from '@core/i18n/language.service';
import { MovieService } from '@core/movies/movie.service';
import { MovieCard } from './movie-card';
import { MovieSearch } from './movie-search';

const SKELETON_CARDS = Array.from({ length: 10 }, (_, index) => index);
const PRIORITY_CARDS = 5;

@Component({
  selector: 'app-movie-list-page',
  imports: [Icon, MovieCard, MovieSearch, RouterLink],
  template: `
    <section class="max-w-3xl pt-6 pb-10 sm:pt-12 sm:pb-14">
      <h1
        class="mb-6 font-display text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl"
      >
        {{ t().searchHeadline }}
      </h1>
      <app-movie-search [query]="query()" />
    </section>

    <section aria-labelledby="movie-list-heading" [attr.aria-busy]="loading()">
      <h2 id="movie-list-heading" class="mb-6 font-display text-xl font-medium sm:text-2xl">
        {{ heading() }}
      </h2>
      <p role="status" class="sr-only">{{ status() }}</p>

      @if (error(); as error) {
        <div class="mb-8 flex flex-col items-start gap-4 rounded-md border border-alert/60 p-5">
          <p class="flex items-start gap-3 text-alert">
            <app-icon name="alert" class="mt-0.5 size-5" />
            {{ t().errors[error] }}
          </p>
          <button type="button" class="btn-secondary" (click)="movieService.retry()">
            {{ t().retry }}
          </button>
        </div>
      }

      @if (movies().length) {
        <ul
          class="grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5"
          [class.opacity-60]="refreshing()"
        >
          @for (movie of movies(); track movie.id; let index = $index) {
            <li>
              <app-movie-card [movie]="movie" [priority]="index < priorityCards" />
            </li>
          }
        </ul>

        @if (hasMore()) {
          <div class="mt-12 flex justify-center">
            <button
              type="button"
              class="btn-secondary min-w-48"
              [disabled]="loading()"
              (click)="movieService.loadMore()"
            >
              {{ loading() ? t().loading : t().loadMore }}
            </button>
          </div>
        }
      } @else if (loading()) {
        <ul aria-hidden="true" class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5">
          @for (item of skeletonCards; track item) {
            <li class="flex animate-pulse flex-col gap-3">
              <div class="aspect-[2/3] rounded-md bg-reel"></div>
              <div class="h-4 w-3/4 rounded bg-reel"></div>
              <div class="h-3 w-1/3 rounded bg-reel"></div>
            </li>
          }
        </ul>
      } @else if (!error() && searchQuery()) {
        <div class="flex max-w-xl flex-col items-start gap-3 py-8">
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
  private readonly title = inject(Title);
  protected readonly movieService = inject(MovieService);

  /** `q` query param, bound by the router. */
  readonly q = input<string>();

  protected readonly t = this.languageService.t;
  protected readonly query = computed(() => this.q() ?? '');
  protected readonly movies = this.movieService.movies;
  protected readonly loading = this.movieService.loading;
  protected readonly error = this.movieService.error;
  protected readonly hasMore = this.movieService.hasMore;
  protected readonly searchQuery = this.movieService.query;
  protected readonly skeletonCards = SKELETON_CARDS;
  protected readonly priorityCards = PRIORITY_CARDS;

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
      untracked(() =>
        query ? this.movieService.searchMovies(query) : this.movieService.getPopularMovies(),
      );
    });

    effect(() => this.title.setTitle(this.t().appName));
  }
}
