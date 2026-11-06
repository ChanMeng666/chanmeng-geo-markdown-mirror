<!-- AGENT-FIRST NOTICE -->
> [!IMPORTANT]
> ### 🤖 Read this with your AI agent — don't read it by hand.
> This repo is written agent-first. Point Claude Code, GitHub Copilot, Cursor, or any agent at it:
> *"Read the README and AGENTS.md, then help me run / extend this."*
> Structure + [`AGENTS.md`](AGENTS.md) are optimized for agent comprehension.
<!-- /AGENT-FIRST NOTICE -->

<div align="center">

# chanmeng-geo-markdown-mirror

A Claude Code skill that generates plain-Markdown mirror pages (the neon.com/pricing.md pattern) of a website's key pages — for GEO and one-click ask-AI.

[![License](https://img.shields.io/github/license/ChanMeng666/chanmeng-geo-markdown-mirror?style=flat-square)](LICENSE)
[![Issues](https://img.shields.io/github/issues/ChanMeng666/chanmeng-geo-markdown-mirror?style=flat-square)](https://github.com/ChanMeng666/chanmeng-geo-markdown-mirror/issues)
[![Stars](https://img.shields.io/github/stars/ChanMeng666/chanmeng-geo-markdown-mirror?style=flat-square)](https://github.com/ChanMeng666/chanmeng-geo-markdown-mirror/stargazers)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-EA4AAA?style=flat-square&logo=githubsponsors)](https://github.com/sponsors/ChanMeng666)

</div>

## 🌟 Introduction

Modern web pages render through JavaScript — pricing sliders, tabbed feature grids, accordions,
interactive tables. Humans read these fine, but AI agents and crawlers often can't: they get the
shell, not the numbers. [Neon](https://neon.com/pricing.md) fixed this by publishing a plain-text
mirror of each important page at a sibling URL — *"Agents were getting confused by our pricing.
Turns out JS-based sliders are not the best way for them to parse things."*

**chanmeng-geo-markdown-mirror** is a [Claude Code](https://claude.com/claude-code) skill that does this for
any project. Point it at a website or docs site and it identifies the content-rich pages, generates
faithful plain-Markdown mirrors under a `/llms/` folder (interactive widgets flattened to plain
tables), builds an `llms.txt` index, injects `rel="alternate" type="text/markdown"` discovery hints,
and can add one-click "Open in ChatGPT" / "Copy as Markdown" buttons. It bundles a regeneration
script so the mirrors stay in sync as pages change.

Two payoffs: **GEO** (Generative Engine Optimization — clean Markdown is what ChatGPT, Perplexity,
Claude, and Google AI Overviews ingest and cite) and **one-click "ask AI"** (a stable `.md` URL is
the perfect target for an ask-AI button).

It supports **Next.js**, **Docusaurus**, **Vite SPAs**, and **plain static HTML** out of the box, and
falls back to the closest pattern by analogy for other stacks (Astro, Gatsby, SvelteKit, Nuxt…).

## ✨ Features

- **Per-page `.md` mirrors** — faithful plain-text versions of your key pages under `/llms/`, the
  neon.com/pricing.md pattern, served at predictable URLs.
- **Interactive-widget flattening** — pricing sliders, tabbed plans, and accordions become plain
  Markdown tables with the real values inline, so agents read every tier correctly.
- **`llms.txt` index** — an [llmstxt.org](https://llmstxt.org)-style discovery file linking every
  mirror, generated from the folder so it can't drift.
- **HTML discovery hints** — `rel="alternate" type="text/markdown"` injected per-framework so
  crawlers and agents auto-discover the mirror.
- **Ask-AI buttons** — drop-in React (`AskAIButtons.tsx`) and framework-agnostic vanilla components
  for "Open in ChatGPT" + "Copy as Markdown", pointed at your own same-site mirror (not GitHub raw).
- **Regeneration tooling** — `regen-mirrors.mjs` (source + render modes) and `build-llms-txt.mjs`,
  with hand-flattened tables preserved across regenerations via `<!-- mirror:manual -->` markers.

## 🚀 Getting Started

### Prerequisites

- [Claude Code](https://claude.com/claude-code) — this is a Claude Code skill.
- Node.js ≥ 18 — only in the *target* project, to run the bundled regeneration scripts. Render-mode
  regeneration also uses `turndown` (and optionally `playwright` for client-rendered pages); the
  skill prompts you to install these in the target as needed.

### Installation

#### Any agent, with the skills CLI

Installs into Claude Code, Cursor, Codex, GitHub Copilot, Gemini CLI and the other agents the CLI supports. Listed on [skills.sh](https://skills.sh/chanmeng666).

```bash
npx skills add ChanMeng666/chanmeng-geo-markdown-mirror
```

#### As a Claude Code plugin (recommended)

```text
/plugin install chanmeng-geo-markdown-mirror --marketplace ChanMeng666/chanmeng-geo-markdown-mirror
```

On Claude Code older than 2.1.275, add the marketplace first:

```text
/plugin marketplace add ChanMeng666/chanmeng-geo-markdown-mirror
/plugin install chanmeng-geo-markdown-mirror@chanmeng-geo-markdown-mirror
```

#### Manual install

Install the packaged skill, then invoke it from Claude Code:

```bash
# Option A: install the bundled .skill package
#   In Claude Code, install chanmeng-geo-markdown-mirror.skill via the skills UI.

# Option B: copy the skill folder into your Claude Code skills directory
cp -r chanmeng-geo-markdown-mirror ~/.claude/skills/chanmeng-geo-markdown-mirror
```

## 📖 Usage

The skill triggers automatically when you describe the intent — you don't have to name it:

```text
> My Next.js pricing page uses a slider and ChatGPT keeps giving people wrong prices.
  Make it readable by AI agents and add an "Open in ChatGPT" button.

> Add llms.txt + plain markdown mirrors of my docs so Perplexity can cite them accurately.

> Set up the neon-style .md versions of my landing pages.
```

Claude detects your framework, proposes the pages to mirror (you confirm the list), generates the
mirrors + `llms.txt` + discovery hints, optionally wires the buttons, and bundles the regen script.
Afterwards, keep mirrors in sync with:

```bash
npm run regen:mirrors   # rebuild the .md mirrors
npm run build:llms      # rebuild llms.txt from the /llms/ folder
```

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) and our
[Code of Conduct](CODE_OF_CONDUCT.md). Use the issue and pull-request templates when you open one.

## ❤️ Support & Sponsor

- Questions? Open a [Discussion](https://github.com/ChanMeng666/chanmeng-geo-markdown-mirror/discussions) or see [SUPPORT.md](SUPPORT.md).
- Found a security issue? Follow [SECURITY.md](SECURITY.md).
- If this project helps you, consider [sponsoring](https://github.com/sponsors/ChanMeng666) ☕.

## 📄 License

Released under the [MIT](LICENSE) license.

---

<!-- CHAN MENG PERSONAL BRAND -->
<div align="center">
  <a href="https://github.com/ChanMeng666" target="_blank">
    <img src="./.github/brand/chan-meng-logo.svg" alt="Chan Meng" width="160" />
  </a>

  <p><strong>Chan Meng</strong><br/>Need a custom app like this one? I build them — let's talk.</p>

  <a href="mailto:chanmeng.dev@gmail.com"><img src="https://img.shields.io/badge/Email-chanmeng.dev@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email Chan Meng"/></a>
  <a href="https://github.com/ChanMeng666"><img src="https://img.shields.io/badge/GitHub-ChanMeng666-181717?style=flat-square&logo=github&logoColor=white" alt="Chan Meng on GitHub"/></a>
</div>
<!-- /CHAN MENG PERSONAL BRAND -->
