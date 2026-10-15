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

  it('renders the app name and TMDB attribution', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('header')?.textContent).toContain('Movie Database');
    expect(element.querySelector('footer')?.textContent).toContain('TMDB');
  });

  it('switches the UI language', async () => {
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
});
