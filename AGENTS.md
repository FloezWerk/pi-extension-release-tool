# AGENTS.md

Instructions for AI coding agents (e.g. pi coding agent) working in this repo.

## Keep this file short

This file is the **first rule**: keep `AGENTS.md` very short and concise -
prefer bullet points over prose. When adding or editing a rule, condense,
never expand.

## Language: English only

Everything in this repo is written in **English** and must stay English:
README/docs, code comments, user-facing strings, commit messages, CI config.
Never introduce German (or any other language) text; when touching an existing
string, keep it English. CI fails on umlauts anywhere in the repo.

## Project layout

- `tooling/` - the published `pi-release` CLI (`cli.mjs`, `readme-block.mjs`,
  `changelog-section.mjs`, `scaffold.mjs`, `self-test.mjs`)
- `template/` - skeleton for new extension repositories, copied by `init`;
  `__PLACEHOLDER__` tokens are replaced by `tooling/scaffold.mjs`
- `README.md` - the guide (tooling, new extension, releasing, updating)
- `.github/workflows/` - own `ci.yml`/`release.yml` (local callers) plus the
  **reusable** workflows the extensions call via `@vX.Y`
- `CHANGELOG.md` - user-facing changes per version (Keep a Changelog format)

## Changelog is mandatory

- Every change to `tooling/` or `template/` is user-facing for the extensions:
  add a bullet under `## [Unreleased]` in `CHANGELOG.md` (same commit).
- Docs-only or CI-internal tweaks inside this repo: no entry.
- `README.md` shows the release notes of the current version in the marked
  block: generated from `CHANGELOG.md` via `npm run readme`, never edited by
  hand.
- The release workflow rejects a tag without a matching `## [X.Y.Z]` entry.

## Checks

- `npm run check` - README release-notes block is up to date, `node --check` on
  the tooling, the self-test (scaffolds into a temp dir and verifies the result,
  including the negative cases) and `npm pack --dry-run`.
- A change to `template/` placeholders also needs a change in
  `tooling/scaffold.mjs`; the self-test fails otherwise.
- Keep `template/` and `tooling/` free of repository-specific assumptions - they
  run in every extension repository.

## Releasing

1. `CHANGELOG.md`: move `[Unreleased]` bullets into `## [X.Y.Z] - YYYY-MM-DD`
2. Bump `"version"` in `package.json`, run `npm run readme`, commit both
3. `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin main vX.Y.Z`
   -> Gitea mirrors the tag -> `release.yml` (local caller of the reusable
   workflow) publishes to npm, creates the GitHub release from the CHANGELOG
   section and moves the `vX.Y` tag
4. The extensions consume the `vX.Y` tag (reusable workflows) and `^X.Y` (npm
   scripts) - a patch release reaches them automatically, a **minor** release
   is a deliberate update of their pins (see README)
5. First release of the package only: publish manually (`npm login`,
   `npm publish --access public`), then set the GitHub secret `NPM_TOKEN`, and
   do **not** push the tag of that version

## Repository: local Gitea + public GitHub mirror

- Everything committed here becomes publicly readable on GitHub.
- **Never commit sensitive data** (keys, tokens, passwords, personal data).
- `origin` = Gitea (`ssh://git@gitea/FloezWerk/pi-extension-release-tool.git`),
  push target. Public GitHub URL:
  `git@github.com:FloezWerk/pi-extension-release-tool.git`.
- Install instructions always use the GitHub URL or the npm package, never the
  Gitea path:
  `npx -y @floez-werk/pi-extension-release-tool@^0.1 …`
- The GitHub mirror runs the workflows, so every tag and every workflow change
  must reach GitHub via the Gitea push mirror ("sync when new commits are
  pushed").