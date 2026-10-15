import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
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
const SLIDE_SELECTOR = '[data-testid="carousel-slide"]';
const DETAILS_LINK_SELECTOR = '[data-testid="carousel-details-link"]';

// Autoplay is driven by the active indicator's CSS animation (animationend -> next).
// Pauses on hover, focus, hidden tab or the user's request; off with reduced motion.
@Component({
  selector: 'app-hero-carousel',
  imports: [Icon, NgOptimizedImage, DecimalPipe, RouterLink],
  host: {
    class: 'relative isolate block touch-pan-y',
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
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss',
})
export class HeroCarousel {
  private readonly languageService = inject(LanguageService);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  // all movies need a backdrop_path
  readonly movies = input.required<Movie[]>();

  protected readonly t = this.languageService.t;
  protected readonly language = this.languageService.language;
  protected readonly slideDuration = `${SLIDE_DURATION_MS}ms`;

  protected readonly index = linkedSignal({ source: this.movies, computation: () => 0 });

  protected readonly userPaused = signal(false);
  protected readonly hovered = signal(false);
  protected readonly focusInside = signal(false);
  private readonly pageHidden = signal(false);
  private readonly reducedMotion = signal(false);
  // no timer until the page is hydrated
  private readonly ready = signal(false);

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
    this.show((this.index() + 1) % this.movies().length);
  }

  protected previous(): void {
    const count = this.movies().length;
    this.show((this.index() - 1 + count) % count);
  }

  protected togglePause(): void {
    this.userPaused.update((paused) => !paused);
  }

  protected goTo(index: number): void {
    this.show(index);
  }

  // The old slide turns inert, so move focus along with it if it was inside.
  private show(index: number): void {
    const host = this.host.nativeElement;
    const active = this.document.activeElement;
    const focusInSlide = !!active && host.contains(active) && !!active.closest(SLIDE_SELECTOR);
    this.index.set(index);
    if (focusInSlide) {
      afterNextRender(
        () =>
          host
            .querySelector<HTMLElement>(`${SLIDE_SELECTOR}:not([inert]) ${DETAILS_LINK_SELECTOR}`)
            ?.focus(),
        { injector: this.injector },
      );
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    this.focusInside.set(host.contains(event.relatedTarget as Node | null));
  }

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
