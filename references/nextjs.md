# Next.js — serving `/llms/*.md` mirrors

Applies to Next.js 13–16, both **App Router** (`app/`) and **Pages Router**
(`pages/`). Detect which by the directory present.

## Where the mirrors live

Next.js serves everything in **`public/`** verbatim at the site root. So:

```
public/
├── llms.txt                 ->  https://site.com/llms.txt
└── llms/
    ├── index.md             ->  https://site.com/llms/index.md
    ├── pricing.md           ->  https://site.com/llms/pricing.md
    └── docs-getting-started.md
```

This is the simplest, most portable option and works identically on Vercel and
Cloudflare Pages. **Prefer `public/llms/` static files** unless the user
specifically wants the mirror generated on every request.

### Static-file caveat: `.md` content type

Most hosts serve `public/*.md` as `text/markdown` or `text/plain` and browsers
will download rather than display — that's fine for agents (they read the bytes).
If you want it to render inline in a browser, that's a server-config concern, not
a blocker for GEO. Don't over-engineer this.

### Alternative: dynamic route handler (only if asked)

If the user wants the mirror generated on the fly (e.g. content comes from a CMS
or DB), use a Route Handler. Note the literal `.md` in the segment:

```ts
// app/llms/[slug].md/route.ts  — App Router
export const dynamic = 'force-static' // or omit for on-demand
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const md = await renderMirror(params.slug) // your content -> markdown
  return new Response(md, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
```

For Pages Router, use `pages/llms/[slug].md.ts` with `getServerSideProps`/an API
route, or just emit static files in `public/llms/` from the regen script —
usually simpler.

## Producing the mirror content (render mode)

Next.js app pages are React components, so there's no markdown source — capture
the rendered HTML:

1. Start the dev server (`npm run dev`) or use the deployed URL.
2. `scripts/regen-mirrors.mjs` fetches the page and runs `turndown`.
3. **Flatten interactive widgets by hand** (pricing sliders, tabbed plans). The
   raw fetch gives you the DOM; rewrite the pricing/feature widget as a plain
   Markdown table with the real values. Put it between the `<!-- mirror:manual -->`
   / `<!-- /mirror:manual -->` markers so the regen script preserves it (see the
   script header).

If a page's content only appears after client-side data fetching (the initial
HTML is an empty shell), a plain `fetch` won't see it. Use the headless option:
`node scripts/regen-mirrors.mjs --headless` drives a real browser via the
`playwright-cli` available in this environment. Document this for the user if
their pages are client-rendered.

## Discovery hints

**App Router** — use the Metadata API in the page (or its `layout`):

```ts
// app/pricing/page.tsx
export const metadata = {
  alternates: {
    types: { 'text/markdown': '/llms/pricing.md' },
  },
}
```

This emits `<link rel="alternate" type="text/markdown" href="/llms/pricing.md">`.

**Pages Router** — add it in the page via `next/head`:

```tsx
import Head from 'next/head'
<Head>
  <link rel="alternate" type="text/markdown" href="/llms/pricing.md" />
</Head>
```

## Ask-AI buttons

Use `assets/react/AskAIButtons.tsx`. In an App Router page it's a client
component (`'use client'` is already at the top of the asset). Pass the mirror
path for the current route:

```tsx
<AskAIButtons mirrorPath="/llms/pricing.md" />
```

It reads `window.location.origin` at click time to build the absolute URL for the
ChatGPT prompt, so it works in dev and prod without hardcoding the domain.

## Deploy notes

- **Vercel / Cloudflare Pages:** `public/llms/` ships as-is; nothing extra.
- If the site uses `output: 'export'` (static export), `public/` still works.
- Add `regen:mirrors` to the build (`"build": "next build && npm run regen:mirrors"`)
  only if pages are stable at build time; otherwise run it as a manual pre-deploy
  step so a flaky fetch never breaks the build.

## Verify

```
npm run dev
# open http://localhost:3000/llms/pricing.md   -> clean markdown, prices as a table
# open http://localhost:3000/llms.txt           -> lists every mirror
# view-source http://localhost:3000/pricing     -> has <link rel="alternate" type="text/markdown">
```
