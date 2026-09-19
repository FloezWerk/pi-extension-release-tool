/**
 * `pi-release init`: creates a new pi extension repository from `template/`.
 *
 * Replaces the `__PLACEHOLDER__` tokens in file names and contents, regenerates
 * the README release-notes block with the freshly written CHANGELOG and (unless
 * `--no-git`) creates the initial commit. The template ships inside the npm
 * package, so no clone of the toolkit repository is needed.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { syncReadme } from "./readme-block.mjs";

const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "template");
const TOOLKIT_REPO = "pi-extension-release-tool";
const TOOLKIT_PACKAGE = "@floez-werk/pi-extension-release-tool";
const DEFAULT_TOOLKIT_REF = "v0.1";

/**
 * npm drops `.gitignore` from the tarball, so the template ships it as
 * `gitignore`; this is where the real name comes back. Keep in sync with
 * `tooling/check-pack.mjs` (TEMPLATE_RENAMES).
 */
const TEMPLATE_RENAMES = {
  gitignore: ".gitignore",
};

function fail(message) {
  throw new Error(message);
}

/** `@floez-werk/piagent-my-ext` -> `piagent-my-ext`. */
function repoFromPackage(packageName) {
  return packageName.split("/").pop() ?? packageName;
}

/** `pretty-api-error.ts` -> `prettyApiError`. */
function functionName(fileName) {
  return fileName
    .replace(/\.ts$/, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("");
}

/** `v0.1` -> `^0.1`, `v0.1.2` -> `^0.1.2`. */
function semverRange(ref) {
  const version = ref.replace(/^v/, "");
  return /^\d+\.\d+(\.\d+)?$/.test(version) ? `^${version}` : ref;
}

/** All files below `dir`, as paths relative to it. */
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

function replaceAll(text, values) {
  let result = text;
  for (const [token, value] of Object.entries(values)) {
    result = result.split(`__${token}__`).join(value);
  }
  return result;
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

/**
 * Scaffolds a new repository at `dir`.
 * `flags` comes from the CLI parser (`--name`, `--desc`, `--repo`, `--owner`,
 * `--ext`, `--cmd`, `--toolkit-ref`, `--force`, `--no-git`).
 */
export function scaffold(dir, flags) {
  const packageName = flags.get("name");
  const description = flags.get("desc");
  if (typeof packageName !== "string" || !packageName) fail("init needs --name <package-name>");
  if (typeof description !== "string" || !description) fail("init needs --desc <one-line-description>");

  if (existsSync(dir) && readdirSync(dir).length > 0 && !flags.get("force")) {
    fail(`${dir} is not empty (use --force to write into it anyway)`);
  }

  const repo = flags.get("repo") ?? repoFromPackage(packageName);
  const owner = flags.get("owner") ?? "FloezWerk";
  const extFile = flags.get("ext") ?? `${repo}.ts`;
  const extName = extFile.endsWith(".ts") ? extFile : `${extFile}.ts`;
  const toolkitRef = flags.get("toolkit-ref") ?? DEFAULT_TOOLKIT_REF;

  const values = {
    OWNER: owner,
    REPO: repo,
    PKG_NAME: packageName,
    DESC: description,
    EXT_FILE: extName,
    EXT_FN: functionName(extName),
    EXT_CMD: flags.get("cmd") ?? extName.replace(/\.ts$/, ""),
    TOOLKIT_REPO,
    TOOLKIT_PKG: TOOLKIT_PACKAGE,
    TOOLKIT_REF: toolkitRef,
    TOOLKIT_SEMVER: semverRange(toolkitRef),
    DATE: new Date().toISOString().slice(0, 10),
    YEAR: String(new Date().getFullYear()),
  };

  for (const relativePath of listFiles(TEMPLATE_DIR)) {
    const name = basename(relativePath);
    const renamed = TEMPLATE_RENAMES[name]
      ? join(dirname(relativePath), TEMPLATE_RENAMES[name])
      : relativePath;
    const target = join(dir, replaceAll(renamed, values));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, replaceAll(readFileSync(join(TEMPLATE_DIR, relativePath), "utf8"), values), "utf8");
  }

  // The block is derived, so generate it once instead of shipping stale text.
  const message = syncReadme({
    readmePath: join(dir, "README.md"),
    changelogPath: join(dir, "CHANGELOG.md"),
    packagePath: join(dir, "package.json"),
  });
  console.log(message);

  if (!flags.get("no-git")) {
    run("git", ["init", "-b", "main"], dir);
    run("git", ["add", "-A"], dir);
    run("git", ["commit", "-m", `Initial commit: ${packageName}`], dir);
  }

  console.log(
    [
      "",
      `Scaffolded ${packageName} in ${dir}`,
      "Next steps (see README.md of pi-extension-release-tool):",
      `  1. npm run check`,
      `  2. git remote add origin ssh://git@gitea/${owner}/${repo}.git && git push -u origin main`,
      `  3. create the GitHub repo, add the Gitea push mirror ("sync when new commits are pushed")`,
      `  4. first npm publish (manual, 2FA) and then set the GitHub secret NPM_TOKEN`,
      `  5. tag releases from then on: git tag -a v0.1.1 -m v0.1.1 && git push origin v0.1.1`,
    ].join("\n"),
  );
}

export { TOOLKIT_REPO, TOOLKIT_PACKAGE, DEFAULT_TOOLKIT_REF };