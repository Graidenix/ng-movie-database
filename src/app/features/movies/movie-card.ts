import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { LanguageService } from '@core/i18n/language.service';
import { Movie } from '@core/movies/movie.models';

@Component({
  selector: 'app-movie-card',
  imports: [Icon, RouterLink, NgOptimizedImage, DecimalPipe],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/movie', movie().id]"
      class="group flex flex-col gap-3 rounded-md focus-visible:outline-offset-4"
    >
      <div
        class="relative aspect-[2/3] overflow-hidden rounded-md bg-reel ring-1 ring-seam transition-[box-shadow] duration-200 group-hover:ring-2 group-hover:ring-marquee"
      >
        @if (movie().poster_path; as poster) {
          <img
            [ngSrc]="poster"
            fill
            [priority]="priority()"
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
            alt=""
            class="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        } @else {
          <span class="absolute inset-0 grid place-items-center p-4 text-center text-sm text-dim">
            {{ t().noPoster }}
          </span>
        }
      </div>
      <div class="flex flex-col gap-1">
        <h3 class="text-base leading-snug font-semibold text-screen text-balance">
          {{ movie().title }}
        </h3>
        <p class="flex items-center gap-3 text-sm text-dim">
          @if (year()) {
            <span>{{ year() }}</span>
          }
          @if (movie().vote_average > 0) {
            <span class="inline-flex items-center gap-1">
              <app-icon name="star" filled class="size-3.5 text-marquee" />
              <span class="sr-only">{{ t().rating }}:</span>
              {{ movie().vote_average | number: '1.1-1' : language() }}
            </span>
          }
        </p>
        <p class="line-clamp-3 text-sm text-dim">
          {{ movie().overview || t().noOverview }}
        </p>
      </div>
    </a>
  `,
})
export class MovieCard {
  private readonly languageService = inject(LanguageService);

  readonly movie = input.required<Movie>();
  /** Loads the poster eagerly; set for cards visible on first paint. */
  readonly priority = input(false);

  protected readonly t = this.languageService.t;
  protected readonly language = this.languageService.language;
  protected readonly year = computed(() => this.movie().release_date?.slice(0, 4) ?? '');
}
