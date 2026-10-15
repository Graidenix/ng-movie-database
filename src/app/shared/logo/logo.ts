import { Component } from '@angular/core';

/**
 * The app mark (same geometry as `public/favicon.svg`): a film frame with a play button and a
 * rating star. The window, sprocket holes and the gap around the star are real cut-outs (a mask),
 * so the mark works over backdrop images. Color comes from `currentColor`; size from the host's
 * height (`h-7`). Decorative: pair it with the app name.
 */
@Component({
  selector: 'app-logo',
  host: { 'aria-hidden': 'true', class: 'inline-block shrink-0' },
  template: `
    <svg viewBox="112 121 312 262" class="block h-full w-auto" fill="currentColor">
      <defs>
        <mask
          id="app-logo-cutouts"
          maskUnits="userSpaceOnUse"
          x="112"
          y="121"
          width="312"
          height="262"
        >
          <rect x="112" y="121" width="312" height="262" fill="#fff" />
          <rect x="181" y="149" width="150" height="188" rx="13" fill="#000" />
          <g fill="#000">
            <rect x="136" y="157" width="28" height="30" rx="6" />
            <rect x="136" y="209" width="28" height="30" rx="6" />
            <rect x="136" y="261" width="28" height="30" rx="6" />
            <rect x="136" y="310" width="28" height="30" rx="6" />
            <rect x="348" y="157" width="28" height="30" rx="6" />
            <rect x="348" y="209" width="28" height="30" rx="6" />
          </g>
          <path
            [attr.d]="starPath"
            fill="#000"
            stroke="#000"
            stroke-width="26"
            stroke-linejoin="round"
          />
        </mask>
      </defs>
      <rect x="118" y="127" width="277" height="233" rx="33" mask="url(#app-logo-cutouts)" />
      <path
        d="M221 196 L295 239 L221 282 Z"
        stroke="currentColor"
        stroke-width="12"
        stroke-linejoin="round"
      />
      <path [attr.d]="starPath" stroke="currentColor" stroke-width="8" stroke-linejoin="round" />
    </svg>
  `,
})
export class Logo {
  protected readonly starPath =
    'M355 260 L372 298.5 L414 302.8 L382.6 331 L391.4 372.2 L355 351 L318.6 372.2 L327.4 331 L296 302.8 L338 298.5Z';
}
