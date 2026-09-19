#!/usr/bin/env node
/**
 * Verifies what `npm pack` actually ships.
 *
 * `files` in `package.json` is a whitelist, but npm still applies its own rules:
 * a `.gitignore` inside `template/` for example is dropped from the tarball,
 * which would silently break `pi-release init` (the scaffolded repository would
 * miss the file). This check compares the packed file list with the files on
 * disk and fails on every difference, so such a rule cannot go unnoticed.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Note: the template ships its `.gitignore` as `template/gitignore` with a
// comment inside, because npm drops files literally named `.gitignore` from the
// tarball; `scaffold.mjs` renames it back when scaffolding.
const REQUIRED_ROOT_FILES = [
  "package.json",
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "AGENTS.md",
];

function fail(message) {
  console.error(`::error::pack check: ${message}`);
  process.exitCode = 1;
}

function listFiles(dir) {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else files.push(relative(".", path).split("\\").join("/"));
    }
  };
  walk(dir);
  return files;
}

const packOutput = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  encoding: "utf8",
});
// npm reports either an array (older versions) or an object keyed by package name.
const parsed = JSON.parse(packOutput);
const packument = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
const packed = new Set(packument.files.map((file) => file.path));

// Everything on disk must reach the tarball: the tooling, the complete template
// (npm's own exclusion rules may drop entries) and the root docs.
const expected = [
  ...listFiles("tooling").filter((file) => file.endsWith(".mjs")),
  ...listFiles("template"),
  ...REQUIRED_ROOT_FILES,
];

const missing = expected.filter((file) => !packed.has(file));

if (missing.length > 0) {
  fail(`not packed: ${missing.join(", ")} - add it to package.json "files" or rename it`);
}

const unexpected = [...packed].filter((file) => file !== "package.json" && !expected.includes(file));
if (unexpected.length > 0) {
  fail(`unexpected files in the tarball: ${unexpected.join(", ")}`);
}

if (!process.exitCode) {
  console.log(`npm pack ships all ${expected.length} expected files (tooling, template, docs).`);
}