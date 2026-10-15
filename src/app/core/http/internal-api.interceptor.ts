import { HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';

/**
 * Server-only secret that marks the app's own SSR calls to `/api`, so the API's per-IP rate limit
 * doesn't throttle every visitor rendered by one server instance. Null in the browser.
 */
export const INTERNAL_API_TOKEN = new InjectionToken<string | null>('INTERNAL_API_TOKEN', {
  factory: () => null,
});

/** Adds the internal token to `/api` requests made during server rendering. */
export const internalApiInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(INTERNAL_API_TOKEN);
  const isApiCall = new URL(request.url, 'http://localhost').pathname.startsWith('/api/');
  return token && isApiCall
    ? next(request.clone({ setHeaders: { 'x-internal-token': token } }))
    : next(request);
};
