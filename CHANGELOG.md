# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The template ships `.gitea/workflows/` with a README placeholder. Gitea scans
  that directory before `.github/workflows` and only falls back when it does not
  exist, so the scaffolded repositories no longer queue a run for every push to
  Gitea (“No runner is online to pick up this job.”): the GitHub-only workflows
  are never scheduled there.

## [0.1.3] - 2026-09-19

### Added

- The README badges are generated as well (a second marked block, next to the
  release notes): `pi-release sync-readme` writes the npm version, license, CI
  and changelog badges from `package.json`, so badge URLs can no longer go stale
  in individual repositories. Repositories without those markers are skipped,
  which keeps the block opt-in.

### Changed

- `sync-readme` replaces `sync-readme-changelog` and refreshes (or, with
  `--check`, verifies) both generated blocks; the old name stays as a
  deprecated alias. `reusable-release.yml` and the template use the new name.

## [0.1.2] - 2026-09-19

### Fixed

- The README license badge (toolkit and template) reads
  `img.shields.io/github/license/<owner>/<repo>` instead of the npm registry
  badge: it renders from the `LICENSE` file and does not stay red when the npm
  registry CDN (or GitHub's image proxy) still has the "package not found"
  result cached from before the first publish.

## [0.1.1] - 2026-09-19

### Changed

- The release workflow no longer creates tags: the moving `vX.Y` tag is moved
  locally with `npm run tag-major` and mirrored from Gitea, so Gitea stays the
  single source of truth for refs (a workflow-set tag existed on GitHub only).
  `reusable-release.yml` therefore lost the `move_major_tag` input.

## [0.1.0] - 2026-09-19

### Added

- `pi-release` CLI with the subcommands `init` (scaffold a new extension
  repository), `sync-readme-changelog` (`--check` for CI), `release-notes` and
  `tag-major`
- `template/` skeleton for new pi extension repositories: extension stub,
  README with badges and the changelog block, CHANGELOG, `package.json`,
  `AGENTS.md`, `LICENSE`, `.gitignore`/`.gitattributes` and thin CI/release
  callers
- Shared reusable workflows `reusable-ci.yml` (checks plus the no-German guard)
  and `reusable-release.yml` (tag/version/CHANGELOG guards, `npm run check`,
  README release-notes sync, npm publish with provenance, tarball, GitHub
  release with the CHANGELOG section as body, moving `vX.Y` tag)
- Self-test that scaffolds into a temporary directory and verifies placeholders,
  generated README block, release notes and the guard for stale blocks
- README with the step-by-step guide for a new extension repository (Gitea,
  GitHub mirror, npm, first release)

<!-- [Unreleased] compares against the last tagged version. Versions link to
     their GitHub release page (created by release.yml); 0.1.0 has no tag
     (the first publish was manual), so it links to npm. -->
[Unreleased]: https://github.com/FloezWerk/pi-extension-release-tool/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/FloezWerk/pi-extension-release-tool/releases/tag/v0.1.3
[0.1.2]: https://github.com/FloezWerk/pi-extension-release-tool/releases/tag/v0.1.2
[0.1.1]: https://github.com/FloezWerk/pi-extension-release-tool/releases/tag/v0.1.1
[0.1.0]: https://www.npmjs.com/package/@floez-werk/pi-extension-release-tool/v/0.1.0