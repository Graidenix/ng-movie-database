import { TMDB_IMAGE_BREAKPOINTS, tmdbImageLoader } from './tmdb-image-loader';

describe('tmdbImageLoader', () => {
  it('caps high-DPI carousel backdrops at the largest optimized size', () => {
    for (const width of [...TMDB_IMAGE_BREAKPOINTS, 3840, 7680]) {
      const url = tmdbImageLoader({
        src: '/backdrop.jpg',
        width,
        loaderParams: { kind: 'backdrop' },
      });
      expect(url).not.toContain('/original/');
      if (width >= 1280) {
        expect(url).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg');
      }
    }
  });

  it('caps posters while still choosing smaller sizes when sufficient', () => {
    expect(tmdbImageLoader({ src: '/poster.jpg', width: 300 })).toBe(
      'https://image.tmdb.org/t/p/w342/poster.jpg',
    );
    expect(tmdbImageLoader({ src: '/poster.jpg', width: 1920 })).toBe(
      'https://image.tmdb.org/t/p/w780/poster.jpg',
    );
  });

  it('preserves local image URLs', () => {
    expect(
      tmdbImageLoader({ src: '/logo.png', width: 1920, loaderParams: { kind: 'static' } }),
    ).toBe('/logo.png');
  });
});
