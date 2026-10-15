import { DatePipe, DecimalPipe, Location, NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  untracked,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { LanguageService } from '@core/i18n/language.service';
import { MovieService } from '@core/movies/movie.service';

@Component({
  selector: 'app-movie-detail-page',
  imports: [Icon, NgOptimizedImage, DatePipe, DecimalPipe, RouterLink],
  template: `
    <button type="button" class="btn-secondary -ml-1 h-11 border-transparent px-3" (click)="goBack()">
      <app-icon name="arrow-left" class="size-5" />
      {{ t().back }}
    </button>

    @if (error(); as error) {
      <div class="mt-10 flex max-w-xl flex-col items-start gap-4">
        <h1 class="font-display text-2xl font-medium">{{ t().errors[error] }}</h1>
        @if (error === 'notFound') {
          <a routerLink="/" class="font-medium text-marquee underline underline-offset-4">
            {{ t().showPopular }}
          </a>
        } @else {
          <button type="button" class="btn-secondary" (click)="reload()">{{ t().retry }}</button>
        }
      </div>
    } @else if (movie(); as movie) {
      <article class="mt-6 grid gap-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-12 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <div class="mx-auto w-full max-w-72 md:max-w-none">
          @if (movie.poster_path) {
            <img
              [ngSrc]="movie.poster_path"
              width="500"
              height="750"
              priority
              sizes="(min-width: 1024px) 24rem, (min-width: 768px) 20rem, 18rem"
              alt=""
              class="h-auto w-full rounded-md ring-1 ring-seam"
            />
          } @else {
            <div class="grid aspect-[2/3] place-items-center rounded-md bg-reel text-dim ring-1 ring-seam">
              {{ t().noPoster }}
            </div>
          }
        </div>

        <div class="flex min-w-0 flex-col gap-8">
          <header class="flex flex-col gap-3">
            <h1 class="font-display text-3xl leading-tight font-bold text-balance sm:text-5xl">
              {{ movie.title }}
            </h1>
            @if (movie.tagline) {
              <p class="text-lg text-dim italic">{{ movie.tagline }}</p>
            }
          </header>

          <dl class="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-seam py-6 sm:grid-cols-3">
            <div class="flex flex-col gap-1">
              <dt class="text-sm text-dim">{{ t().rating }}</dt>
              <dd class="flex flex-col">
                @if (movie.vote_count > 0) {
                  <span>
                    <span class="font-display text-2xl font-bold text-marquee">
                      {{ movie.vote_average | number: '1.1-1' : language() }}
                    </span>
                    <span class="text-dim">/ 10</span>
                  </span>
                  <span class="text-sm text-dim">{{ t().votes(movie.vote_count) }}</span>
                } @else {
                  {{ t().unknown }}
                }
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt class="text-sm text-dim">{{ t().releaseDate }}</dt>
              <dd class="text-lg">
                {{ movie.release_date ? (movie.release_date | date: 'longDate' : undefined : language()) : t().unknown }}
              </dd>
            </div>
            <div class="flex flex-col gap-1">
              <dt class="text-sm text-dim">{{ t().runtime }}</dt>
              <dd class="text-lg">{{ movie.runtime ? t().minutes(movie.runtime) : t().unknown }}</dd>
            </div>
          </dl>

          @if (movie.genres.length) {
            <section aria-labelledby="genres-heading" class="flex flex-col gap-3">
              <h2 id="genres-heading" class="text-sm text-dim">{{ t().genres }}</h2>
              <ul class="flex flex-wrap gap-2">
                @for (genre of movie.genres; track genre.id) {
                  <li class="rounded-full border border-edge px-3 py-1 text-sm">{{ genre.name }}</li>
                }
              </ul>
            </section>
          }

          <section aria-labelledby="overview-heading" class="flex max-w-prose flex-col gap-3">
            <h2 id="overview-heading" class="font-display text-xl font-medium">{{ t().overview }}</h2>
            <p class="text-lg leading-relaxed">{{ movie.overview || t().noOverview }}</p>
          </section>
        </div>
      </article>
    } @else {
      <div role="status" class="mt-6 grid animate-pulse gap-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-12 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <span class="sr-only">{{ t().loading }}</span>
        <div aria-hidden="true" class="mx-auto aspect-[2/3] w-full max-w-72 rounded-md bg-reel md:max-w-none"></div>
        <div aria-hidden="true" class="flex flex-col gap-4">
          <div class="h-12 w-3/4 rounded bg-reel"></div>
          <div class="h-5 w-1/2 rounded bg-reel"></div>
          <div class="mt-6 h-24 rounded bg-reel"></div>
        </div>
      </div>
    }
  `,
})
export class MovieDetailPage {
  private readonly languageService = inject(LanguageService);
  private readonly movieService = inject(MovieService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  /** `:id` route param, bound by the router. */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly t = this.languageService.t;
  protected readonly language = this.languageService.language;
  protected readonly error = this.movieService.detailsError;
  protected readonly movie = computed(() => {
    const movie = this.movieService.movieDetails();
    return movie?.id === this.id() ? movie : null;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      this.languageService.language();
      untracked(() => this.movieService.getMovieDetails(id));
    });

    effect(() => {
      const appName = this.t().appName;
      const movie = this.movie();
      this.title.setTitle(movie ? `${movie.title} — ${appName}` : appName);
    });
  }

  protected reload(): void {
    this.movieService.getMovieDetails(this.id());
  }

  /** Goes back in history when the user came from inside the app; otherwise opens the list. */
  protected goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/');
    }
  }
}
