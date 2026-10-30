#!/usr/bin/env node
/**
 * regen-mirrors.mjs — rebuild the plain-Markdown mirror pages under /llms/.
 *
 * The neon.com/pricing.md pattern: for each important page, emit a faithful
 * plain-text Markdown version that AI agents and crawlers can parse cleanly.
 *
 * It is driven by a config file at the project root: `geo-mirror.config.json`.
 * The chanmeng-geo-markdown-mirror skill writes this for you; a minimal example:
 *
 * {
 *   "origin": "https://example.com",      // canonical site URL (for headers/links)
 *   "outDir": "public/llms",              // where mirrors are written (public/ or static/)
 *   "devBase": "http://localhost:3000",   // base URL for render-mode fetches
 *   "pages": [
 *     { "route": "/",        "slug": "index",   "title": "Home",    "mode": "render" },
 *     { "route": "/pricing", "slug": "pricing", "title": "Pricing", "mode": "render" },
 *     { "route": "/docs/intro", "slug": "docs-intro", "title": "Intro",
 *       "mode": "source", "source": "docs/intro.mdx" }
 *   ]
 * }
 *
 * Modes:
 *   - "source": read a local .md/.mdx file, strip JSX/imports, keep the markdown.
 *               Cheapest and most faithful — use when a markdown source exists.
 *   - "render": fetch the rendered page HTML and convert to Markdown (turndown).
 *               Use for component-built pages (Next.js/Vite app routes).
 *
 * Flags:
 *   --headless   Use a headless browser for render-mode (needed for client-only
 *                SPAs whose content appears after JS runs). Requires `playwright`.
 *   --only=slug  Regenerate just one page (comma-separate for several).
 *
 * HAND-FLATTENED WIDGETS ARE PRESERVED.
 *   Interactive widgets (pricing sliders, tab groups) must be flattened to a
 *   plain Markdown table by a human/agent — a scraper can't do it well. Wrap that
 *   hand-authored block in markers and this script keeps it across regenerations:
 *
 *     <!-- mirror:manual -->
 *     | Plan | Price | Storage |
 *     | ---- | ----- | ------- |
 *     | Free | $0    | 0.5 GB  |
 *     <!-- /mirror:manual -->
 *
 *   Everything outside the markers is regenerated; everything inside is retained.
 *
 * Requirements (install in the target project as needed):
 *   render mode:           npm i -D turndown
 *   render mode --headless: npm i -D turndown playwright   (then: npx playwright install chromium)
 *   source mode:           no extra deps
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const useHeadless = args.includes('--headless');
const onlyArg = args.find((a) => a.startsWith('--only='));
const onlySlugs = onlyArg ? onlyArg.split('=')[1].split(',') : null;

const CONFIG = path.join(root, 'geo-mirror.config.json');
const MANUAL_OPEN = '<!-- mirror:manual -->';
const MANUAL_CLOSE = '<!-- /mirror:manual -->';

function today() {
  // ISO date without time; avoids locale surprises.
  return new Date().toISOString().slice(0, 10);
}

async function loadConfig() {
  if (!existsSync(CONFIG)) {
    console.error(`Missing ${path.relative(root, CONFIG)}. See the script header for the shape.`);
    process.exit(1);
  }
  return JSON.parse(await readFile(CONFIG, 'utf8'));
}

/** Strip MDX imports/exports and JSX tags, keeping inner text and markdown. */
function stripMdx(src) {
  let s = src;
  // Drop the frontmatter block (we re-add our own header).
  s = s.replace(/^---\n[\s\S]*?\n---\n/, '');
  // Drop import/export lines.
  s = s.replace(/^\s*(import|export)\s.*$/gm, '');
  // Remove self-closing JSX components: <Foo .../>
  s = s.replace(/<([A-Z][\w.]*)\b[^>]*\/>/g, '');
  // Unwrap paired JSX components, keeping inner content: <Foo ...>inner</Foo>
  // Run a few passes to handle simple nesting.
  for (let i = 0; i < 5; i++) {
    s = s.replace(/<([A-Z][\w.]*)\b[^>]*>([\s\S]*?)<\/\1>/g, '$2');
  }
  // Collapse 3+ blank lines.
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

async function htmlToMarkdown(html) {
  let TurndownService;
  try {
    ({ default: TurndownService } = await import('turndown'));
  } catch {
    console.error('render mode needs turndown:  npm i -D turndown');
    process.exit(1);
  }
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  // Keep tables as Markdown tables (turndown drops them by default).
  td.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content) => ' ' + content.trim() + ' |',
  });
  td.addRule('tableRow', {
    filter: 'tr',
    replacement: (content) => '|' + content + '\n',
  });
  // Drop script/style/nav/footer chrome so the mirror is content-only.
  td.remove(['script', 'style', 'noscript', 'svg']);
  // Prefer the main content region if present.
  const main = html.match(/<(main|article)\b[^>]*>([\s\S]*?)<\/\1>/i);
  return td.turndown(main ? main[2] : html).trim();
}

