/**
 * Shared helper for the release tooling: pulls a single version section out of
 * a `CHANGELOG.md` (Keep a Changelog format).
 *
 * Used by `sync-readme-changelog` (README release-notes block) and
 * `release-notes` (GitHub release body), in this repository and in every
 * extension repository that consumes the published package.
 */

/**
 * Returns the body of the `## [version]` section, without the heading and
 * without the trailing link-reference definitions that close the file.
 * Returns null when the version has no section.
 */
export function changelogSection(text, version) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) return null;

  const body = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    // Next version heading or the "[x.y.z]: https://..." reference list.
    if (line.startsWith("## ") || /^\[[^\]]+\]:\s*http/.test(line)) break;
    body.push(line);
  }

  // The last section of a CHANGELOG is followed by the reader notes and the
  // link references; the references are cut above, the notes are stripped here
  // so they do not leak into the README block or the GitHub release body.
  const section = body.join("\n").trim().replace(/(?:\s*<!--[\s\S]*?-->\s*)+$/, "").trim();
  return section || null;
}

/** Date of the `## [version] - YYYY-MM-DD` heading, or null. */
export function changelogDate(text, version) {
  const match = new RegExp(`^## \\[${version}\\]\\s*-\\s*(\\S+)\\s*$`, "m").exec(text);
  return match ? match[1] : null;
}

/** Markers around the release-notes block in a README. */
export const CHANGELOG_START = "<!-- changelog:start -->";
export const CHANGELOG_END = "<!-- changelog:end -->";