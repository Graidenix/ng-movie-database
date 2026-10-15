import type { Handler } from './handlers';
import { json } from './tmdb';

const LIMIT = 60;
const WINDOW_MS = 60_000;
const MAX_CLIENTS = 10_000;

const hits = new Map<string, { count: number; resetAt: number }>();

// Fixed window per client IP. Each function instance keeps its own counters, so this only
// catches bursts; the real limit is a Vercel Firewall rule on /api/*.
// SSR doesn't go through here: it calls the handlers in-process (InProcessApiBackend).
export function withRateLimit(handler: Handler): Handler {
  return (request) => {
    const now = Date.now();
    const client = clientId(request);
    let entry = hits.get(client);
    if (!entry || entry.resetAt <= now) {
      if (hits.size >= MAX_CLIENTS) {
        hits.clear();
      }
      entry = { count: 0, resetAt: now + WINDOW_MS };
      hits.set(client, entry);
    }

    entry.count++;
    if (entry.count > LIMIT) {
      const retryAfter = String(Math.ceil((entry.resetAt - now) / 1000));
      return Promise.resolve(
        json({ error: 'Too many requests' }, 429, { 'retry-after': retryAfter }),
      );
    }
    return handler(request);
  };
}

function clientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

// For tests.
export function resetRateLimit(): void {
  hits.clear();
}
