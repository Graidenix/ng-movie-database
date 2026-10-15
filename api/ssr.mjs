// Vercel Function that renders every page with Angular SSR (see vercel.json rewrites).
// Imports the request handler from the Angular server build (`src/server.ts`).
export default async function handler(req, res) {
  const { reqHandler } = await import('../dist/ng-movie-database/server/server.mjs');
  return reqHandler(req, res);
}
