# Docusaurus — serving `/llms/*.md` mirrors

Applies to Docusaurus 2/3. Content here is **already Markdown/MDX**, so this is
the friendliest case: prefer **source mode**.

## Where the mirrors live

Docusaurus serves **`static/`** verbatim at the site root:

```
static/
├── llms.txt                 ->  https://site.com/llms.txt
└── llms/
    ├── intro.md
    ├── docs-basics.md
    └── pricing.md
```

A site may already have `static/llms.txt` (the teaching project does) — update
it, don't clobber it.

## Producing the mirror content (source mode)

The page already exists as `.md`/`.mdx` under `docs/`, `blog/`, or
`versioned_docs/`. To mirror it:

1. Read the source file.
2. Strip the import lines and JSX components (`<Tabs>`, `<TabItem>`, custom React
   components), keeping their text content. Keep headings, prose, lists, code
   fences, and Markdown tables verbatim.
3. Keep or rewrite the frontmatter to the mirror header shape (title, source URL
   = the deployed doc URL, lastmod).
4. Write to `static/llms/<slug>.md` where `<slug>` is the flattened route, e.g.
   `/docs/basics/index` → `docs-basics.md`.

`scripts/regen-mirrors.mjs` handles the mechanical strip in source mode given a
mapping of route → source file. **Interactive `<Tabs>` pricing/feature widgets**
still need the hand-flattening pass: turn the tab set into a single Markdown
table so an agent sees all options linearly.

### Versioned docs

If the site uses versioning (`versioned_docs/version-*`), mirror only the
**default/latest version** unless the user wants all of them — agents want the
current truth, and mirroring every historical cohort is noise. Name slugs with
the version when you do include several: `docs-2026-technest-intro.md`.

## Discovery hints

Add the `<link>` globally via config (covers all pages) or per-page via the
`<head>` tag. Global, in `docusaurus.config.js`:

```js
// Note: a single global href can't be per-page. For a site-wide pointer to the
// llms index, this is fine:
headTags: [
  { tagName: 'link', attributes: {
      rel: 'alternate', type: 'text/markdown', href: '/llms.txt' } },
],
```

For **per-page** `<link rel="alternate">` pointing at that page's own mirror,
swizzle the doc/blog wrapper (see below) and emit a `<Head>` tag using the page's
slug. This mirrors how the existing buttons are injected.

## Ask-AI buttons — reuse what's already there

The teaching project already has working components at
`src/components/OpenInChatGPTButton/` and `src/components/CopyMarkdownButton/`,
injected via swizzled `src/theme/DocItem/Content/` and
`src/theme/BlogPostItem/Content/`. **Reuse that wiring.** The only change: point
them at the same-site mirror instead of `raw.githubusercontent.com`.

In `OpenInChatGPTButton`, replace the GitHub-raw URL construction with:

```js
const slug = location.pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-') || 'index'
const mirrorUrl = `${window.location.origin}/llms/${slug}.md`
const prompt = `Read ${mirrorUrl}`
const chatGPTUrl = `https://chatgpt.com/?hints=search&prompt=${encodeURIComponent(prompt)}`
```

This deletes ~120 lines of fragile path-to-source mapping (the blog date
prefixes, the version guessing) — the mirror slug is derived directly from the
URL, so it can't fall out of sync. For a fresh Docusaurus site with no existing
buttons, install `assets/react/AskAIButtons.tsx` and swizzle a wrapper to render
it with `mirrorPath={"/llms/" + slug + ".md"}`.

For `CopyMarkdownButton`, switch from HTML→markdown-in-the-browser to fetching
the canonical mirror: `await fetch('/llms/' + slug + '.md').then(r => r.text())` —
it copies the same authoritative text agents get.

## Verify

```
npm start
# open http://localhost:3000/llms/docs-basics.md
# open http://localhost:3000/llms.txt
# load a doc page, confirm the button opens ChatGPT with "Read .../llms/<slug>.md"
```
