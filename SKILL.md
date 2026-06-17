---
name: geo-markdown-mirror
description: >-
  Generate plain-Markdown "mirror" pages of a web project's important pages
  (pricing, docs, features, landing, long-form content) collected under a
  /llms/ folder — the neon.com/pricing.md pattern — so AI agents and crawlers
  parse them cleanly (GEO / AI SEO) and visitors can one-click "ask AI". Also
  builds an llms.txt index, injects rel="alternate" type="text/markdown"
  discovery hints in the page head, and can add "Open in ChatGPT/Claude" +
  "Copy as Markdown" buttons. Use this whenever the user wants .md mirrors, an llms.txt, an
  "ask AI / Open in ChatGPT" button, to make a site AI-readable / agent-friendly
  / LLM-friendly, to improve GEO or get cited by ChatGPT/Perplexity/Claude, or
  mentions agents getting confused by JS-heavy pages (sliders, interactive
  pricing, tabs, tables) — even if they don't say ".md mirror" explicitly.
---

# GEO Markdown Mirror

## What this does and why

Modern web pages render through JavaScript: pricing sliders, tabbed feature
grids, accordions, interactive tables. Humans read these fine, but AI agents
and crawlers often can't — they get the shell, not the numbers. Neon hit this
exactly and fixed it by publishing a plain-text mirror of each important page
at a sibling URL (`neon.com/pricing` → `neon.com/pricing.md`):

> *"Agents were getting confused by our pricing. Turns out JS-based sliders are
> not the best way for them to parse things."*

A plain-Markdown mirror solves two problems at once:

1. **GEO (Generative Engine Optimization).** Clean, link-rich Markdown is what
   ChatGPT, Perplexity, Claude, and Google AI Overviews ingest and cite. You
   control the framing of your own content instead of hoping a scraper guesses
   right.
2. **One-click "ask AI."** A stable `.md` URL is the perfect target for an
   "Open in ChatGPT" / "Copy as Markdown" button — the agent fetches a faithful
   text version, not a DOM soup.

This skill produces those mirrors for a project, indexes them, makes them
discoverable, and bundles a script so they stay in sync as pages change.

**Output convention (decided for this house style):** all mirrors live under a
single **`/llms/` folder** served at the site root, e.g. `/llms/pricing.md`,
`/llms/docs-getting-started.md`. The HTML page at `/pricing` keeps a
`<link rel="alternate" type="text/markdown" href="/llms/pricing.md">` so agents
can find its mirror. An `llms.txt` at the site root indexes everything.

## When NOT to use it

If the project has no user-facing web pages (a CLI, a library, a pure data/ML
repo), there's nothing to mirror — say so instead of inventing pages. For a repo
that just needs an `llms.txt` describing the *project* (not page mirrors), that's
the `professional-repo-docs` skill's job; this skill is about per-page content
mirrors of a deployed site.

## Workflow

Work through these steps in order. Steps 1–2 are discovery; do them before
writing anything, and confirm the page list with the user.

### 1. Detect the framework and open its reference

Read `package.json` and any config file to identify the stack, then **read the
matching reference file** — where `/llms/` physically lives and how to inject
discovery hints differ per framework, so don't guess:

| Signal | Framework | Read |
| --- | --- | --- |
| `next` in deps, `next.config.*`, `app/` or `pages/` | Next.js | `references/nextjs.md` |
| `@docusaurus/core`, `docusaurus.config.*` | Docusaurus | `references/docusaurus.md` |
| `vite` + `react`/`vue`, `vite.config.*`, `index.html` | Vite SPA | `references/vite-react.md` |
| plain `.html` files, no build framework | Static HTML | `references/static-html.md` |

If the stack isn't listed (Astro, Gatsby, SvelteKit, Nuxt…), follow the closest
reference by analogy: find the **public/static asset dir** (where files are
served verbatim at the site root) for the mirrors, and the **shared `<head>` /
layout** for the discovery hints. State which analogy you used.

### 2. Discover candidate pages and confirm the list

Find the content-rich, user-facing routes — the pages people (and agents) ask
about: pricing, features, product/use-case pages, docs, FAQ, about, and any
long-form landing or blog content. Source the candidates from whatever is
authoritative for the stack: the router (`app/`/`pages/`), content files
(`*.mdx`, `*.md`), the sidebar/nav config, or `sitemap.xml`.

Then **present the list and let the user trim it.** Mirroring every route is
noise — login screens, dashboards, and thin pages don't help agents. Mirror what
agents are actually asked about. A good default first pass: pricing, top-level
product/feature pages, the docs landing + key doc pages, and the homepage.

Decide a flat **slug** for each page from its path, so the folder stays browsable:
`/pricing` → `pricing.md`; `/docs/getting-started` → `docs-getting-started.md`;
`/` (home) → `index.md`.

### 3. Produce faithful mirrors → `/llms/<slug>.md`

Each mirror is a faithful **plain-text** rendering of the page's real content.
Two modes depending on how the page is authored — see the reference file for the
exact mechanics, but the principles:

- **Source mode** (the page is `.md`/`.mdx` content — common in Docusaurus and
  MDX blogs): start from the source file, strip JSX/imports/components, keep the
  prose, headings, lists, code, and tables. This is the most faithful and the
  cheapest to regenerate.
