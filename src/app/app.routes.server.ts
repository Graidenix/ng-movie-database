import { RenderMode, ServerRoute } from '@angular/ssr';

// Nothing is prerendered: pages depend on the lang cookie and live TMDb data.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'movie/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
