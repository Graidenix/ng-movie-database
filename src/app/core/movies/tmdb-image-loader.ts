import { ImageLoaderConfig } from '@angular/common';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/** Image widths TMDb serves for each image kind. */
const TMDB_WIDTHS = {
  poster: [92, 154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
} as const;

/** `NgOptimizedImage` srcset breakpoints: every poster and backdrop size, plus a large-screen step. */
export const TMDB_IMAGE_BREAKPOINTS = [92, 154, 185, 300, 342, 500, 780, 1280, 1920];

export type TmdbImageKind = keyof typeof TMDB_WIDTHS;

/**
 * `NgOptimizedImage` loader that maps a requested width to the closest TMDb size.
 * Pass `[loaderParams]="{ kind: 'backdrop' }"` for backdrops; posters are the default.
 */
export function tmdbImageLoader({ src, width, loaderParams }: ImageLoaderConfig): string {
  const kind: TmdbImageKind = loaderParams?.['kind'] === 'backdrop' ? 'backdrop' : 'poster';
  const widths: readonly number[] = TMDB_WIDTHS[kind];
  const size = width ? widths.find((w) => w >= width) : widths[widths.length - 2];
  return `${TMDB_IMAGE_BASE_URL}${size ? `w${size}` : 'original'}${src}`;
}

/** Absolute TMDb image URL at a fixed size, e.g. for social previews and structured data. */
export function tmdbImageUrl(path: string, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
}
