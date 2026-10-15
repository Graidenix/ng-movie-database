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

  it('should read the lang cookie', () => {
    const service = serverService({ cookie: 'a=1; lang=ru', 'accept-language': 'en-US' });
    expect(service.language()).toBe('ru');
  });

  it('should fall back to Accept-Language', () => {
    expect(serverService({ 'accept-language': 'ru-RU,ru;q=0.9' }).language()).toBe('ru');
  });

  it('should default to English', () => {
    expect(serverService({ 'accept-language': 'de-DE' }).language()).toBe('en');
  });

  it('should save the language in a cookie', () => {
    const service = TestBed.inject(LanguageService);
    service.setLanguage('ru');

    expect(document.cookie).toContain('lang=ru');
    expect(service.t().searchButton).toBe('Найти');
  });
});
