import { TRANSLATIONS, format } from './translations';

describe('translations', () => {
  it('should fill placeholders and leave unknown ones', () => {
    expect(format('{a} of {b}', { a: 1, b: 2 })).toBe('1 of 2');
    expect(format('{a} {missing}', { a: '{b}', b: 'x' })).toBe('{b} {missing}');
  });

  it('should pick English plural forms', () => {
    const { votes } = TRANSLATIONS.en;
    expect(votes(1)).toBe('1 vote');
    expect(votes(0)).toBe('0 votes');
    expect(votes(21)).toBe('21 votes');
  });

  it('should pick Russian plural forms', () => {
    const { votes, resultsCount } = TRANSLATIONS.ru;
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map(votes)).toEqual([
      '1 голос',
      '2 голоса',
      '5 голосов',
      '11 голосов',
      '12 голосов',
      '21 голос',
      '22 голоса',
      '25 голосов',
      '111 голосов',
    ]);
    expect(resultsCount(21)).toBe('Показан 21 фильм');
    expect(resultsCount(40)).toBe('Показано 40 фильмов');
  });

  it('should build computed texts', () => {
    expect(TRANSLATIONS.ru.slideLabel(2, 5)).toBe('2 из 5');
    expect(TRANSLATIONS.en.errors.queryTooLong).toContain('100 characters');
    expect(
      TRANSLATIONS.en.movieFacts({
        genres: ['drama', 'crime'],
        year: '1994',
        minutes: 142,
        rating: '8.7',
      }),
    ).toBe('Drama, crime · 1994 · 142 min · rated 8.7/10');
    expect(TRANSLATIONS.ru.movieFacts({ genres: [], year: '1994' })).toBe('1994');
  });

  it('should have no unfilled placeholders in plain texts', () => {
    for (const translations of Object.values(TRANSLATIONS)) {
      const texts = Object.values(translations).flatMap<unknown>((value) =>
        typeof value === 'string' ? [value] : typeof value === 'object' ? Object.values(value) : [],
      );
      expect(texts.filter((text) => /\{\w+\}/.test(String(text)))).toEqual([]);
    }
  });
});
