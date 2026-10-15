import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet, Scroll } from '@angular/router';
import { Logo } from '@shared/logo/logo';
import { filter } from 'rxjs';
import { LanguageService } from '@core/i18n/language.service';
import { MovieSearch } from '@features/movies/movie-search';
import { LanguageSwitcher } from '@layout/language-switcher';

@Component({
  selector: 'app-root',
  imports: [Logo, RouterOutlet, RouterLink, LanguageSwitcher, MovieSearch],
  host: { class: 'relative flex min-h-dvh flex-col' },
  template: `
    <a
      href="#main"
      class="fixed top-2 left-2 z-50 -translate-y-20 rounded-md bg-marquee px-4 py-2 font-semibold text-ink focus-visible:translate-y-0"
      (click)="skipToMain($event)"
    >
      {{ t().skipToContent }}
    </a>

    <!--
      Sticky. From sm up, the negative margin lets page heroes run underneath it; on phones it
      takes its own space so landscape backdrops show in full below it. Transparent over the hero,
      a solid blurred bar once the page scrolls. Its own transition name keeps it still during
      page transitions.
    -->
    <header
      data-testid="site-header"
      class="sticky top-0 z-30 sm:-mb-18 bg-linear-to-b from-ink/90 to-transparent transition-[background-color,border-color] duration-300 [view-transition-name:site-header] data-scrolled:border-b data-scrolled:border-seam data-scrolled:bg-ink/85 data-scrolled:backdrop-blur-md"
      [attr.data-scrolled]="scrolled() ? '' : null"
    >
      <div
        class="page-container relative flex h-18 items-center gap-3"
        [attr.data-search-active]="searchActive() ? '' : null"
      >
        <a
          routerLink="/"
          data-testid="home-link"
          class="max-sm:in-data-search-active:hidden mr-auto flex items-center gap-2 rounded-md py-2 font-display text-base sm:text-lg"
        >
          <app-logo class="h-7 text-marquee" />
          <span class="max-sm:sr-only">{{ t().appName }}</span>
        </a>
        <!-- Phones: an active search takes the whole row; logo and languages step aside. -->
        <app-movie-search [(focused)]="searchActive" />
        <app-language-switcher class="max-sm:in-data-search-active:hidden" />
      </div>
    </header>

    <main
      #main
      id="main"
      tabindex="-1"
      data-testid="main-content"
      class="w-full flex-1 pb-16 outline-none"
    >
      <router-outlet />
    </main>

    <footer data-testid="site-footer" class="border-t border-seam">
      <p class="page-container py-6 text-sm text-dim">
        {{ t().tmdbAttribution }}
      </p>
    </footer>
  `,
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly t = inject(LanguageService).t;

  /** Focus is in the header search (phones give it the whole header row). */
  protected readonly searchActive = signal(false);

  /** Page scrolled past the top: the header switches from transparent to a solid bar. */
  protected readonly scrolled = signal(false);

  constructor() {
    this.moveFocusOnPageChange();
    afterNextRender(() => this.trackScroll());
  }

  private trackScroll(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    const update = () => this.scrolled.set(view.scrollY > 8);
    update();
    view.addEventListener('scroll', update, { passive: true });
    // Scroll restoration after a navigation can land at the top without a scroll event.
    const navigation = this.router.events
      .pipe(filter((event) => event instanceof Scroll))
      .subscribe(() => view.requestAnimationFrame(update));
    this.destroyRef.onDestroy(() => {
      view.removeEventListener('scroll', update);
      navigation.unsubscribe();
    });
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  /** Moves focus to the page content when the path changes, so screen readers announce the new page. */
  private moveFocusOnPageChange(): void {
    let previousPath: string | null = null;
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        const main = this.main().nativeElement;
        // Don't pull focus out of the header search while the user types from a detail page.
        const typingInHeader = main.ownerDocument.activeElement?.closest('header') != null;
        if (previousPath !== null && path !== previousPath && !typingInHeader) {
          main.focus({ preventScroll: true });
        }
        previousPath = path;
      });
  }
}
