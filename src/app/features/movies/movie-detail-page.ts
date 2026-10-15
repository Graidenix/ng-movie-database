import { DatePipe, DecimalPipe, Location, NgOptimizedImage, formatNumber } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  RESPONSE_INIT,
  numberAttribute,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { PosterPlaceholder } from '@shared/poster-placeholder';
import { LanguageService } from '@core/i18n/language.service';
import { MovieDetails } from '@core/movies/movie.models';
import { MovieService } from '@core/movies/movie.service';
import { tmdbImageUrl } from '@core/movies/tmdb-image-loader';
import { SITE_URL, SeoImage, SeoService } from '@core/seo/seo.service';
import { PosterTransition, posterTransitionName } from '@shared/poster-transition';

@Component({
  selector: 'app-movie-detail-page',
  imports: [Icon, PosterPlaceholder, NgOptimizedImage, DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="relative isolate">
      @if (movie()?.backdrop_path; as backdrop) {
        <div
          aria-hidden="true"
          class="absolute inset-x-0 top-0 -z-10 aspect-[16/10] overflow-hidden sm:aspect-auto sm:h-[min(80vh,48rem)]"
        >
          <img
            [ngSrc]="backdrop"
            [loaderParams]="{ kind: 'backdrop' }"
            fill
            priority
            sizes="100vw"
            alt=""
            class="backdrop-motion object-cover object-top"
          />
          <!-- Phones: the landscape backdrop is a short band, so keep more of it visible. -->
          <div
            class="absolute inset-0 bg-linear-to-t from-ink via-ink/40 to-ink/10 sm:hidden"
          ></div>
          <div
            class="absolute inset-0 bg-linear-to-t from-ink via-ink/85 to-ink/55 max-sm:hidden"
          ></div>
          <div
            class="absolute inset-0 bg-linear-to-r from-ink/80 via-transparent to-transparent max-sm:hidden"
          ></div>
        </div>
      }
      <div class="page-container pt-4 sm:pt-28">
        <button
          type="button"
          data-testid="back-button"
          class="btn-secondary -ml-1 h-11 border-transparent px-3"
          (click)="goBack()"
        >
          <app-icon name="arrow-left" class="size-5" />
          {{ t().back }}
        </button>

        @if (error(); as error) {
          <div
            data-testid="movie-details-error"
            class="mt-10 flex max-w-xl flex-col items-start gap-4"
          >
            <h1 class="font-display text-2xl">{{ t().errors[error] }}</h1>
            @if (error === 'notFound') {
              <a routerLink="/" class="font-medium text-marquee underline underline-offset-4">
                {{ t().showPopular }}
              </a>
            } @else {
              <button
                type="button"
                data-testid="movie-details-retry"
                class="btn-secondary"
                (click)="reload()"
              >
                {{ t().retry }}
              </button>
            }
          </div>
        } @else if (movie(); as movie) {
          <article
            data-testid="movie-details"
            [attr.data-movie-id]="movie.id"
            class="mt-6 grid gap-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-12 lg:grid-cols-[minmax(0,24rem)_1fr]"
          >
            <div class="mx-auto w-full max-w-72 md:max-w-none">
              @if (movie.poster_path) {
                <img
                  data-testid="movie-details-poster"
                  [ngSrc]="movie.poster_path"
                  width="500"
                  height="750"
                  priority
                  sizes="(min-width: 1024px) 24rem, (min-width: 768px) 20rem, 18rem"
                  alt=""
                  class="h-auto w-full rounded-md shadow-2xl shadow-black/60 ring-1 ring-seam"
                  [style.view-transition-name]="posterName(movie.id)"
                />
              } @else {
                <app-poster-placeholder
                  class="aspect-[2/3] overflow-hidden rounded-md ring-1 ring-seam"
                  [label]="t().noPoster"
                  [style.view-transition-name]="posterName(movie.id)"
                />
              }
            </div>

            <div class="flex min-w-0 flex-col gap-8">
              <header class="flex flex-col gap-3">
                <h1
                  data-testid="movie-details-title"
                  class="font-display text-3xl leading-[1.1] text-balance sm:text-5xl"
                >
                  {{ movie.title }}
                </h1>
                @if (movie.tagline) {
                  <p class="text-lg text-dim italic">{{ movie.tagline }}</p>
                }
              </header>

              <dl class="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-seam py-6 sm:grid-cols-3">
                <div class="flex flex-col gap-1">
                  <dt class="text-sm text-dim">{{ t().rating }}</dt>
                  <dd data-testid="movie-details-rating" class="flex flex-col">
                    @if (movie.vote_count > 0) {
                      <span>
                        <span class="font-display text-2xl text-marquee">
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
                  <dd data-testid="movie-details-release-date" class="text-lg">
                    {{
                      movie.release_date
                        ? (movie.release_date | date: 'longDate' : undefined : language())
                        : t().unknown
                    }}
                  </dd>
                </div>
                <div class="flex flex-col gap-1">
                  <dt class="text-sm text-dim">{{ t().runtime }}</dt>
                  <dd data-testid="movie-details-runtime" class="text-lg">
                    {{ movie.runtime ? t().minutes(movie.runtime) : t().unknown }}
                  </dd>
                </div>
              </dl>

              @if (movie.genres.length) {
                <section aria-labelledby="genres-heading" class="flex flex-col gap-3">
                  <h2 id="genres-heading" class="text-sm text-dim">{{ t().genres }}</h2>
                  <ul data-testid="movie-details-genres" class="flex flex-wrap gap-2">
                    @for (genre of movie.genres; track genre.id) {
                      <li class="rounded-full border border-edge px-3 py-1 text-sm">
                        {{ genre.name }}
                      </li>
                    }
                  </ul>
                </section>
              }

              <section aria-labelledby="overview-heading" class="flex max-w-prose flex-col gap-3">
                <h2 id="overview-heading" class="font-display text-xl">
                  {{ t().overview }}
                </h2>
                <p data-testid="movie-details-overview" class="text-lg leading-relaxed">
                  {{ movie.overview || t().noOverview }}
                </p>
              </section>
            </div>
          </article>
        } @else {
          <div
            role="status"
            data-testid="movie-details-loading"
            class="mt-6 grid animate-pulse gap-8 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-12 lg:grid-cols-[minmax(0,24rem)_1fr]"
          >
            <span class="sr-only">{{ t().loading }}</span>
            <div
              aria-hidden="true"
              class="mx-auto aspect-[2/3] w-full max-w-72 rounded-md bg-reel md:max-w-none"
            ></div>
            <div aria-hidden="true" class="flex flex-col gap-4">
              <div class="h-12 w-3/4 rounded bg-reel"></div>
              <div class="h-5 w-1/2 rounded bg-reel"></div>
              <div class="mt-6 h-24 rounded bg-reel"></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class MovieDetailPage {
  private readonly languageService = inject(LanguageService);
  private readonly movieService = inject(MovieService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  /** Server only: lets an unknown movie respond with HTTP 404. */
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });
  private readonly posterTransition = inject(PosterTransition);

  /** `:id` route param, bound by the router. */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly t = this.languageService.t;
  protected readonly language = this.languageService.language;
  protected readonly error = this.movieService.detailsError;
  protected readonly movie = computed(() => {
    const movie = this.movieService.movieDetails();
    return movie?.id === this.id() ? movie : null;
  });

  protected readonly posterName = posterTransitionName;

  constructor() {
    effect(() => {
      const id = this.id();
      // Coming back to the list morphs this poster into its card.
      untracked(() => this.posterTransition.setActive(id));
      this.languageService.language();
      untracked(() => this.movieService.getMovieDetails(id));
    });

    effect(() => {
      const movie = this.movie();
      const error = this.error();
      if (movie) {
        this.seo.update(this.movieSeo(movie));
      } else if (error) {
        if (error === 'notFound' && this.responseInit) {
          this.responseInit.status = 404;
        }
        this.seo.update({
          title: `${this.t().errors[error].replace(/\.$/, '')} — ${this.t().appName}`,
          description: this.t().seoDescription,
          path: `/movie/${this.id()}`,
          noindex: true,
        });
      }
    });
  }

  private movieSeo(movie: MovieDetails) {
    const t = this.t();
    const year = movie.release_date?.slice(0, 4);
    const path = `/movie/${movie.id}`;
    // TMDb sizes: w1280 backdrops are 1280×720, w780 posters 780×1170.
    const image: SeoImage | null = movie.backdrop_path
      ? {
          url: tmdbImageUrl(movie.backdrop_path, 'w1280'),
          width: 1280,
          height: 720,
          alt: movie.title,
        }
      : movie.poster_path
        ? {
            url: tmdbImageUrl(movie.poster_path, 'w780'),
            width: 780,
            height: 1170,
            alt: movie.title,
          }
        : null;
    const facts = t.movieFacts({
      genres: movie.genres.map((genre) => genre.name),
      year,
      minutes: movie.runtime,
      rating:
        movie.vote_count > 0
          ? formatNumber(movie.vote_average, this.language(), '1.1-1')
          : undefined,
    });
    const summary = movie.overview || movie.tagline || '';
    return {
      title: `${movie.title}${year ? ` (${year})` : ''} — ${t.appName}`,
      description: [facts && `${facts}.`, summary].filter(Boolean).join(' ') || t.seoDescription,
      path,
      image,
      type: 'video.movie' as const,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: movie.title,
        url: SITE_URL + path,
        description: movie.overview || undefined,
        image: movie.poster_path ? tmdbImageUrl(movie.poster_path, 'w780') : undefined,
        datePublished: movie.release_date || undefined,
        genre: movie.genres.map((genre) => genre.name),
        duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
        aggregateRating:
          movie.vote_count > 0
            ? {
                '@type': 'AggregateRating',
                ratingValue: Number(movie.vote_average.toFixed(1)),
                bestRating: 10,
                worstRating: 0,
                ratingCount: movie.vote_count,
              }
            : undefined,
      },
    };
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
