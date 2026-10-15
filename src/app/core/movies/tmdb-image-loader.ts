import { ImageLoaderConfig } from '@angular/common';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/** Poster widths TMDb serves; also used as `NgOptimizedImage` srcset breakpoints. */
export const TMDB_POSTER_WIDTHS = [92, 154, 185, 342, 500, 780];

/** `NgOptimizedImage` loader that maps a requested width to the closest TMDb poster size. */
export function tmdbImageLoader({ src, width }: ImageLoaderConfig): string {
  const size = width ? TMDB_POSTER_WIDTHS.find((w) => w >= width) : 500;
  return `${TMDB_IMAGE_BASE_URL}${size ? `w${size}` : 'original'}${src}`;
}
