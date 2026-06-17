# Vite SPA (React/Vue) — serving `/llms/*.md` mirrors

Applies to Vite single-page apps. Detect via `vite.config.*` + an `index.html`
at the project root and `react`/`vue` in deps.

## Where the mirrors live

Vite serves the **`public/`** directory verbatim at the site root:

```
public/
├── llms.txt                 ->  https://site.com/llms.txt
└── llms/
    ├── index.md
    └── pricing.md
```

Files in `public/` are copied as-is into `dist/` at build, so they're available
in both dev and prod with no config.

## Producing the mirror content (render mode)

A Vite SPA is **client-rendered** — the initial `index.html` is an empty
`<div id="root">`, and all content appears only after JS runs. A plain `fetch`
of the route will NOT see the content. So:

- Run the dev server (`npm run dev`) and use the **headless option**:
  `node scripts/regen-mirrors.mjs --headless` drives a real browser (via the
  `playwright-cli` in this environment), waits for the app to render, then
  converts the rendered DOM to Markdown.
- Then do the hand-flattening pass on any pricing/feature widgets — same neon
  principle: a slider or tab group becomes a plain Markdown table with real
  values.

For small SPAs it's often faster to author the mirror directly from the source
components (read the JSX, transcribe the copy and the data) than to set up
headless capture. Use judgment based on how much content there is.

## Discovery hints

A SPA has a single `index.html`, so a per-route `<link>` isn't possible without
JS. Two options:

1. **Static pointer (simplest):** add to `index.html` `<head>` a site-wide
   pointer to the index — `<link rel="alternate" type="text/markdown" href="/llms.txt">`.
2. **Per-route via router:** if using React Router + a head manager
   (`react-helmet`/`@unhead`), emit a per-route
   `<link rel="alternate" type="text/markdown" href={"/llms/" + slug + ".md"} />`.
   Worth it only if routes are meaningfully distinct content.

Prefer option 1 unless the SPA has several distinct content routes.

## Ask-AI buttons

Use `assets/vanilla/ask-ai-buttons.js` + `.css` (framework-agnostic, no build
step) or `assets/react/AskAIButtons.tsx` if you'd rather stay in React. Pass the
mirror path for the current route; the button reads `window.location.origin` at
click time.

## Verify

```
npm run dev
# open http://localhost:5173/llms/pricing.md
# open http://localhost:5173/llms.txt
# view-source the index.html head for the <link rel="alternate">
```
