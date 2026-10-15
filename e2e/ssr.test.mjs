// Runs against the production build: npm run test:ssr
// axe runs in jsdom, so color-contrast is off (needs a real browser).
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
  server = spawn(
    process.execPath,
    ['--import', './e2e/mock-tmdb.mjs', 'dist/ng-movie-database/server/server.mjs'],
    {
      cwd: root,
      env: {
        ...process.env,
        PORT: String(PORT),
        TMDB_API_KEY: 'test',
        VERCEL: '',
      },
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
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
  it('uses the lang cookie', async () => {
    const { html } = await page('/', { cookie: 'lang=ru', 'accept-language': 'en-US' });
    assert.match(html, /<html lang="ru"/);
    assert.match(html, /Фильм 1/);
    assert.equal(transferState(html).renderedLanguage, 'ru');
  });

  it('falls back to Accept-Language', async () => {
    const { html } = await page('/', { 'accept-language': 'ru-RU,ru;q=0.9' });
    assert.match(html, /<html lang="ru"/);
  });

  it('puts api responses in transfer state', async () => {
    const state = transferState((await page('/')).html);
    const cached = Object.values(state).filter(
      (entry) => entry && typeof entry === 'object' && 'u' in entry,
    );
    const urls = cached.map((entry) => entry.u);
    assert.ok(urls.includes('/api/movies/popular'), `popular not in transfer state: ${urls}`);
    assert.ok(urls.includes('/api/movies/trending'), `trending not in transfer state: ${urls}`);
  });

  it('handles repeated q params', async () => {
    const { status, html } = await page('/?q=alien&q=matrix');
    assert.equal(status, 200);
    assert.match(html, /Results for “alien”/);
  });

  it('renders genre results', async () => {
    const { status, html } = await page('/?genre=1');
    assert.equal(status, 200);
    assert.match(html, /Genre: Drama/);
    assert.match(html, /Movie 31/);
    assert.match(html, /<meta name="robots" content="noindex/);
  });

  it('links genres on the movie page', async () => {
    const { html } = await page('/movie/7');
    assert.match(html, /href="\/\?genre=1"/);
  });

  it('returns 404 for unknown movies', async () => {
    const { status, html } = await page('/movie/404404');
    assert.equal(status, 404);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
  });

  it('returns 404 for unknown paths', async () => {
    const { status, html } = await page('/no/such/page');
    assert.equal(status, 404);
    assert.match(html, /data-testid="not-found"/);
    assert.match(html, /<title>Page not found — Movie Database<\/title>/);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
  });

  it('renders og/twitter tags', async () => {
    for (const path of ['/', '/movie/7', '/no/such/page']) {
      const { html } = await page(path);
      for (const tag of [
        'og:title',
        'og:description',
        'og:url',
        'og:type',
        'og:site_name',
        'og:image',
        'og:image:width',
        'og:image:height',
        'og:image:alt',
      ]) {
        assert.equal(
          (html.match(new RegExp(`<meta property="${tag}"`, 'g')) ?? []).length,
          1,
          `${path}: ${tag}`,
        );
      }
      assert.match(html, /<meta name="twitter:card" content="summary_large_image">/, path);
      assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/, path);
    }
    const home = (await page('/')).html;
    assert.match(
      home,
      /<meta property="og:image" content="https:\/\/movie-database\.odajiu\.eu\/og-image\.jpg">/,
    );
    assert.match(home, /<meta name="description" content="Find what to watch next:/);
  });

  it('builds movie descriptions', async () => {
    const { html } = await page('/movie/7');
    assert.match(
      html,
      /<meta name="description" content="Drama · 2024 · 101 min · rated 7\.4\/10\. A movie overview\.">/,
    );
    assert.match(html, /<meta property="og:image:width" content="1280">/);
  });

  it('renders movie JSON-LD', async () => {
    const { status, html } = await page('/movie/7');
    assert.equal(status, 200);
    assert.match(html, /"@type":"Movie"/);
    assert.match(
      html,
      /<link rel="canonical" href="https:\/\/movie-database\.odajiu\.eu\/movie\/7">/,
    );
  });
});

describe('axe', () => {
  const axeSource = readFileSync(fileURLToPath(import.meta.resolve('axe-core/axe.min.js')), 'utf8');

  for (const path of [
    '/',
    '/?q=alien',
    '/?genre=1',
    '/movie/7',
    '/movie/404404',
    '/no/such/page',
  ]) {
    it(`${path}`, async () => {
      const { html } = await page(path);
      const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
      dom.window.eval(axeSource);
      const results = await dom.window.axe.run(dom.window.document, {
        rules: { 'color-contrast': { enabled: false } },
      });
      const violations = Array.from(
        results.violations,
        (v) => `${v.id}: ${v.nodes.length} × ${v.help}`,
      );
      assert.equal(violations.length, 0, violations.join('\n'));
    });
  }
});
