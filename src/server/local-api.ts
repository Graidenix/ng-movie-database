import { GET as getMovie } from '@api/movies/[id]';
import { GET as getGenreMovies } from '@api/movies/genre';
import { GET as getPopularMovies } from '@api/movies/popular';
import { GET as searchMovies } from '@api/movies/search';
import { GET as getTrendingMovies } from '@api/movies/trending';
import { GET as getSitemap } from '@api/sitemap';
import type { Express, Request as ExpressRequest, Response as ExpressResponse } from 'express';

type WebHandler = (request: Request) => Promise<Response>;

// Development only: outside Vercel (ng serve, serve:ssr) there are no api/ functions,
// so the browser's /api calls and /sitemap.xml are served from Express instead.
export function mountLocalApi(app: Express): void {
  app.get('/api/movies/popular', adapt(getPopularMovies));
  app.get('/api/movies/search', adapt(searchMovies));
  app.get('/api/movies/trending', adapt(getTrendingMovies));
  app.get('/api/movies/genre', adapt(getGenreMovies));
  app.get('/api/movies/:id', adapt(getMovie));
  app.get('/sitemap.xml', adapt(getSitemap));
}

function adapt(handler: WebHandler) {
  return async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
    const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);
    const response = await handler(new Request(url, { headers: req.headers as HeadersInit }));
    res.status(response.status);
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.send(Buffer.from(await response.arrayBuffer()));
  };
}
