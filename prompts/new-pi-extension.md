---
description: Scaffold a new FloezWerk pi extension with pi-extension-release-tool and implement it
---

# Create a new Pi extension

Guide: <https://github.com/FloezWerk/pi-extension-release-tool#new-extension-repository>
(the README of the toolkit - it is the source of truth for the flow and the
`pi-release init` flags; read it when anything is unclear).

**No arguments required.** All parameters are collected interactively in step 0.

## 0. Collect parameters (do this first, nothing else)

Print this questionnaire exactly once and **wait** for the user's answer. Do not
call any tool and do not scaffold before the values are known.

> **Please provide the values** - one line per number, "Enter" keeps the default.

| #   | Parameter     | Status   | Default                | Meaning                                                 |
| --- | ------------- | -------- | ---------------------- | ------------------------------------------------------- |
| 1.  | `pkg`         | required | -                      | Package name, e.g. `@floez-werk/piagent-my-ext`         |
| 2.  | `brief`       | required | -                      | What should the extension do? (events, command, output) |
| 3.  | `repo`        | optional | `<pkg without scope>`  | Repository name                                         |
| 4.  | `dir`         | optional | `/srv/projects/<repo>` | Target directory                                        |
| 5.  | `desc`        | optional | derived from `brief`   | One-liner, convention: `Pi extension: ...`              |
| 6.  | `owner`       | optional | `FloezWerk`            | GitHub/Gitea owner                                      |
| 7.  | `ext`         | optional | `<repo>.ts`            | File in `extensions/`                                   |
| 8.  | `cmd`         | optional | `<ext without .ts>`    | Command name without `/`                                |
| 9.  | `toolkit-ref` | optional | `v0.1`                 | Toolkit ref the shared workflows pin to                 |
| 10. | `force`       | optional | no                     | Write into a non-empty directory?                       |
| 11. | `no-git`      | optional | no                     | Skip `git init` and the initial commit?                 |

Short form is allowed, e.g.:

```text
1. @floez-werk/piagent-foo
2. Notify on message_end, command /foo shows a status line
```

- `pkg` and `brief` are **required**: ask again when they are missing - never guess.
- Invoked with arguments? Use them as prefill and only ask for the missing values.
- Unclear or ambiguous answer? Ask once more, briefly.
- Do not ask for derived values (`EXT_FN`, `TOOLKIT_SEMVER`, `DATE`, `YEAR`) - the
  scaffolder creates them.

## 1. Scaffold

```bash
npx -y @floez-werk/pi-extension-release-tool@^0.1 init <dir> \
  --name <pkg> \
  --desc "<desc>" \
  [--repo <repo>] [--owner <owner>] [--ext <ext>] [--cmd <cmd>] \
  [--toolkit-ref <toolkit-ref>] [--force] [--no-git]

cd <dir> && npm run check
```

## 2. Implement the extension

- Replace the stub in `extensions/<ext>` with the real implementation (events,
  commands, `ctx.ui.*`).
- **Everything in English**: code, comments, strings, docs, commits (CI fails on
  any umlaut in the repository).
- Update `README.md`: `Behavior` (before/after example), the `Commands` table and
  the dependencies when needed.
- `CHANGELOG.md`: every user-facing change gets a bullet under `## [Unreleased]`
  in the same commit.
- Never edit the generated README blocks (the badges block and the release-notes
  block) by hand - run `npm run readme` instead.
- Never commit sensitive data (the Gitea repository is mirrored to public GitHub).
- No branch switch without asking first.

## 3. Verify

```bash
npm run check                 # README block, bundle smoke test, npm pack --dry-run
pi -e ./extensions/<ext>      # manual test (command <cmd>)
```

## 4. Report

Summarize in bullets: created directory, package, extension file, command, the
checks that ran and their result, and anything left open.
Then list the **manual steps** from the README as a checklist:

1. Create the Gitea repository `owner/repo` and the GitHub repository (empty,
   public), then add the Gitea push mirror with "Sync when new commits are
   pushed".
2. `git remote add origin ssh://git@gitea/<owner>/<repo>.git && git push -u origin main`
   (verify the commit arrived on GitHub).
3. First npm publish is manual: `npm login && npm publish --access public` - do
   not push the tag of that version (the first tag-driven release is the next
   patch).
4. Set the GitHub secret `NPM_TOKEN` (granular token with publish rights).
5. Optional: point the `[Unreleased]` link in `CHANGELOG.md` at
   `compare/vX.Y.Z...HEAD`.