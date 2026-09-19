#!/usr/bin/env node
/**
 * Self-test: scaffolds an extension repository into a temporary directory and
 * verifies the result. Keeps the template, the placeholder replacement and the
 * release tooling honest - `npm run check` fails when the template no longer
 * works end to end.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const TOOLING = dirname(fileURLToPath(import.meta.url));
const CLI = join(TOOLING, "cli.mjs");
const PACKAGE = "@floez-werk/piagent-self-test";
const EXPECTED_EXT = "extensions/piagent-self-test.ts";

function fail(message) {
  console.error(`::error::self-test: ${message}`);
  process.exitCode = 1;
}

function listFiles(dir) {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else files.push(relative(dir, path));
    }
  };
  walk(dir);
  return files;
}

function run(args, options = {}) {
  return execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8", ...options });
}

const dir = mkdtempSync(join(tmpdir(), "pi-release-self-test-"));

try {
  run(["init", dir, "--name", PACKAGE, "--desc", "Self-test extension", "--no-git"]);

  const files = listFiles(dir);
  const required = [
    "AGENTS.md",
    "README.md",
    "CHANGELOG.md",
    "package.json",
    "LICENSE",
    ".gitignore",
    ".gitattributes",
    ".github/workflows/ci.yml",
    ".github/workflows/release.yml",
    EXPECTED_EXT,
  ];
  for (const file of required) {
    if (!files.includes(file)) fail(`missing ${file} (got: ${files.join(", ")})`);
  }

  // No placeholder may survive the replacement.
  for (const file of files) {
    const leftover = /__[A-Z0-9_]+__/.exec(readFileSync(join(dir, file), "utf8"));
    if (leftover) fail(`${file} still contains ${leftover[0]}`);
  }

  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (pkg.name !== PACKAGE) fail(`package.json has name ${pkg.name}`);
  if (pkg.version !== "0.1.0") fail(`package.json has version ${pkg.version}`);
  if (!String(pkg.scripts["check:readme"]).includes("pi-extension-release-tool@^0.1")) {
    fail("check:readme does not reference the published tooling");
  }

  const workflows = `${readFileSync(join(dir, ".github/workflows/ci.yml"), "utf8")}\n${readFileSync(
    join(dir, ".github/workflows/release.yml"),
    "utf8",
  )}`;
  if (!workflows.includes("FloezWerk/pi-extension-release-tool/.github/workflows/")) {
    fail("workflows do not call the shared reusable workflows");
  }
  if (!workflows.includes("@v0.1")) fail("workflows do not pin the toolkit ref");

  // The generated README block must match the generated CHANGELOG, and the
  // release notes must be derivable - verified with the tooling itself.
  const check = run(["sync-readme-changelog", "--check"], { cwd: dir });
  if (!check.includes("matches 0.1.0")) fail(`unexpected check output: ${check.trim()}`);

  const notes = run(["release-notes"], { cwd: dir });
  if (!notes.includes("### Changes in 0.1.0")) fail(`unexpected release notes: ${notes.trim()}`);

  // Negative test: init must refuse a non-empty target directory. Expected
  // errors are captured, so they do not pollute the check output.
  let refused = false;
  try {
    run(["init", dir, "--name", PACKAGE, "--desc", "again", "--no-git"], { stdio: "pipe" });
  } catch {
    refused = true;
  }
  if (!refused) fail("init overwrote a non-empty directory without --force");

  // Negative test: a stale README block must be reported.
  const readmePath = join(dir, "README.md");
  const original = readFileSync(readmePath, "utf8");
  writeFileSync(readmePath, original.replace("**0.1.0 - ", "**9.9.9 - "), "utf8");
  let staleReported = false;
  try {
    run(["sync-readme-changelog", "--check"], { cwd: dir, stdio: "pipe" });
  } catch {
    staleReported = true;
  }
  if (!staleReported) fail("a stale README release-notes block was not reported");
  writeFileSync(readmePath, original, "utf8");

  if (process.exitCode) {
    console.error("self-test failed");
  } else {
    console.log(`self-test passed (${files.length} files scaffolded and verified)`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}