import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { PosterPlaceholder } from '@shared/poster-placeholder/poster-placeholder';
import { LanguageService } from '@core/i18n/language.service';
import { Movie } from '@core/movies/movie.models';
import { PosterTransition, posterTransitionName } from '@shared/poster-transition';

@Component({
  selector: 'app-movie-card',
  imports: [Icon, PosterPlaceholder, RouterLink, NgOptimizedImage, DecimalPipe],
  host: { class: 'block', 'data-testid': 'movie-card', '[attr.data-movie-id]': 'movie().id' },
  templateUrl: './movie-card.html',
})
export class MovieCard {
  private readonly languageService = inject(LanguageService);
  private readonly posterTransition = inject(PosterTransition);

  readonly movie = input.required<Movie>();
  readonly priority = input(false);

  protected readonly t = this.languageService.t;
  protected readonly language = this.languageService.language;
  protected readonly year = computed(() => this.movie().release_date?.slice(0, 4) ?? '');

  protected readonly transitionName = computed(() =>
    this.posterTransition.activeId() === this.movie().id
      ? posterTransitionName(this.movie().id)
      : null,
  );

  // Set the name right away: the router snapshots the old page before change detection runs.
  protected startPosterTransition(poster: HTMLElement): void {
    const id = this.movie().id;
    poster.style.viewTransitionName = posterTransitionName(id);
    this.posterTransition.setActive(id);
  }
}
