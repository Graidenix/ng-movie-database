import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { LanguageService } from '@core/i18n/language.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render header and footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('header')?.textContent).toContain('Movie Database');
    expect(element.querySelector('footer')?.textContent).toContain('TMDB');
  });

  it('should switch language', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const ruButton = element.querySelector<HTMLButtonElement>('button[lang="ru"]');
    ruButton?.click();
    await fixture.whenStable();

    expect(TestBed.inject(LanguageService).language()).toBe('ru');
    expect(ruButton?.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('header')?.textContent).toContain('База фильмов');
    expect(document.documentElement.lang).toBe('ru');
  });

  it('should mark the header while search is focused', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const row = () => element.querySelector('[data-testid="site-header"] > div')!;
    const input = element.querySelector<HTMLInputElement>('[data-testid="search-input"]')!;

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await fixture.whenStable();
    expect(row().hasAttribute('data-search-active')).toBe(true);

    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await fixture.whenStable();
    expect(row().hasAttribute('data-search-active')).toBe(false);
  });
});
