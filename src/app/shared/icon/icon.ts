import { Component, booleanAttribute, input } from '@angular/core';

export type IconName = 'search' | 'arrow-left' | 'arrow-right' | 'star' | 'alert';

// Atlas Icons (https://iconsatlas.com), inlined. Decorative only.
@Component({
  selector: 'app-icon',
  host: { 'aria-hidden': 'true', class: 'inline-block shrink-0' },
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly filled = input(false, { transform: booleanAttribute });
}
