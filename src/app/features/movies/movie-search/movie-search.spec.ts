import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LanguageService } from '@core/i18n/language.service';
import { MovieSearch } from './movie-search';

@Component({ template: '' })
class Blank {}

const DEBOUNCE_WAIT_MS = 450;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('MovieSearch', () => {
  let router: Router;

  async function setup(url = '/') {
    TestBed.configureTestingModule({
      imports: [MovieSearch],
      providers: [
        provideRouter([
          { path: '', component: Blank },
          { path: 'movie/:id', component: Blank },
        ]),
      ],
    });
    TestBed.inject(LanguageService).setLanguage('en');
    router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    const fixture = TestBed.createComponent(MovieSearch);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('[data-testid="search-input"]')!;
    const type = async (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    return { fixture, element, input, type };
  }

  it('should handle repeated q params', async () => {
    const { input } = await setup('/?q=alien&q=matrix');
    expect(input.value).toBe('alien');
  });

  it('should debounce typing', async () => {
    const { type } = await setup();
    await type('matrix');
    expect(router.url).toBe('/');

    await wait(DEBOUNCE_WAIT_MS);
    expect(router.url).toBe('/?q=matrix');
  });

  it('should search on submit and blur', async () => {
    const { element, input, type, fixture } = await setup();
    input.focus();
    await type('alien');

    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();

    expect(router.url).toBe('/?q=alien');
    expect(document.activeElement).not.toBe(input);
  });

  it('should push history from details page', async () => {
    const { type } = await setup('/movie/603');
    const navigate = vi.spyOn(router, 'navigate');
    await type('alien');
    await wait(DEBOUNCE_WAIT_MS);

    expect(router.url).toBe('/?q=alien');
    expect(navigate.mock.calls[0][1]?.replaceUrl).toBe(false);
  });

  it('should enforce max length', async () => {
    const { element, input, fixture } = await setup(`/?q=${'x'.repeat(120)}`);
    await fixture.whenStable();

    expect(input.maxLength).toBe(100);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector('[data-testid="search-error"]')?.textContent).toContain('100');

    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await wait(DEBOUNCE_WAIT_MS);
    expect(router.url).toBe(`/?q=${'x'.repeat(120)}`);
  });
});
