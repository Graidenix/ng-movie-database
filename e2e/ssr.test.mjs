// SSR integration tests against the production build (run `ng build` first; `npm run test:ssr`).
// TMDb is mocked (e2e/mock-tmdb.mjs). Pages are also checked with axe-core in jsdom; color
// contrast and focus visibility need a real browser and stay a manual check.
import { spawn } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = 4310;
const BASE = `http://localhost:${PORT}`;
let server;

before(async () => {
  server = spawn(process.execPath, ['--import', './e2e/mock-tmdb.mjs', 'dist/ng-movie-database/server/server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT), TMDB_API_KEY: 'test', INTERNAL_API_TOKEN: 'e2e-token', VERCEL: '' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  for (let i = 0; i < 80; i++) {
    try {
      await fetch(`${BASE}/robots.txt`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('SSR server did not start');
});

after(() => server?.kill());

const page = async (path, headers = {}) => {
  const response = await fetch(BASE + path, { headers });
  return { status: response.status, html: await response.text() };
};
const transferState = (html) =>
  JSON.parse(html.match(/<script id="ng-state" type="application\/json">([\s\S]*?)<\/script>/)[1]);

describe('server rendering', () => {
  it('renders in the cookie language and tells the browser which one it used', async () => {
    const { html } = await page('/', { cookie: 'lang=ru', 'accept-language': 'en-US' });
    assert.match(html, /<html lang="ru"/);
    assert.match(html, /Фильм 1/);
    assert.equal(transferState(html).renderedLanguage, 'ru');
  });

  it('falls back to Accept-Language without a cookie', async () => {
    const { html } = await page('/', { 'accept-language': 'ru-RU,ru;q=0.9' });
    assert.match(html, /<html lang="ru"/);
  });

  it('hands API responses to the browser so hydration does not refetch them', async () => {
    const state = transferState((await page('/')).html);
    const cached = Object.values(state).filter((entry) => entry && typeof entry === 'object' && 'u' in entry);
    const urls = cached.map((entry) => entry.u);
    assert.ok(urls.includes('/api/movies/popular'), `popular not in transfer state: ${urls}`);
    assert.ok(urls.includes('/api/movies/trending'), `trending not in transfer state: ${urls}`);
  });

  it('survives a repeated q param and uses its first value', async () => {
    const { status, html } = await page('/?q=alien&q=matrix');
    assert.equal(status, 200);
    assert.match(html, /Results for “alien”/);
  });

  it('answers unknown movies with HTTP 404 and noindex', async () => {
    const { status, html } = await page('/movie/404404');
    assert.equal(status, 404);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
  });

  it('answers unknown paths with the 404 page and HTTP 404', async () => {
    const { status, html } = await page('/no/such/page');
    assert.equal(status, 404);
    assert.match(html, /data-testid="not-found"/);
    assert.match(html, /<title>Page not found — Movie Database<\/title>/);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
  });

  it('gives every page Open Graph and Twitter tags with a sized, described image', async () => {
    for (const path of ['/', '/movie/7', '/no/such/page']) {
      const { html } = await page(path);
      for (const tag of ['og:title', 'og:description', 'og:url', 'og:type', 'og:site_name', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) {
        assert.equal((html.match(new RegExp(`<meta property="${tag}"`, 'g')) ?? []).length, 1, `${path}: ${tag}`);
      }
      assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, path);
      assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/, path);
    }
    const home = (await page('/')).html;
    assert.match(home, /<meta property="og:image" content="https:\/\/movie-database\.odajiu\.eu\/og-image\.jpg">/);
    assert.match(home, /<meta name="description" content="Find what to watch next:/);
  });

  it('leads movie descriptions with the key facts', async () => {
    const { html } = await page('/movie/7');
    assert.match(html, /<meta name="description" content="Drama · 2024 · 101 min · rated 7\.4\/10\. A movie overview\.">/);
    assert.match(html, /<meta property="og:image:width" content="1280">/);
  });

  it('renders movie details with structured data', async () => {
    const { status, html } = await page('/movie/7');
    assert.equal(status, 200);
    assert.match(html, /"@type":"Movie"/);
    assert.match(html, /<link rel="canonical" href="https:\/\/movie-database\.odajiu\.eu\/movie\/7">/);
  });
});

describe('accessibility (axe-core, jsdom)', () => {
  const axeSource = readFileSync(fileURLToPath(import.meta.resolve('axe-core/axe.min.js')), 'utf8');

  for (const path of ['/', '/?q=alien', '/movie/7', '/movie/404404', '/no/such/page']) {
    it(`has no axe violations on ${path}`, async () => {
      const { html } = await page(path);
      const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
      dom.window.eval(axeSource);
      const results = await dom.window.axe.run(dom.window.document, {
        // Need real layout and rendering: checked manually in a browser.
        rules: { 'color-contrast': { enabled: false } },
      });
      const violations = Array.from(results.violations, (v) => `${v.id}: ${v.nodes.length} × ${v.help}`);
      assert.equal(violations.length, 0, violations.join('\n'));
    });
  }
});
