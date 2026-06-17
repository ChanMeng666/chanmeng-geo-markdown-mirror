# Static HTML site — serving `/llms/*.md` mirrors

Applies to plain `.html` sites with no build framework (hand-written HTML,
GitHub Pages, design portfolios). The simplest case of all.

## Where the mirrors live

There's no `public/`/`static/` indirection — the web root IS the repo (or a
folder like `docs/` for GitHub Pages). Put mirrors at the root:

```
/                          (web root)
├── index.html
├── pricing.html
├── llms.txt               ->  https://site.com/llms.txt
└── llms/
    ├── index.md
    └── pricing.md
```

The `.md` files are served as static assets automatically; no config needed on
GitHub Pages, Netlify, Cloudflare Pages, or any static host.

## Producing the mirror content (render mode, but easy)

The content already lives in the `.html` file as server-rendered markup (no
client-side framework hydration). So:

- `scripts/regen-mirrors.mjs` reads the `.html` file directly and runs
  `turndown` on the `<main>`/`<article>`/`<body>` content — no dev server or
  headless browser needed for fully static HTML.
- Flatten any interactive widgets (JS sliders, CSS-tab pricing) into a plain
  Markdown table by hand, between the `<!-- mirror:manual -->` markers.

## Discovery hints

Add directly to each page's `<head>` — the most literal form of the pattern:

```html
<!-- in pricing.html -->
<link rel="alternate" type="text/markdown" href="/llms/pricing.md">
```

If the site uses includes/templating (e.g. a shared header partial), a site-wide
pointer to `/llms.txt` in the shared head is an acceptable minimum.

## Ask-AI buttons

Use `assets/vanilla/ask-ai-buttons.js` + `ask-ai-buttons.css`. Drop the files in,
link them, and add the markup near the top of the content:

```html
<link rel="stylesheet" href="/ask-ai-buttons.css">
<div data-ask-ai data-mirror="/llms/pricing.md"></div>
<script src="/ask-ai-buttons.js" defer></script>
```

The script finds every `[data-ask-ai]`, reads its `data-mirror`, and renders the
"Open in ChatGPT" + "Copy as Markdown" buttons pointed at that mirror.

## Verify

```
# serve locally, e.g.:  npx serve .   (or python -m http.server)
# open http://localhost:3000/llms/pricing.md
# open http://localhost:3000/llms.txt
# view-source pricing.html for the <link rel="alternate">
# click "Open in ChatGPT" -> opens chatgpt.com with "Read .../llms/pricing.md"
```
