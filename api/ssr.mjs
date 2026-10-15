// Renders pages with the Angular SSR build. Everything outside /api is rewritten here (vercel.json).
export default async function handler(req, res) {
  const { reqHandler } = await import('../dist/ng-movie-database/server/server.mjs');
  return reqHandler(req, res);
}
