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
import { MovieSearch } from '@features/movies/movie-search/movie-search';
import { LanguageSwitcher } from '@layout/language-switcher/language-switcher';

@Component({
  selector: 'app-root',
  imports: [Logo, RouterOutlet, RouterLink, LanguageSwitcher, MovieSearch],
  host: { class: 'relative flex min-h-dvh flex-col' },
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly t = inject(LanguageService).t;

  protected readonly searchActive = signal(false);

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
    // scroll restoration doesn't always fire a scroll event
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

  // Move focus to <main> on page change so screen readers announce the new page.
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
        // don't steal focus from the search box while typing on a details page
        const typingInHeader = main.ownerDocument.activeElement?.closest('header') != null;
        if (previousPath !== null && path !== previousPath && !typingInHeader) {
          main.focus({ preventScroll: true });
        }
        previousPath = path;
      });
  }
}
