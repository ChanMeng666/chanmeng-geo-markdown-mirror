# AGENTS.md

This file provides project guidance to AI coding assistants (Claude Code, GitHub Copilot, Cursor,
Codex, etc.) working with this repository. Read it before writing or changing any code.

## Project Overview

geo-markdown-mirror — A Claude Code skill that generates plain-Markdown mirror pages (the neon.com/pricing.md pattern) of a website's key pages — for GEO and one-click ask-AI.

- **Primary language / stack:** Claude Code skill (Markdown SKILL.md + Node ESM helper scripts + React/vanilla asset components)
- **Default branch:** `main`
- **Repository:** https://github.com/ChanMeng666/geo-markdown-mirror

## What this skill does

Given a target web project, it generates plain-Markdown mirror pages of the important pages under a
`/llms/` folder (the neon.com/pricing.md pattern), an `llms.txt` index, `rel="alternate"
type="text/markdown"` discovery hints, optional ask-AI buttons, and a regeneration script — so AI
agents/crawlers parse the content cleanly (GEO) and visitors can one-click "ask AI".

## Repository map

| Path | Purpose |
| --- | --- |
| `SKILL.md` | The skill itself: frontmatter (name + triggering description) and the 8-step workflow. |
| `references/{nextjs,docusaurus,vite-react,static-html}.md` | Per-framework specifics: where `/llms/` lives, how to inject discovery hints, source vs render mode. Read the one matching the target stack. |
| `scripts/regen-mirrors.mjs` | Rebuild mirrors. Source mode strips JSX/imports from `.md`/`.mdx`; render mode fetches HTML and converts via `turndown` (`--headless` uses `playwright` for client-rendered pages). Config-driven by `geo-mirror.config.json` in the target. |
| `scripts/build-llms-txt.mjs` | Regenerate `llms.txt` from the `/llms/` folder (no deps). |
| `assets/react/AskAIButtons.tsx` | React "Open in ChatGPT" + "Copy as Markdown" buttons. |
| `assets/vanilla/ask-ai-buttons.{js,css}` | Framework-agnostic button version. |
| `assets/templates/llms.txt` | Starting shape for the index. |
| `evals/evals.json` | Test prompts + assertions used to validate the skill. |
| `geo-markdown-mirror.skill` | The packaged, installable skill bundle. |

## Working on the scripts

The two `scripts/*.mjs` are **bundled templates copied into target projects** — they run in the
user's repo, not here. Keep them dependency-light and self-documenting (the config shape lives in
each script's header comment). Syntax-check with `node --check scripts/regen-mirrors.mjs`. There is
no build step or package.json in this repo.

## Gotchas & Anti-patterns

- **The description in `SKILL.md` frontmatter must not contain `<` or `>`** — the skill packager
  rejects angle brackets. Write discovery-hint attributes as `rel="alternate" type="text/markdown"`,
  not as a literal `<link …>` tag.
- **Hand-flattened widget tables are sacred.** In a target's mirror files, content between
  `<!-- mirror:manual -->` and `<!-- /mirror:manual -->` is human/agent-authored (a slider flattened
  to a table) and is preserved by `regen-mirrors.mjs` across regenerations. Don't auto-overwrite it.
- **Mirrors point at same-site `/llms/<slug>.md`, never `raw.githubusercontent.com`** — the on-site
  mirror works for private repos, custom domains, and pages with no markdown source.
- **Re-package after editing `SKILL.md`** so `geo-markdown-mirror.skill` stays in sync with the source.

## Reading Order

When onboarding to this repo, read in this order:
1. `README.md` — what the project is and how to run it
2. This `AGENTS.md` — how to work in it
3. `CONTRIBUTING.md` — contribution workflow and quality gates

## Conventions for Changes

- Follow [Conventional Commits](https://www.conventionalcommits.org/).
- Run the project's lint/test commands before proposing changes.
- Keep this file up to date when you change build steps, structure, or conventions.
