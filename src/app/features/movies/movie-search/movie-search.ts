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

// iOS only shows the "Search" key for type=search inside a form with an action attribute.
@Component({
  selector: 'app-movie-search',
  imports: [Icon, FormField],
  host: { class: 'contents' },
  templateUrl: './movie-search.html',
})
export class MovieSearch {
  private readonly router = inject(Router);
  protected readonly t = inject(LanguageService).t;

  private readonly query = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.readQuery()),
    ),
    { initialValue: this.readQuery() },
  );

  // Ignore our own navigation coming back through `query`, or it would overwrite what's typed.
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

  readonly focused = model(false);
  protected readonly filled = computed(() => this.searchForm.query().value().trim() !== '');

  constructor() {
    effect((onCleanup) => {
      const value = this.searchForm.query().value().trim();
      if (this.tooLong() || value === untracked(this.query).trim()) {
        return;
      }
      const timer = setTimeout(() => this.navigate(value, true), SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onSubmit(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    if (this.tooLong()) {
      return;
    }
    this.navigate(this.searchForm.query().value().trim(), false);
    input.blur();
  }

  // Replace while typing on the list (no history entry per keystroke); push when coming from
  // another page so Back returns there.
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
