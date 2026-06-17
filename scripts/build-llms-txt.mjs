#!/usr/bin/env node
/**
 * build-llms-txt.mjs — regenerate llms.txt from the /llms/ mirror folder.
 *
 * Produces an llmstxt.org-style index so agents discover every mirror. It reads
 * each mirror's frontmatter (title, source) and the first prose line as a
 * summary, then writes llms.txt next to the mirror folder.
 *
 * Driven by the same geo-mirror.config.json:
 *   {
 *     "name": "Example",                 // project / site name
 *     "summary": "One-line description.", // optional blockquote under the title
 *     "origin": "https://example.com",
 *     "outDir": "public/llms"            // mirrors live here; llms.txt goes in its parent
 *   }
 *
 * The generated index is regenerated from the folder so links can't drift. Edit
 * the per-page summary lines in the mirrors' frontmatter/first line for quality;
 * re-run to propagate.
 *
 * No external dependencies.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const CONFIG = path.join(root, 'geo-mirror.config.json');

async function loadConfig() {
  if (!existsSync(CONFIG)) {
    console.error('Missing geo-mirror.config.json. See the script header for the shape.');
    process.exit(1);
  }
  return JSON.parse(await readFile(CONFIG, 'utf8'));
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { data: {}, body: md };
  const data = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { data, body: m[2] };
}

/** First non-empty, non-blockquote, non-heading line = a usable summary. */
function firstProseLine(body) {
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('>') || line.startsWith('#')) continue;
    return line.replace(/[*_`#]/g, '').slice(0, 160);
  }
  return '';
}

async function main() {
  const cfg = await loadConfig();
  const mirrorDir = path.join(root, cfg.outDir);
  if (!existsSync(mirrorDir)) {
    console.error(`Mirror folder not found: ${cfg.outDir}. Run regen-mirrors first.`);
    process.exit(1);
  }
  const files = (await readdir(mirrorDir)).filter((f) => f.endsWith('.md')).sort();
  const webBase = '/' + path.basename(cfg.outDir); // e.g. /llms

  const lines = [];
  lines.push(`# ${cfg.name || path.basename(root)}`);
  lines.push('');
  if (cfg.summary) {
    lines.push(`> ${cfg.summary}`);
    lines.push('');
  }
  lines.push('Plain-text Markdown mirrors of this site\'s key pages, for AI agents and LLMs.');
  lines.push('');
  lines.push('## Pages');
  lines.push('');
  for (const file of files) {
    const { data, body } = parseFrontmatter(await readFile(path.join(mirrorDir, file), 'utf8'));
    const title = data.title || file.replace(/\.md$/, '');
    const summary = firstProseLine(body);
    const href = `${webBase}/${file}`;
    lines.push(summary ? `- [${title}](${href}): ${summary}` : `- [${title}](${href})`);
  }
  lines.push('');

  // llms.txt goes in the parent of the mirror folder (the web root: public/ or static/).
  const outPath = path.join(path.dirname(mirrorDir), 'llms.txt');
  await writeFile(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${path.relative(root, outPath)} indexing ${files.length} mirror(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
