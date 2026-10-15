import { Component } from '@angular/core';

// Same shape as public/favicon.svg, but with real cut-outs (mask) so it works over images.
@Component({
  selector: 'app-logo',
  host: { 'aria-hidden': 'true', class: 'inline-block shrink-0' },
  templateUrl: './logo.html',
})
export class Logo {}
