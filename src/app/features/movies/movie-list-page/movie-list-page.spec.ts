import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { MovieListPage } from './movie-list-page';

const EMPTY_PAGE = { page: 1, results: [], total_pages: 1, total_results: 0 };

describe('MovieListPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MovieListPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(LanguageService).setLanguage('en');
    http = TestBed.inject(HttpTestingController);
  });

  async function render(q: unknown) {
    const fixture = TestBed.createComponent(MovieListPage);
    fixture.componentRef.setInput('q', q);
    await fixture.whenStable();
    http.match((r) => r.url === '/api/movies/trending').forEach((r) => r.flush(EMPTY_PAGE));
    return fixture;
  }

  it('should handle repeated q params', async () => {
    const fixture = await render(['alien', 'matrix']);

    const search = http.expectOne((r) => r.url === '/api/movies/search');
    expect(search.request.params.get('query')).toBe('alien');
    search.flush(EMPTY_PAGE);
    await fixture.whenStable();

    const heading = (fixture.nativeElement as HTMLElement).querySelector('#movie-list-heading');
    expect(heading?.textContent).toContain('Results for “alien”');
  });

  it('should show popular when q is cleared', async () => {
    const fixture = await render('alien');
    http.expectOne((r) => r.url === '/api/movies/search').flush(EMPTY_PAGE);

    fixture.componentRef.setInput('q', undefined);
    await fixture.whenStable();

    http.expectOne((r) => r.url === '/api/movies/popular').flush(EMPTY_PAGE);
    await fixture.whenStable();
    const heading = (fixture.nativeElement as HTMLElement).querySelector('#movie-list-heading');
    expect(heading?.textContent).toContain('Popular right now');
  });

  it('should show an error for too long queries', async () => {
    const fixture = await render('x'.repeat(101));
    http.expectNone((r) => r.url === '/api/movies/search');

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="movie-list-error"]')?.textContent).toContain(
      'Use up to 100 characters',
    );
    expect(element.querySelector('[data-testid="movie-list-retry"]')).toBeNull();
  });
});
