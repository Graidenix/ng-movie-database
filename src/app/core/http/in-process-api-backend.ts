import {
  FetchBackend,
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Handler, movieApiHandler } from '@api/movies/_lib/handlers';

// Server only (app.config.server.ts). SSR calls the api/ handlers directly instead of going
// over HTTP to itself. It sits at the backend, not in an interceptor, so the hydration
// transfer cache still records the responses.
@Injectable()
export class InProcessApiBackend implements HttpBackend {
  private readonly fetchBackend = inject(FetchBackend);

  handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const url = new URL(request.urlWithParams, 'http://localhost');
    const handler = request.method === 'GET' ? movieApiHandler(url.pathname) : undefined;
    return handler ? from(call(handler, url)) : this.fetchBackend.handle(request);
  }
}

async function call(handler: Handler, url: URL): Promise<HttpResponse<unknown>> {
  const response = await handler(new Request(url));
  const body: unknown = await response.json();
  const init = {
    headers: new HttpHeaders(Object.fromEntries(response.headers)),
    status: response.status,
    statusText: response.statusText,
    url: url.href,
  };
  if (!response.ok) {
    throw new HttpErrorResponse({ ...init, error: body });
  }
  return new HttpResponse({ ...init, body });
}
