import { Service, signal } from '@angular/core';

/**
 * Tracks which movie's poster takes part in the list ↔ details view transition.
 * Only that poster gets a `view-transition-name`, so names stay unique on the page.
 */
@Service()
export class PosterTransition {
  private readonly activeIdState = signal<number | null>(null);
  readonly activeId = this.activeIdState.asReadonly();

  setActive(id: number): void {
    this.activeIdState.set(id);
  }
}

export function posterTransitionName(id: number): string {
  return `poster-${id}`;
}
