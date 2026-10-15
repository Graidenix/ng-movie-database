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
        image: null,
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
