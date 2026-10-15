import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { filter } from 'rxjs';
import { LanguageService } from '@core/i18n/language.service';
import { LanguageSwitcher } from '@layout/language-switcher';

@Component({
  selector: 'app-root',
  imports: [Icon, RouterOutlet, RouterLink, LanguageSwitcher],
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a
      href="#main"
      class="fixed top-2 left-2 z-50 -translate-y-20 rounded-md bg-marquee px-4 py-2 font-semibold text-ink focus-visible:translate-y-0"
      (click)="skipToMain($event)"
    >
      {{ t().skipToContent }}
    </a>

    <header class="border-b border-seam">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a routerLink="/" class="flex items-center gap-2 rounded-md py-2 font-display text-base font-bold sm:text-lg">
          <app-icon name="movie" class="size-6 text-marquee" />
          {{ t().appName }}
        </a>
        <app-language-switcher />
      </div>
    </header>

    <main
      #main
      id="main"
      tabindex="-1"
      class="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-16 outline-none sm:px-6 lg:px-8"
    >
      <router-outlet />
    </main>

    <footer class="border-t border-seam">
      <p class="mx-auto max-w-7xl px-4 py-6 text-sm text-dim sm:px-6 lg:px-8">
        {{ t().tmdbAttribution }}
      </p>
    </footer>
  `,
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  protected readonly t = inject(LanguageService).t;

  constructor() {
    this.moveFocusOnPageChange();
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  /** Moves focus to the page content when the path changes, so screen readers announce the new page. */
  private moveFocusOnPageChange(): void {
    let previousPath: string | null = null;
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        if (previousPath !== null && path !== previousPath) {
          this.main().nativeElement.focus({ preventScroll: true });
        }
        previousPath = path;
      });
  }
}
