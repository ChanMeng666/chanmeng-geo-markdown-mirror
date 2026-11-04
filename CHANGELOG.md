# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-04

### Added
- Claude Code plugin packaging: `.claude-plugin/plugin.json` and `marketplace.json`. Install with
  `/plugin install chanmeng-geo-markdown-mirror --marketplace ChanMeng666/chanmeng-geo-markdown-mirror`. The repo, marketplace, plugin and skill all
  use the name `chanmeng-geo-markdown-mirror`. The manual `git clone` install still works as before.
- CI runs `claude plugin validate --strict` on the manifests.

### Added
- Initial project documentation and community-health files.

## [0.1.0] - 2026-06-17

### Added
- Initial release of the `geo-markdown-mirror` Claude Code skill.
- `SKILL.md` workflow: detect framework → confirm pages → generate `/llms/<slug>.md` mirrors →
  build `llms.txt` → inject discovery hints → optional ask-AI buttons → bundle regen script.
- Per-framework reference guides for Next.js, Docusaurus, Vite SPA, and static HTML.
- Bundled scripts: `regen-mirrors.mjs` (source + render mode, manual-block preservation) and
  `build-llms-txt.mjs`.
- Drop-in assets: React `AskAIButtons.tsx`, vanilla `ask-ai-buttons.{js,css}`, `llms.txt` template.
- Eval suite (`evals/evals.json`) validated across Next.js, Docusaurus, and static-HTML targets
  (100% assertion pass rate with the skill vs 44% baseline).
