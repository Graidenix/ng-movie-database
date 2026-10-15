import { Component, input } from '@angular/core';
import { Logo } from '@shared/logo/logo';

/**
 * Stand-in for a movie without a poster: the app mark, faint, on a subtle film-frame texture,
 * with a short label. Fills its (2:3) container.
 */
@Component({
  selector: 'app-poster-placeholder',
  imports: [Logo],
  host: {
    'data-testid': 'poster-placeholder',
    class:
      'flex size-full flex-col items-center justify-center gap-3 bg-reel bg-[radial-gradient(circle_at_50%_40%,var(--color-seam)_0%,transparent_70%)] p-4 text-center',
  },
  template: `
    <app-logo class="h-1/5 max-h-20 min-h-8 text-edge" />
    <span class="text-sm text-dim">{{ label() }}</span>
  `,
})
export class PosterPlaceholder {
  /** Visible label, e.g. "No poster". */
  readonly label = input.required<string>();
}