- **Render mode** (the page is built from React/Vue components — common in
  Next.js/Vite app pages): there is no markdown source, so capture the *rendered*
  output. Fetch the page HTML (from the running dev server or the live URL) and
  convert to Markdown. `scripts/regen-mirrors.mjs` does this with `turndown`;
  for pages whose content only appears after client-side JS runs, use the
  headless-browser option documented in the references.

**The point of the whole exercise — flatten interactive widgets.** A pricing
slider, a tabbed plan comparison, an accordion FAQ, a filterable table: render
these into a plain **Markdown table or list** with the actual values inline.
This is the neon insight — don't dump raw DOM or leave `<div>`/JSX behind; an
agent should be able to read every price and tier in linear text. Use judgment
here; this is the part a script can't fully do, and it's where the value is.

Give every mirror a small, consistent header so a stray fetch is self-describing:

```markdown
---
title: Pricing
source: https://example.com/pricing
lastmod: 2026-06-17
---

> Plain-text mirror of https://example.com/pricing for AI agents and LLMs.
> Canonical page: https://example.com/pricing

# Pricing
...
```

(Set `source`/canonical from the deployed site URL — find it in the deploy
config, `package.json` `homepage`, or ask the user. Use the real publish date or
today for `lastmod`.)

### 4. Build the `llms.txt` index

Write or update `llms.txt` at the **site root** (`public/llms.txt`,
`static/llms.txt`, or the web root — per reference) indexing every mirror:
project name, a one-line summary, then grouped links to each `/llms/<slug>.md`.
Follow the [llmstxt.org](https://llmstxt.org) shape. Use
`scripts/build-llms-txt.mjs` to generate it from the `/llms/` folder so it can't
drift, then hand-edit the summary lines for quality. `assets/templates/llms.txt`
is the starting shape.

### 5. Inject discovery hints

Add to each mirrored page's `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/llms/pricing.md" />
```

so crawlers and agents discover the mirror automatically. The mechanism is
per-framework (Next.js `metadata.alternates`, a Docusaurus head tag, a raw
`<link>` in static HTML) — see the reference. Also ensure `llms.txt` is linked
or at least reachable at `/llms.txt`.

### 6. (Optional) Add the ask-AI buttons

If the user wants the one-click affordance, install the button component from
`assets/`:

- **React/Next/Docusaurus** → `assets/react/AskAIButtons.tsx` (an
  "Open in ChatGPT" + "Copy as Markdown" pair).
- **Static/Vite/plain HTML** → `assets/vanilla/ask-ai-buttons.js` + `.css`.

Point them at the **same-site** mirror, not GitHub raw. "Open in ChatGPT" opens
`https://chatgpt.com/?hints=search&prompt=Read <absoluteOrigin>/llms/<slug>.md`;
"Copy as Markdown" fetches `/llms/<slug>.md` and copies it. (This is a
deliberate upgrade over pointing at `raw.githubusercontent.com` — the on-site
mirror works for private repos, custom domains, and pages with no markdown
source.) The components take the mirror path as a prop; wire it from the current
route. See comments in each asset.

### 7. Bundle the regeneration script

Copy `scripts/regen-mirrors.mjs` into the target (e.g. `scripts/`) and add an
npm script so mirrors are rebuildable before each deploy:

```jsonc
// package.json
"scripts": {
  "regen:mirrors": "node scripts/regen-mirrors.mjs",
  "build:llms": "node scripts/build-llms-txt.mjs"
}
```

Explain to the user why: a one-time mirror rots the moment a price changes. The
script re-extracts source-mode pages deterministically and re-fetches
render-mode pages; the hand-flattened widget tables are preserved between marked
regions (see the script header). Suggest wiring `regen:mirrors` into the build
or a pre-deploy/CI step.

### 8. Report and tell the user how to verify

Summarize what you created (mirrors, `llms.txt`, hints, buttons) and give the
concrete verification steps from the reference: run the dev server, open
`/llms/<slug>.md`, confirm the flattened table is there, view-source the HTML to
see the `<link rel="alternate">`, and click the button.

## Reference files

- `references/nextjs.md` — App Router + Pages Router: where `/llms` lives, route
  handlers vs static files, `metadata.alternates`, Vercel/Cloudflare notes.
- `references/docusaurus.md` — `static/llms`, swizzling DocItem/BlogPostItem,
  versioned docs, head tags, reusing the existing buttons.
- `references/vite-react.md` — `public/llms`, `index.html` head, SPA caveats.
- `references/static-html.md` — `/llms` beside HTML, raw `<link>` hints.

## Bundled scripts and assets

- `scripts/regen-mirrors.mjs` — re-extract mirrors (source + render mode).
- `scripts/build-llms-txt.mjs` — regenerate `llms.txt` from `/llms/`.
- `assets/react/AskAIButtons.tsx` — React "Open in ChatGPT" + "Copy as Markdown".
- `assets/vanilla/ask-ai-buttons.js` / `.css` — framework-agnostic version.
- `assets/templates/llms.txt` — starting shape for the index.
