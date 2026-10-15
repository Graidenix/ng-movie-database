import { REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

function serverService(headers: Record<string, string>): LanguageService {
  TestBed.configureTestingModule({
    providers: [{ provide: REQUEST, useValue: new Request('http://localhost/', { headers }) }],
  });
  return TestBed.inject(LanguageService);
}

describe('LanguageService', () => {
  afterEach(() => {
    document.cookie = 'lang=; Path=/; Max-Age=0';
  });

  it('uses the lang cookie on the server', () => {
    const service = serverService({ cookie: 'a=1; lang=ru', 'accept-language': 'en-US' });
    expect(service.language()).toBe('ru');
  });

  it('falls back to Accept-Language on the server', () => {
    expect(serverService({ 'accept-language': 'ru-RU,ru;q=0.9' }).language()).toBe('ru');
  });

  it('defaults to English for other languages', () => {
    expect(serverService({ 'accept-language': 'de-DE' }).language()).toBe('en');
  });

  it('persists the chosen language in a cookie and updates translations', () => {
    const service = TestBed.inject(LanguageService);
    service.setLanguage('ru');

    expect(document.cookie).toContain('lang=ru');
    expect(service.t().searchButton).toBe('Найти');
  });
});
