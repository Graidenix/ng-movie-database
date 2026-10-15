import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { LanguageService } from '@core/i18n/language.service';
import { MovieService } from '@core/movies/movie.service';
import { SITE_URL, SeoService } from '@core/seo/seo.service';
import { HeroCarousel } from '@features/movies/hero-carousel/hero-carousel';
import { firstQueryParam } from '@shared/query-param';
import { MovieCard } from '@features/movies/movie-card/movie-card';

const SKELETON_CARDS = Array.from({ length: 10 }, (_, index) => index);
const PRIORITY_CARDS = 5;
const PAGE_SIZE = 20;

@Component({
  selector: 'app-movie-list-page',
  imports: [Icon, MovieCard, HeroCarousel, RouterLink],
  templateUrl: './movie-list-page.html',
  styleUrl: './movie-list-page.scss',
})
export class MovieListPage {
  private readonly languageService = inject(LanguageService);
  private readonly seo = inject(SeoService);
  protected readonly movieService = inject(MovieService);

  readonly q = input('', { transform: firstQueryParam });
  readonly genre = input('', { transform: firstQueryParam });

  protected readonly t = this.languageService.t;
  protected readonly query = this.q;
  // null: no genre filter; NaN: an invalid ?genre= value, reported as genreNotFound.
  private readonly genreId = computed(() => {
    const value = this.genre().trim();
    if (!value) return null;
    return /^\d{1,10}$/.test(value) ? Number(value) : NaN;
  });
  protected readonly movies = this.movieService.movies;
  protected readonly loading = this.movieService.loading;
  protected readonly error = this.movieService.error;
  protected readonly hasMore = this.movieService.hasMore;
  protected readonly searchQuery = this.movieService.query;
  protected readonly skeletonCards = SKELETON_CARDS;
  protected readonly priorityCards = PRIORITY_CARDS;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly heroMovies = computed(() =>
    this.query().trim() || this.genreId() !== null ? [] : this.movieService.trending(),
  );

  protected readonly refreshing = this.movieService.refreshing;

  protected readonly heading = computed(() => {
    const t = this.t();
    const query = this.query().trim();
    if (query) return t.resultsHeading(query);
    if (this.genreId() === null) return t.popularHeading;
    const name = this.movieService.genreName();
    return name ? t.genreHeading(name) : t.genres;
  });

  protected readonly status = computed(() => {
    if (this.loading()) return this.t().loading;
    if (this.error()) return '';
    return this.t().resultsCount(this.movies().length);
  });

  constructor() {
    effect(() => {
      const query = this.query().trim();
      const genreId = this.genreId();
      this.languageService.language();
      untracked(() => {
        this.movieService.getTrendingMovies();
        if (query) {
          this.movieService.searchMovies(query);
        } else if (genreId !== null) {
          this.movieService.getGenreMovies(genreId);
        } else {
          this.movieService.getPopularMovies();
        }
      });
    });

    effect(() => {
      const t = this.t();
      const query = this.query().trim();
      const filtered = !!query || this.genreId() !== null;
      this.seo.update({
        title: filtered ? `${this.heading()} — ${t.appName}` : t.appName,
        description: t.seoDescription,
        path: '/',
        image: null,
        noindex: filtered,
        jsonLd: filtered
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
