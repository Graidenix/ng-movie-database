import { ImageLoaderConfig } from '@angular/common';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

const TMDB_WIDTHS = {
  poster: [92, 154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
};

export const TMDB_IMAGE_BREAKPOINTS = [92, 154, 185, 300, 342, 500, 780, 1280, 1920];

// Picks the smallest TMDb size that covers the requested width.
// Use [loaderParams]="{ kind: 'backdrop' }" for backdrops.
export function tmdbImageLoader({ src, width, loaderParams }: ImageLoaderConfig): string {
  const widths = loaderParams?.['kind'] === 'backdrop' ? TMDB_WIDTHS.backdrop : TMDB_WIDTHS.poster;
  const size = width ? widths.find((w) => w >= width) : widths[widths.length - 2];
  return `${TMDB_IMAGE_BASE_URL}${size ? `w${size}` : 'original'}${src}`;
}

export function tmdbImageUrl(path: string, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
}
