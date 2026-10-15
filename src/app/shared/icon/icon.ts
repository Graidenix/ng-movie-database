import { Component, booleanAttribute, input } from '@angular/core';

export type IconName = 'search' | 'arrow-left' | 'star' | 'movie' | 'alert';

/**
 * Decorative icon from Atlas Icons (https://iconsatlas.com, ISC license), inlined as SVG.
 * Size and color come from the host classes (`size-5 text-dim`). Always hidden from assistive
 * tech: pair it with visible or `sr-only` text.
 */
@Component({
  selector: 'app-icon',
  host: { 'aria-hidden': 'true', class: 'inline-block shrink-0' },
  template: `
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-miterlimit="10"
      class="block size-full"
      [attr.fill]="filled() ? 'currentColor' : 'none'"
    >
      @switch (name()) {
        @case ('search') {
          <svg:circle cx="9.14" cy="9.14" r="7.64" />
          <svg:path d="m22.5 22.5-8.11-8.11" />
        }
        @case ('arrow-left') {
          <svg:path d="M2.5 12h21M10.14 4.36 2.5 12l7.64 7.64" />
        }
        @case ('star') {
          <svg:path
            d="m12 2.78 2.94 5.95 6.56.95-4.75 4.63 1.12 6.54L12 17.77l-5.87 3.08 1.12-6.54L2.5 9.68l6.56-.95L12 2.78z"
          />
        }
        @case ('movie') {
          <svg:path
            d="M1.5 2.45h21v19.09h-21zM1.5 7.23h21M2.45 2.45l4.78 4.78M7.23 2.45 12 7.23M12 2.45l4.77 4.78M16.77 2.45l4.78 4.78M5.32 12h13.36M5.32 16.77h7.63"
          />
        }
        @case ('alert') {
          <svg:path
            d="M12 3.41a1.71 1.71 0 0 0-1.46.81l-8.81 14.1a1.48 1.48 0 0 0-.23.79A1.48 1.48 0 0 0 3 20.59h18a1.48 1.48 0 0 0 1.48-1.48 1.48 1.48 0 0 0-.23-.79l-8.79-14.1A1.71 1.71 0 0 0 12 3.41ZM12 8.18v6.68M12 15.82v1.91"
          />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  /** Fills closed shapes with the current color (e.g. a solid rating star). */
  readonly filled = input(false, { transform: booleanAttribute });
}
