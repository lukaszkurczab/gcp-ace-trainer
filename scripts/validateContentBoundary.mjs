import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateBuiltContent, GENERATED_DIRECTORY, EXPECTED_INVENTORY } from "./syncBundledContentRelease.mjs";

/**
 * Legacy content identities may still be decoded by the private migration
 * boundary and transported by the content-report adapter. They must not be
 * imported or produced by the active runtime.
 */
export const LEGACY_CONTENT_IDENTITY_ALLOWLIST = Object.freeze([
  "src/domain/learning/legacyContentIdentityMapper.ts",
  "src/storage/repositories/contentIdentityInventory.ts",
  "src/storage/repositories/contentIdentityV2Planner.ts",
  "src/storage/repositories/contentIdentityMigration.ts",
  "src/storage/repositories/contentIdentityMigrationBootstrap.ts",
  "src/storage/repositories/contentIdentityUnavailableRepository.ts",
  "src/infrastructure/clients/PatternlyApiClientAdapter.ts",
  "src/storage/repositories/contentReportOutboxRepository.ts",
]);

/** These files reject legacy keys; they do not expose or persist them. */
const FAIL_CLOSED_REJECTION_GUARD_PATHS = Object.freeze([
  "src/domain/learning/resolvedContentRef.ts",
  "src/storage/contracts/contentIdentityV2.ts",
  "src/storage/repositories/accountDataRepository.ts",
]);

const LEGACY_CONTENT_IDENTITY_PATTERNS = Object.freeze([
  /\bContentPackagePin\b/u,
  /\bpackagePin\b/u,
  /\bcontentPackagePin\b/u,
]);

function relativeSourcePath(path) {
  const normalized = path.replaceAll("\\", "/");
  const sourceMarker = "/src/";
  const markerIndex = normalized.lastIndexOf(sourceMarker);
  return markerIndex >= 0 ? normalized.slice(markerIndex + 1) : normalized;
}

function isAllowlistedLegacySource(path) {
  const relativePath = relativeSourcePath(path);
  return LEGACY_CONTENT_IDENTITY_ALLOWLIST.some((candidate) => relativePath === candidate || relativePath.endsWith(`/${candidate}`));
}

function isFailClosedRejectionGuard(path) {
  const relativePath = relativeSourcePath(path);
  return FAIL_CLOSED_REJECTION_GUARD_PATHS.some((candidate) => relativePath === candidate || relativePath.endsWith(`/${candidate}`));
}

/**
 * Remove comments and, for the explicit fail-closed guards, string literals
 * before scanning. A quoted legacy key in a rejection guard is not a runtime
 * identity producer; a quoted field in active runtime code is still a leak.
 */
function stripComments(source) {
  return source.replace(/\/\/[^\r\n]*/gu, "").replace(/\/\*[\s\S]*?\*\//gu, "");
}

function stripCommentsAndStrings(source) {
  return stripComments(source).replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/gu, "");
}

export function findLegacyContentIdentityLeaks(entries) {
  return entries.flatMap(({ path, source }) => {
    if (isAllowlistedLegacySource(path)) return [];
    const scanSource = isFailClosedRejectionGuard(path) ? stripCommentsAndStrings(source) : stripComments(source);
    const matches = LEGACY_CONTENT_IDENTITY_PATTERNS
      .filter((pattern) => pattern.test(scanSource))
      .map((pattern) => pattern.source.replace(/\\b/gu, ""));
    return matches.length > 0
      ? [`${relativeSourcePath(path)}: forbidden active runtime content identity identifier(s): ${matches.join(", ")}`]
      : [];
  });
}

const root = process.cwd();
const failures = [];
const sourceRoot = join(root, "src");
function walk(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]); }
const sourcePaths = walk(sourceRoot)
  .filter((path) => /\.(ts|tsx|js|mjs)$/.test(path))
  .filter((path) => !/\.test\.(?:[cm]?[jt]sx?)$/.test(path));
const sourceEntries = sourcePaths.map((path) => ({ path, source: readFileSync(path, "utf8") }));
const source = sourceEntries.map(({ source }) => source).join("\n");
const contentSource = sourceEntries.filter(({ path }) => !path.endsWith("src/infrastructure/clients/PatternlyApiClientAdapter.ts")).map(({ source }) => source).join("\n");
failures.push(...findLegacyContentIdentityLeaks(sourceEntries));
for (const path of ["src/tracks/coding-interview/content", "src/features/questions/defaultQuestionBank.ts", "data/question-bank"]) if (existsSync(join(root, path))) failures.push(`Production content remains in application: ${path}`);
for (const pattern of [/algorithmContentGroups/, /defaultQuestionBank/, /HttpContentSource/, /ContentCacheRepository/, /loadTrackContent/, /RemoteQuestionAdapter/, /ContentCompatibilityLayer/, /\bfetch\s*\(/, /XMLHttpRequest/, /axios/, /WebSocket/, /as unknown as/, /@ts-ignore/, /@ts-expect-error/, /\bconsole\.(?:log|debug|info|warn|error)\s*\(/]) if (pattern.test(contentSource)) failures.push(`Forbidden production ingress or diagnostic path remains: ${pattern}`);
if (!source.includes("contentPackageRuntimeOwner.verifyBundledPackages")) failures.push("The canonical content preparation gate is missing.");
try {
  const result = await validateBuiltContent(join(root, GENERATED_DIRECTORY), { expectedInventory: EXPECTED_INVENTORY });
  if (result.inventory.questionCount !== EXPECTED_INVENTORY.questionCount) failures.push("Canonical content inventory is incomplete.");
} catch (error) { failures.push(`Canonical generated content failed validation: ${error.message}`); }
if (/from\s+["'][^"']*(?:tests\/|fixtures)[^"']*["']/.test(source)) failures.push("Production bundle imports a test fixture.");
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; } else console.log("CONTENT_BOUNDARY_CHECK=passed");
