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
import { PosterPlaceholder } from '@shared/poster-placeholder/poster-placeholder';
import { LanguageService } from '@core/i18n/language.service';
import { MovieDetails } from '@core/movies/movie.models';
import { MovieService } from '@core/movies/movie.service';
import { tmdbImageUrl } from '@core/movies/tmdb-image-loader';
import { SITE_URL, SeoImage, SeoService } from '@core/seo/seo.service';
import { PosterTransition, posterTransitionName } from '@shared/poster-transition';

@Component({
  selector: 'app-movie-detail-page',
  imports: [Icon, PosterPlaceholder, NgOptimizedImage, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './movie-detail-page.html',
  styleUrl: './movie-detail-page.scss',
})
export class MovieDetailPage {
  private readonly languageService = inject(LanguageService);
  private readonly movieService = inject(MovieService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  // server only
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });
  private readonly posterTransition = inject(PosterTransition);

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
    // w1280 backdrops are 1280x720, w780 posters 780x1170
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

  // Opened directly (no app history)? Go to the list instead of leaving the site.
  protected goBack(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/');
    }
  }
}
