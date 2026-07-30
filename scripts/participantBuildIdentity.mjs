import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";

export const PARTICIPANT_BUILD_IDENTITY_SCHEMA_VERSION = 1;

const EXACT_BUILD_INPUTS = new Set([
  "App.tsx",
  "app.json",
  "babel.config.cjs",
  "babel.config.js",
  "babel.config.mjs",
  "eas.json",
  "integration/contracts/content-release/release.lock.json",
  "metro.config.cjs",
  "metro.config.js",
  "metro.config.mjs",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
]);

const BUILD_INPUT_PREFIXES = [
  "assets/",
  "plugins/",
  "src/",
];

const BUILD_INPUT_EXTENSIONS = new Set([
  ".cjs",
  ".gif",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".mp3",
  ".otf",
  ".png",
  ".svg",
  ".ts",
  ".tsx",
  ".ttf",
  ".wav",
  ".webp",
]);

export function isParticipantBuildInput(path) {
  const normalized = normalizeRelativePath(path);
  if (!normalized) return false;
  if (EXACT_BUILD_INPUTS.has(normalized)) return true;
  return BUILD_INPUT_PREFIXES.some((prefix) => normalized.startsWith(prefix))
    && BUILD_INPUT_EXTENSIONS.has(extname(normalized).toLowerCase());
}

export function buildParticipantBuildIdentity(repositoryRoot) {
  const baseCommit = runGit(repositoryRoot, ["rev-parse", "HEAD"]).trim();
  const files = runGit(repositoryRoot, [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
  ])
    .split("\n")
    .filter(Boolean)
    .filter(isParticipantBuildInput)
    .sort();

  const digest = createHash("sha256");
  for (const file of files) {
    const absolutePath = `${repositoryRoot}/${file}`;
    const exists = existsSync(absolutePath);
    digest.update(file);
    digest.update("\0");
    digest.update(exists ? "file" : "deleted");
    digest.update("\0");
    if (exists) digest.update(readFileSync(absolutePath));
    digest.update("\0");
  }

  return Object.freeze({
    identity_schema_version: PARTICIPANT_BUILD_IDENTITY_SCHEMA_VERSION,
    base_commit: baseCommit,
    input_count: files.length,
    participant_build_inputs_sha256: digest.digest("hex"),
  });
}

function normalizeRelativePath(path) {
  if (typeof path !== "string" || path.length === 0 || isAbsolute(path)) return null;
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//, "");
  if (
    normalized.length === 0
    || normalized === ".."
    || normalized.startsWith("../")
    || normalized.includes("/../")
  ) {
    return null;
  }
  return normalized;
}

function runGit(repositoryRoot, args) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}
