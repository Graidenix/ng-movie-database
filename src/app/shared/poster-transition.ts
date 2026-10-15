import { Service, signal } from '@angular/core';

// The movie whose poster morphs between list and details. Only that poster gets a
// view-transition-name, since names must be unique on the page.
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
