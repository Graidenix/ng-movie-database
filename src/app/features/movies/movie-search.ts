import { Component, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Icon } from '@shared/icon/icon';
import { LanguageService } from '@core/i18n/language.service';

const SEARCH_DEBOUNCE_MS = 350;

/** Search box that keeps the `q` query param in sync with what the user types. */
@Component({
  selector: 'app-movie-search',
  imports: [Icon, FormField],
  template: `
    <form role="search" class="flex flex-col gap-3" (submit)="onSubmit($event)">
      <label for="movie-search" class="text-sm font-medium text-dim">{{ t().searchLabel }}</label>
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="relative flex-1">
          <app-icon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-dim" />
          <input
            id="movie-search"
            type="search"
            autocomplete="off"
            enterkeyhint="search"
            [formField]="searchForm.query"
            [placeholder]="t().searchPlaceholder"
            class="h-14 w-full rounded-md border border-edge bg-reel pr-4 pl-12 text-lg text-screen placeholder:text-dim focus-visible:border-marquee"
          />
        </div>
        <button
          type="submit"
          class="h-14 cursor-pointer rounded-md bg-marquee px-8 text-base font-semibold text-ink transition-colors hover:bg-marquee-hover active:bg-marquee-press"
        >
          {{ t().searchButton }}
        </button>
      </div>
    </form>
  `,
})
export class MovieSearch {
  private readonly router = inject(Router);
  protected readonly t = inject(LanguageService).t;

  /** Current query from the URL. */
  readonly query = input('');

  /** Last value this component pushed to the URL; ignored when it comes back via `query`. */
  private lastNavigatedQuery: string | null = null;

  private readonly model = linkedSignal<string, { query: string }>({
    source: this.query,
    computation: (query, previous) =>
      previous && query === this.lastNavigatedQuery ? previous.value : { query },
  });
  protected readonly searchForm = form(this.model);

  constructor() {
    // Typing filters results after a short pause.
    effect((onCleanup) => {
      const value = this.searchForm.query().value().trim();
      if (value === untracked(this.query).trim()) {
        return;
      }
      const timer = setTimeout(() => this.navigate(value, true), SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.navigate(this.searchForm.query().value().trim(), false);
  }

  private navigate(query: string, replaceUrl: boolean): void {
    this.lastNavigatedQuery = query;
    void this.router.navigate([], { queryParams: { q: query || null }, replaceUrl });
  }
}
