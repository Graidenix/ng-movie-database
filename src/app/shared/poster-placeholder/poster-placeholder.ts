import { Component, input } from '@angular/core';
import { Logo } from '@shared/logo/logo';

@Component({
  selector: 'app-poster-placeholder',
  imports: [Logo],
  host: {
    'data-testid': 'poster-placeholder',
    class:
      'flex size-full flex-col items-center justify-center gap-3 bg-reel bg-[radial-gradient(circle_at_50%_40%,var(--color-seam)_0%,transparent_70%)] p-4 text-center',
  },
  templateUrl: './poster-placeholder.html',
})
export class PosterPlaceholder {
  readonly label = input.required<string>();
}
