import { timingSafeEqual } from 'node:crypto';
import { json } from './tmdb';

/** Header carrying `INTERNAL_API_TOKEN` on the app's own server-side (SSR) calls. */
export const INTERNAL_TOKEN_HEADER = 'x-internal-token';

/** Requests one client may make per window, per function instance. */
const LIMIT = 60;
const WINDOW_MS = 60_000;
/** Forget idle clients so the map can't grow without bound. */
const MAX_TRACKED_CLIENTS = 10_000;

const hits = new Map<string, { count: number; resetAt: number }>();

type Handler = (request: Request) => Promise<Response>;

/**
 * Best-effort, per-instance rate limit (fixed window per client IP). Function instances don't
 * share memory, so this only blunts bursts against one warm instance. The production limit is a
 * Vercel Firewall rate-limit rule on `/api/*` (see docs/decisions.md, decision 13).
 *
 * SSR calls come from the function's own IP for every visitor, so they are exempt when they carry
 * the server-only `INTERNAL_API_TOKEN`.
 */
export function withRateLimit(handler: Handler): Handler {
  return (request) => {
    if (isInternal(request)) {
      return handler(request);
    }
    const now = Date.now();
    const client = clientId(request);
    let entry = hits.get(client);
    if (!entry || entry.resetAt <= now) {
      if (hits.size >= MAX_TRACKED_CLIENTS) {
        pruneExpired(now);
      }
      entry = { count: 0, resetAt: now + WINDOW_MS };
      hits.set(client, entry);
    }
    entry.count += 1;
    if (entry.count > LIMIT) {
      const retryAfter = String(Math.ceil((entry.resetAt - now) / 1000));
      return Promise.resolve(
        json({ error: 'Too many requests' }, 429, { 'retry-after': retryAfter }),
      );
    }
    return handler(request);
  };
}

function isInternal(request: Request): boolean {
  const token = process.env['INTERNAL_API_TOKEN'];
  const sent = request.headers.get(INTERNAL_TOKEN_HEADER);
  if (!token || !sent) {
    return false;
  }
  const expected = Buffer.from(token);
  const actual = Buffer.from(sent);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function clientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

function pruneExpired(now: number): void {
  for (const [client, entry] of hits) {
    if (entry.resetAt <= now) {
      hits.delete(client);
    }
  }
  if (hits.size >= MAX_TRACKED_CLIENTS) {
    hits.clear();
  }
}

/** Test hook: start from a clean slate. */
export function resetRateLimit(): void {
  hits.clear();
}
