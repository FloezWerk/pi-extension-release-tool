#!/usr/bin/env node
/**
 * Release tooling for FloezWerk pi extensions (`pi-release`).
 *
 * Subcommands
 *   init <dir> [options]         scaffold a new extension repository
 *   sync-readme [--check]        refresh the generated README blocks
 *   release-notes [--out <file>] CHANGELOG section of the package version
 *   tag-major [--push]           move the `vX.Y` tag to the current release
 *
 * The README and release-notes subcommands derive everything from
 * `package.json` and `CHANGELOG.md` in the current working directory, so they
 * work in any repository without configuration.
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { releaseNotes, syncReadme } from "./readme-block.mjs";
import { scaffold } from "./scaffold.mjs";

const USAGE = `Usage: pi-release <command> [options]

Commands:
  init <dir>                   Scaffold a new pi extension repository
    --name <pkg>               Package name, e.g. @floez-werk/piagent-my-ext
    --desc <text>              Package description (one line)
    [--repo <name>]            Repository name (default: package name without scope)
    [--owner <name>]           GitHub/Gitea owner (default: FloezWerk)
    [--ext <file>]             Extension file in extensions/ (default: <repo>.ts)
    [--cmd <name>]             Command name without slash (default: extension file without .ts)
    [--toolkit-ref <ref>]      Toolkit ref the workflows pin to (default: v0.1)
    [--force]                  Write into a non-empty directory
    [--no-git]                 Skip "git init" and the initial commit

  sync-readme                  Regenerate the generated README blocks (badges,
                               release notes); the badges block is skipped when
                               a repository has no markers for it
    [--check]                  Fail when a committed block is stale
    [--readme <file>]          Default: README.md
    [--changelog <file>]       Default: CHANGELOG.md
    [--package <file>]         Default: package.json

  sync-readme-changelog        Deprecated alias for sync-readme (kept for
                               repositories that still call it)

  release-notes                Print the CHANGELOG section of the package version
    [--out <file>]             Write to a file instead of stdout

  tag-major                    Move the "v<major>.<minor>" tag to HEAD
    [--push]                   Push the moved tag to origin`;

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

/** Minimal flag parser: `--flag value`, `--flag=value`, `--bool`, positionals. */
function parseArgs(argv) {
  const flags = new Map();
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [key, inline] = arg.slice(2).split("=", 2);
    if (inline !== undefined) {
      flags.set(key, inline);
      continue;
    }

    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags.set(key, next);
      index += 1;
    } else {
      flags.set(key, true);
    }
  }

  return { flags, positional };
}

function tagMajor(flags) {
  const { version } = releaseNotesInfo(flags);
  const [major, minor] = String(version).split(".");
  if (!major || !minor) fail(`cannot derive a major.minor tag from version "${version}"`);

  const tag = `v${major}.${minor}`;
  if (!flags.get("push")) {
    console.log(`${tag} (not pushed: pass --push)`);
    return;
  }

  execFileSync("git", ["tag", "-f", tag], { stdio: "inherit" });
  execFileSync("git", ["push", "-f", "origin", tag], { stdio: "inherit" });
  console.log(`Moved ${tag} to HEAD and pushed it.`);
}

function releaseNotesInfo(flags) {
  return releaseNotes(flags.get("package") ?? "package.json", flags.get("changelog") ?? "CHANGELOG.md");
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseArgs(rest);

  try {
    switch (command) {
      case "init": {
        const dir = positional[0];
        if (!dir) fail(`missing <dir>\n\n${USAGE}`);
        scaffold(dir, flags);
        return;
      }
      case "sync-readme":
      case "sync-readme-changelog":
        console.log(
          syncReadme({
            readmePath: flags.get("readme") ?? "README.md",
            changelogPath: flags.get("changelog") ?? "CHANGELOG.md",
            packagePath: flags.get("package") ?? "package.json",
            check: flags.get("check") === true,
          }),
        );
        return;
      case "release-notes": {
        const { version, notes } = releaseNotesInfo(flags);
        const out = flags.get("out");
        if (typeof out === "string") {
          writeFileSync(out, notes, "utf8");
          console.log(`Wrote the ${version} release notes to ${out}.`);
          return;
        }
        process.stdout.write(notes);
        return;
      }
      case "tag-major":
        tagMajor(flags);
        return;
      case undefined:
      case "-h":
      case "--help":
      case "help":
        console.log(USAGE);
        return;
      default:
        fail(`unknown command "${command}"\n\n${USAGE}`);
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

main();