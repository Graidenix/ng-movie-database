import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Outside Vercel (`ng serve`, `node dist/.../server.mjs`), serve the `api/` Vercel Functions from
 * this server so the app works locally. On Vercel, `/api/*` is handled by the functions directly
 * and never reaches this server.
 */
if (!process.env['VERCEL']) {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: TMDB_API_KEY must come from the environment.
  }
  const { mountLocalApi } = await import('./server/local-api');
  mountLocalApi(app);
}

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) and by the Vercel
 * SSR function (`api/ssr.mjs`).
 */
export const reqHandler = createNodeRequestHandler(app);
