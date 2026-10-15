import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every page renders per request: content depends on the `lang` cookie and on live TMDb data,
 * so nothing can be prerendered at build time.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