async function fetchRendered(url) {
  if (useHeadless) {
    let chromium;
    try {
      ({ chromium } = await import('playwright'));
    } catch {
      console.error('--headless needs playwright:  npm i -D playwright && npx playwright install chromium');
      process.exit(1);
    }
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      return await page.content();
    } finally {
      await browser.close();
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return await res.text();
}

/** Pull any existing hand-flattened blocks out of a previous mirror file. */
async function readManualBlocks(outPath) {
  if (!existsSync(outPath)) return [];
  const prev = await readFile(outPath, 'utf8');
  const blocks = [];
  const re = new RegExp(`${MANUAL_OPEN}[\\s\\S]*?${MANUAL_CLOSE}`, 'g');
  let m;
  while ((m = re.exec(prev))) blocks.push(m[0]);
  return blocks;
}

function header(page, origin) {
  const url = origin ? origin.replace(/\/$/, '') + page.route : page.route;
  return [
    '---',
    `title: ${page.title || page.slug}`,
    `source: ${url}`,
    `lastmod: ${today()}`,
    '---',
    '',
    `> Plain-text mirror of ${url} for AI agents and LLMs.`,
    `> Canonical page: ${url}`,
    '',
    '',
  ].join('\n');
}

async function buildPage(page, cfg) {
  let body;
  if (page.mode === 'source') {
    const srcPath = path.join(root, page.source);
    if (!existsSync(srcPath)) throw new Error(`source not found: ${page.source}`);
    body = stripMdx(await readFile(srcPath, 'utf8'));
  } else {
    const url = (cfg.devBase || cfg.origin || '').replace(/\/$/, '') + page.route;
    body = await htmlToMarkdown(await fetchRendered(url));
  }

  const outPath = path.join(root, cfg.outDir, `${page.slug}.md`);
  const manualBlocks = await readManualBlocks(outPath);

  let content = header(page, cfg.origin) + body + '\n';
  // Re-append preserved manual blocks if they were stripped by regeneration.
  for (const block of manualBlocks) {
    if (!content.includes(block)) content += '\n' + block + '\n';
  }
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, content, 'utf8');
  return path.relative(root, outPath);
}

async function main() {
  const cfg = await loadConfig();
  const pages = (cfg.pages || []).filter((p) => !onlySlugs || onlySlugs.includes(p.slug));
  if (pages.length === 0) {
    console.error('No pages to regenerate (check config / --only filter).');
    process.exit(1);
  }
  console.log(`Regenerating ${pages.length} mirror(s) -> ${cfg.outDir}${useHeadless ? ' [headless]' : ''}`);
  for (const page of pages) {
    try {
      const rel = await buildPage(page, cfg);
      console.log(`  ✓ ${page.route}  ->  ${rel}`);
    } catch (err) {
      console.error(`  ✗ ${page.route}: ${err.message}`);
    }
  }
  console.log('Done. Review the output and flatten any interactive widgets between');
  console.log(`${MANUAL_OPEN} ... ${MANUAL_CLOSE} markers, then run "npm run build:llms".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
