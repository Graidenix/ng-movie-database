import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { Movie } from '@core/movies/movie.models';
import { HeroCarousel } from './hero-carousel';

function movie(id: number): Movie {
  return {
    id,
    title: `Movie ${id}`,
    overview: 'Overview',
    poster_path: null,
    backdrop_path: `/b${id}.jpg`,
    release_date: '2026-01-01',
    vote_average: 7.5,
  };
}

describe('HeroCarousel', () => {
  async function setup() {
    TestBed.configureTestingModule({ imports: [HeroCarousel], providers: [provideRouter([])] });
    TestBed.inject(LanguageService).setLanguage('en');
    const fixture = TestBed.createComponent(HeroCarousel);
    fixture.componentRef.setInput('movies', [movie(1), movie(2), movie(3)]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const activeSlideLabel = () =>
      element
        .querySelector('[data-testid="carousel-slide"]:not([inert])')
        ?.getAttribute('aria-label');
    const indicator = (index: number) =>
      element.querySelector<HTMLButtonElement>(`[data-testid="carousel-indicator-${index}"]`)!;
    const press = async (key: string) => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key }));
      await fixture.whenStable();
    };
    return { fixture, element, activeSlideLabel, indicator, press };
  }

  it('should make inactive slides inert', async () => {
    const { element, activeSlideLabel } = await setup();

    expect(element.getAttribute('aria-roledescription')).toBe('carousel');
    expect(activeSlideLabel()).toBe('1 of 3');
    expect(element.querySelectorAll('[data-testid="carousel-slide"][inert]').length).toBe(2);
  });

  it('should navigate with arrows and indicators', async () => {
    const { fixture, activeSlideLabel, indicator, press } = await setup();

    await press('ArrowRight');
    expect(activeSlideLabel()).toBe('2 of 3');

    indicator(0).click();
    await fixture.whenStable();
    await press('ArrowLeft');
    expect(activeSlideLabel()).toBe('3 of 3');
  });

  it('should toggle pause from the active indicator', async () => {
    const { fixture, indicator } = await setup();
    const active = indicator(0);

    expect(active.getAttribute('aria-label')).toBe('Pause slideshow');
    expect(indicator(1).getAttribute('aria-label')).toBe('Show slide 2: Movie 2');

    active.click();
    await fixture.whenStable();
    expect(active.getAttribute('aria-label')).toBe('Play slideshow');

    active.click();
    await fixture.whenStable();
    expect(active.getAttribute('aria-label')).toBe('Pause slideshow');
  });

  it('should keep focus when changing slides', async () => {
    const { fixture, element } = await setup();
    const link = (slide: number) =>
      element.querySelectorAll<HTMLElement>('[data-testid="carousel-details-link"]')[slide];

    link(0).focus();
    link(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();

    expect(document.activeElement).toBe(link(1));
  });
});
