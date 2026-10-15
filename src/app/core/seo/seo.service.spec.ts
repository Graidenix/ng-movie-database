import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LanguageService } from '@core/i18n/language.service';
import { SITE_URL, SeoService, truncate } from './seo.service';

describe('SeoService', () => {
  let seo: SeoService;
  let document: Document;
  const meta = (selector: string) =>
    document.head.querySelector(`meta[${selector}]`)?.getAttribute('content');

  beforeEach(() => {
    TestBed.inject(LanguageService).setLanguage('en');
    seo = TestBed.inject(SeoService);
    document = TestBed.inject(DOCUMENT);
  });

  it('sets title, description, social tags, canonical and JSON-LD', () => {
    seo.update({
      title: 'The Matrix (1999) — Movie Database',
      description: 'A hacker learns the truth.',
      path: '/movie/603',
      image: 'https://image.tmdb.org/t/p/w1280/b.jpg',
      type: 'video.movie',
      jsonLd: { '@type': 'Movie', name: 'The Matrix </script>' },
    });

    expect(document.title).toBe('The Matrix (1999) — Movie Database');
    expect(meta('name="description"')).toBe('A hacker learns the truth.');
    expect(meta('name="robots"')).toBe('index, follow');
    expect(meta('property="og:type"')).toBe('video.movie');
    expect(meta('property="og:image"')).toBe('https://image.tmdb.org/t/p/w1280/b.jpg');
    expect(meta('name="twitter:card"')).toBe('summary_large_image');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/movie/603`,
    );
    const jsonLd = document.getElementById('structured-data')?.textContent ?? '';
    expect(jsonLd).not.toContain('</script>');
    expect(JSON.parse(jsonLd).name).toBe('The Matrix </script>');
  });

  it('marks pages noindex and removes stale image and JSON-LD', () => {
    seo.update({ title: 'A', description: 'B', path: '/', image: 'x', jsonLd: { a: 1 } });
    seo.update({ title: 'Search', description: 'B', path: '/', noindex: true });

    expect(meta('name="robots"')).toBe('noindex, follow');
    expect(meta('property="og:image"')).toBeUndefined();
    expect(meta('name="twitter:card"')).toBe('summary');
    expect(document.getElementById('structured-data')).toBeNull();
  });
});

describe('truncate', () => {
  it('keeps short text and cuts long text at a word boundary', () => {
    expect(truncate('  Short   text ', 160)).toBe('Short text');
    expect(truncate('one two three four five', 14)).toBe('one two three…');
  });
});
