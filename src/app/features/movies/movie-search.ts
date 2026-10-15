import { Component, computed, effect, inject, linkedSignal, model, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { MAX_SEARCH_QUERY_LENGTH } from '@api/movies/_lib/limits';
import { NavigationEnd, Router } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { Icon } from '@shared/icon/icon';
import { firstQueryParam } from '@shared/query-param';
import { filter, map } from 'rxjs';

const SEARCH_DEBOUNCE_MS = 350;

/**
 * Header search. Keeps the `q` query param of the movie list in sync with what the user types.
 *
 * - Desktop: a compact pill that widens while focused or holding a query.
 * - Mobile: a search icon that expands to fill the header row while focused; the header hides
 *   the logo and language switcher meanwhile (bound through `focused`).
 *
 * Results update as you type; the Search button (and Enter / the keyboard's Search key) searches
 * immediately. `type="search"` + `enterkeyhint` + a form with an `action` give mobile keyboards a
 * "Search" key (iOS Safari needs the action attribute).
 *
 * Queries are limited to the API's maximum length: the validator also sets the native `maxlength`,
 * and a too-long query arriving from the URL shows an inline message instead of being searched.
 */
@Component({
  selector: 'app-movie-search',
  imports: [Icon, FormField],
  host: { class: 'contents' },
  template: `
    <form
      role="search"
      action=""
      data-testid="search-form"
      class="group z-30 flex h-11 items-center overflow-hidden gap-1 rounded-full border border-edge bg-ink/70 backdrop-blur-md transition-[width,border-color,box-shadow] duration-300 ease-out focus-within:border-marquee/70 focus-within:ring-4 focus-within:ring-marquee/15 max-sm:w-11 max-sm:data-focused:w-full max-sm:data-focused:pr-1.5 sm:w-48 sm:pr-1.5 sm:data-filled:w-72 sm:data-focused:w-72 md:data-filled:w-96 md:data-focused:w-96"
      [attr.data-focused]="focused() ? '' : null"
      [attr.data-filled]="filled() ? '' : null"
      (submit)="onSubmit($event, input)"
      (focusin)="focused.set(true)"
      (focusout)="focused.set(false)"
    >
      <label
        for="movie-search"
        class="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-dim"
      >
        <app-icon name="search" class="size-5" />
        <span class="sr-only">{{ t().searchLabel }}</span>
      </label>
      <input
        #input
        id="movie-search"
        data-testid="search-input"
        type="search"
        inputmode="search"
        enterkeyhint="search"
        autocomplete="off"
        [formField]="searchForm.query"
        [placeholder]="focused() ? t().searchPlaceholder : t().searchShort"
        [attr.aria-invalid]="tooLong() ? 'true' : null"
        [attr.aria-describedby]="tooLong() ? 'movie-search-error' : null"
        (keydown.escape)="input.blur()"
        class="h-full min-w-0 flex-1 bg-transparent text-base text-screen outline-none placeholder:text-dim [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        data-testid="search-submit"
        class="hidden h-8 shrink-0 cursor-pointer items-center rounded-full bg-marquee px-4 text-sm font-semibold text-ink transition-[scale,filter] group-data-focused:flex hover:brightness-110 active:scale-95 sm:group-data-filled:flex"
        (mousedown)="$event.preventDefault()"
      >
        {{ t().searchButton }}
      </button>
    </form>
    @if (tooLong()) {
      <p
        id="movie-search-error"
        data-testid="search-error"
        role="alert"
        class="absolute top-full right-4 mt-1 rounded-md bg-ink px-3 py-1.5 text-sm text-alert ring-1 ring-alert/60 sm:right-6 lg:right-8"
      >
        {{ t().searchTooLong }}
      </p>
    }
  `,
})
export class MovieSearch {
  private readonly router = inject(Router);
  protected readonly t = inject(LanguageService).t;

  /** `q` of the current URL ('' outside the list or without a search). */
  private readonly query = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.readQuery()),
    ),
    { initialValue: this.readQuery() },
  );

  /** Last value this component pushed to the URL; ignored when it comes back via `query`. */
  private lastNavigatedQuery: string | null = null;

  private readonly model = linkedSignal<string, { query: string }>({
    source: this.query,
    computation: (query, previous) =>
      previous && query === this.lastNavigatedQuery ? previous.value : { query },
  });
  protected readonly searchForm = form(this.model, (path) => {
    maxLength(path.query, MAX_SEARCH_QUERY_LENGTH);
  });
  protected readonly tooLong = computed(() => this.searchForm.query().invalid());

  /** True while focus is inside the search; two-way bound so the header can make room. */
  readonly focused = model(false);
  protected readonly filled = computed(() => this.searchForm.query().value().trim() !== '');

  constructor() {
    // Typing filters results after a short pause.
    effect((onCleanup) => {
      const value = this.searchForm.query().value().trim();
      if (this.tooLong() || value === untracked(this.query).trim()) {
        return;
      }
      const timer = setTimeout(() => this.navigate(value, true), SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  /** Enter / Search: search now and close the on-screen keyboard. */
  protected onSubmit(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    if (this.tooLong()) {
      return;
    }
    this.navigate(this.searchForm.query().value().trim(), false);
    input.blur();
  }

  /**
   * Shows results on the movie list. While typing on the list, the URL is replaced instead of
   * pushed, so Back doesn't step through every keystroke; coming from another page pushes, so
   * Back returns there.
   */
  private navigate(query: string, typing: boolean): void {
    const onList = this.router.url.split(/[?#]/)[0] === '/';
    this.lastNavigatedQuery = query;
    void this.router.navigate(['/'], {
      queryParams: { q: query || null },
      replaceUrl: typing && onList,
    });
  }

  private readQuery(): string {
    const path = this.router.url.split(/[?#]/)[0];
    return path === '/'
      ? firstQueryParam(this.router.parseUrl(this.router.url).queryParams['q'])
      : '';
  }
}
