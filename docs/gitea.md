# Gitea as source (optional)

The toolkit and the extension repositories can be developed on a self-hosted
Gitea and mirrored to GitHub. GitHub runs the workflows; Gitea only holds the
refs. If you work on GitHub directly, skip this page.

## New repository via Gitea

1. **Gitea: create the repository** (`FloezWerk/<repo>`, no README/license).
2. **GitHub: create the repository** as well (empty, public) - it is the mirror
   target and runs the workflows.
3. **Gitea: add the push mirror** - *Settings → Repository → Mirror Settings →
   Add Push Mirror* with the GitHub URL and **"Sync when new commits are
   pushed"** enabled. Branches *and* tags are mirrored.
4. **Keep the `.gitea/workflows/` placeholder.** Gitea has no runner, so the
   scaffolded directory makes Gitea stop looking for workflows before it reads
   `.github/workflows`. Without it, every push shows up in the Gitea Actions tab
   as a queued run with "No runner is online to pick up this job."
5. **Push to Gitea**, then verify on GitHub that the commit arrived:

   ```bash
   git remote add origin ssh://git@gitea/FloezWerk/<repo>.git
   git push -u origin main
   ```

## Releases with the mirror

- Tags are pushed to Gitea; the mirror copies them to GitHub, where Actions
  reacts. Tags are never created inside a workflow, so Gitea stays the single
  source of truth for refs.
- `npm run tag-major` (toolkit) moves `vX.Y` locally and pushes it to Gitea.
  The mirror has to propagate the forced update as well: after a move, check
  that GitHub shows the new commit for `vX.Y`. If it still shows the old one,
  resync the mirror in Gitea (*Mirror Settings → Synchronize*).
