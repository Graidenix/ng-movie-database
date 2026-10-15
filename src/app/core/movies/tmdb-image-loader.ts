import { ImageLoaderConfig } from '@angular/common';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

const TMDB_WIDTHS = {
  poster: [92, 154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
};

export const TMDB_IMAGE_BREAKPOINTS = [92, 154, 185, 300, 342, 500, 780, 1280, 1920];

// Picks the smallest TMDb size that covers the requested width, capped at its
// largest optimized size. Originals can be huge on high-DPI screens, especially
// when several full-width carousel backdrops are decoded together.
// Use [loaderParams]="{ kind: 'backdrop' }" for backdrops and { kind: 'static' } for our own files.
export function tmdbImageLoader({ src, width, loaderParams }: ImageLoaderConfig): string {
  if (loaderParams?.['kind'] === 'static') {
    return src;
  }
  const widths = loaderParams?.['kind'] === 'backdrop' ? TMDB_WIDTHS.backdrop : TMDB_WIDTHS.poster;
  const size = width
    ? (widths.find((w) => w >= width) ?? widths[widths.length - 1])
    : widths[widths.length - 2];
  return `${TMDB_IMAGE_BASE_URL}w${size}${src}`;
}

export function tmdbImageUrl(path: string, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
}
