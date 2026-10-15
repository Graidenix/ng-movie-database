import { Component } from '@angular/core';

// Same shape as public/favicon.svg, but with real cut-outs (mask) so it works over images.
@Component({
  selector: 'app-logo',
  host: { 'aria-hidden': 'true', class: 'inline-block shrink-0' },
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  protected readonly starPath =
    'M355 260 L372 298.5 L414 302.8 L382.6 331 L391.4 372.2 L355 351 L318.6 372.2 L327.4 331 L296 302.8 L338 298.5Z';
}
