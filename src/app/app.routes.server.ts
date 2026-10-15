import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every page renders per request: content depends on the `lang` cookie and on live TMDb data,
 * so nothing can be prerendered at build time. Unknown paths render the 404 page with HTTP 404.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'movie/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
