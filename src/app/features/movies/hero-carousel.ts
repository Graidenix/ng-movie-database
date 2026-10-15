import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import {
  Component,
  DOCUMENT,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { Movie } from '@core/movies/movie.models';
import { Icon } from '@shared/icon/icon';

const SLIDE_DURATION_MS = 7000;
const SWIPE_THRESHOLD_PX = 50;

/**
 * Full-bleed hero carousel of trending movies (WAI-ARIA carousel pattern).
 *
 * Autoplay advances every 7 s. It pauses while the pointer is over the carousel, while focus is
 * inside it, while the tab is hidden, after the user presses Pause, and never starts when the
 * user prefers reduced motion. The active progress bar's CSS animation is the timer.
 */
@Component({
  selector: 'app-hero-carousel',
  imports: [Icon, NgOptimizedImage, DecimalPipe, RouterLink],
  host: {
    class: 'relative isolate block touch-pan-y overflow-hidden',
    'aria-roledescription': 'carousel',
    '[attr.aria-label]': 't().trendingHeading',
    '(mouseenter)': 'hovered.set(true)',
    '(mouseleave)': 'hovered.set(false)',
    '(focusin)': 'focusInside.set(true)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown.arrowleft)': 'previous()',
    '(keydown.arrowright)': 'next()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
  template: `
    <!--
      Slides share one grid cell, so the carousel is as tall as its tallest slide.
      Phones (portrait): the landscape backdrop is a 16:10 band on top, text below it.
      sm and up: the backdrop fills the hero behind the text.
    -->
    <div class="grid" [attr.aria-live]="autoplay() ? 'off' : 'polite'">
      @for (movie of movies(); track movie.id; let i = $index) {
        <div
          role="group"
          aria-roledescription="slide"
          data-testid="carousel-slide"
          [attr.aria-label]="t().slideLabel(i + 1, movies().length)"
          [attr.aria-hidden]="i !== index() ? 'true' : null"
          [attr.inert]="i !== index() ? '' : null"
          class="relative col-start-1 row-start-1 flex flex-col justify-start transition-opacity duration-700 ease-out sm:min-h-[min(82vh,48rem)] sm:justify-end"
          [class.opacity-0]="i !== index()"
          [class.z-10]="i === index()"
        >
          <div
            aria-hidden="true"
            class="relative -z-10 aspect-[16/10] w-full overflow-hidden sm:absolute sm:inset-0 sm:aspect-auto"
          >
            <img
              [ngSrc]="movie.backdrop_path!"
              [loaderParams]="{ kind: 'backdrop' }"
              fill
              [priority]="i === 0"
              sizes="100vw"
              alt=""
              class="object-cover object-[center_25%]"
              [class.backdrop-motion]="i === index()"
            />
            <!-- Phones: fade the band's bottom into the page. -->
            <div
              class="absolute inset-0 bg-linear-to-t from-ink via-ink/20 to-transparent sm:hidden"
            ></div>
            <div
              class="absolute inset-0 bg-linear-to-r from-ink via-ink/70 to-ink/5 max-sm:hidden"
            ></div>
            <div
              class="absolute inset-0 bg-linear-to-t from-ink via-ink/10 to-ink/50 max-sm:hidden"
            ></div>
          </div>

          <div
            class="page-container flex flex-col gap-4 pb-16 max-sm:-mt-12 sm:gap-5 sm:pt-32 sm:pb-24"
          >
            <h2 class="max-w-4xl font-display text-3xl leading-[1.08] text-balance sm:text-6xl">
              {{ movie.title }}
            </h2>
            <p class="flex items-center gap-4 text-dim">
              @if (movie.vote_average > 0) {
                <span class="inline-flex items-center gap-1.5 text-screen">
                  <app-icon name="star" filled class="size-4 text-marquee" />
                  <span class="sr-only">{{ t().rating }}:</span>
                  {{ movie.vote_average | number: '1.1-1' : language() }}
                </span>
              }
              @if (movie.release_date) {
                <span>{{ movie.release_date.slice(0, 4) }}</span>
              }
            </p>
            @if (movie.overview) {
              <p class="line-clamp-3 max-w-xl leading-relaxed text-screen/90 sm:text-lg">
                {{ movie.overview }}
              </p>
            }
            <div class="mt-2">
              <a
                data-testid="carousel-details-link"
                [routerLink]="['/movie', movie.id]"
                class="inline-flex h-12 items-center gap-2 rounded-full bg-marquee px-6 font-semibold text-ink transition-[scale,filter] hover:brightness-110 active:scale-95"
              >
                {{ t().viewDetails }}
                <app-icon name="arrow-right" class="size-5" />
              </a>
            </div>
          </div>
        </div>
      }
    </div>

    <!--
      Slide pickers: progress lines only. The active line also pauses / resumes autoplay
      (WCAG 2.2.2); it freezes mid-fill while paused.
    -->
    <div class="absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-8 sm:pb-10">
      <div data-testid="carousel-indicators" class="flex w-full max-w-xs items-center gap-1.5">
        @for (movie of movies(); track movie.id; let i = $index) {
          <button
            type="button"
            class="group flex h-6 flex-1 cursor-pointer items-center"
            [attr.data-testid]="'carousel-indicator-' + i"
            [attr.aria-label]="
              i === index()
                ? userPaused()
                  ? t().playSlideshow
                  : t().pauseSlideshow
                : t().goToSlide(i + 1, movie.title)
            "
            [attr.title]="
              i === index() ? (userPaused() ? t().playSlideshow : t().pauseSlideshow) : movie.title
            "
            [attr.aria-current]="i === index() ? 'true' : null"
            (click)="i === index() ? togglePause() : goTo(i)"
          >
            <span
              class="relative h-1 w-full overflow-hidden rounded-full bg-screen/25 transition-colors group-hover:bg-screen/45"
            >
              @if (i === index()) {
                <span
                  class="absolute inset-0 rounded-full bg-marquee"
                  [class.slide-progress]="animateProgress()"
                  [style.--slide-duration]="slideDuration"
                  [style.animation-play-state]="autoplay() ? 'running' : 'paused'"
                  (animationend)="next()"
                ></span>
              }
            </span>
          </button>
        }
      </div>
    </div>
  `,
})
export class HeroCarousel {
  private readonly languageService = inject(LanguageService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Slides; every movie must have a `backdrop_path`. */
  readonly movies = input.required<Movie[]>();

  protected readonly t = this.languageService.t;
  protected readonly language = this.languageService.language;
  protected readonly slideDuration = `${SLIDE_DURATION_MS}ms`;

  /** Active slide; back to the first one when the slides change (e.g. language switch). */
  protected readonly index = linkedSignal({ source: this.movies, computation: () => 0 });

  protected readonly userPaused = signal(false);
  protected readonly hovered = signal(false);
  protected readonly focusInside = signal(false);
  private readonly pageHidden = signal(false);
  private readonly reducedMotion = signal(false);
  /** False on the server and until hydration, so the timer only runs in an interactive page. */
  private readonly ready = signal(false);

  /** The active line runs as the timer, except for users who prefer reduced motion. */
  protected readonly animateProgress = computed(
    () => this.ready() && !this.reducedMotion() && this.movies().length > 1,
  );
  protected readonly autoplay = computed(
    () =>
      this.animateProgress() &&
      !this.userPaused() &&
      !this.hovered() &&
      !this.focusInside() &&
      !this.pageHidden(),
  );

  private pointerStartX: number | null = null;

  constructor() {
    afterNextRender(() => {
      const view = this.document.defaultView;
      const motionQuery = view?.matchMedia('(prefers-reduced-motion: reduce)');
      const syncMotion = () => this.reducedMotion.set(motionQuery?.matches ?? false);
      const syncVisibility = () => this.pageHidden.set(this.document.hidden);
      syncMotion();
      syncVisibility();
      motionQuery?.addEventListener('change', syncMotion);
      this.document.addEventListener('visibilitychange', syncVisibility);
      this.destroyRef.onDestroy(() => {
        motionQuery?.removeEventListener('change', syncMotion);
        this.document.removeEventListener('visibilitychange', syncVisibility);
      });
      this.ready.set(true);
    });
  }

  protected next(): void {
    this.index.update((index) => (index + 1) % this.movies().length);
  }

  protected previous(): void {
    const count = this.movies().length;
    this.index.update((index) => (index - 1 + count) % count);
  }

  protected togglePause(): void {
    this.userPaused.update((paused) => !paused);
  }

  protected goTo(index: number): void {
    this.index.set(index);
  }

  protected onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    this.focusInside.set(host.contains(event.relatedTarget as Node | null));
  }

  /** Horizontal swipe on touch screens. */
  protected onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.pointerType === 'touch' ? event.clientX : null;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) {
      return;
    }
    const distance = event.clientX - this.pointerStartX;
    this.pointerStartX = null;
    if (Math.abs(distance) >= SWIPE_THRESHOLD_PX) {
      if (distance < 0) {
        this.next();
      } else {
        this.previous();
      }
    }
  }
}
