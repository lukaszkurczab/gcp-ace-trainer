import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateBuiltContent, GENERATED_DIRECTORY, EXPECTED_INVENTORY } from "./syncBundledContentRelease.mjs";

const root = process.cwd();
const failures = [];
const sourceRoot = join(root, "src");
function walk(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]); }
const sourcePaths = walk(sourceRoot)
  .filter((path) => /\.(ts|tsx|js|mjs)$/.test(path))
  .filter((path) => !/\.test\.(?:[cm]?[jt]sx?)$/.test(path));
const source = sourcePaths.map((path) => readFileSync(path, "utf8")).join("\n");
const contentSource = sourcePaths.filter((path) => !path.endsWith("src/infrastructure/clients/PatternlyApiClientAdapter.ts")).map((path) => readFileSync(path, "utf8")).join("\n");
for (const path of ["src/tracks/coding-interview/content", "src/features/questions/defaultQuestionBank.ts", "data/question-bank"]) if (existsSync(join(root, path))) failures.push(`Production content remains in application: ${path}`);
for (const pattern of [/algorithmContentGroups/, /defaultQuestionBank/, /HttpContentSource/, /ContentCacheRepository/, /loadTrackContent/, /RemoteQuestionAdapter/, /ContentCompatibilityLayer/, /\bfetch\s*\(/, /XMLHttpRequest/, /axios/, /WebSocket/, /as unknown as/, /@ts-ignore/, /@ts-expect-error/, /\bconsole\.(?:log|debug|info|warn|error)\s*\(/]) if (pattern.test(contentSource)) failures.push(`Forbidden production ingress or diagnostic path remains: ${pattern}`);
if (!source.includes("contentPackageRuntimeOwner.verifyBundledPackages")) failures.push("The canonical content preparation gate is missing.");
try {
  const result = await validateBuiltContent(join(root, GENERATED_DIRECTORY), { expectedInventory: EXPECTED_INVENTORY });
  if (result.inventory.questionCount !== EXPECTED_INVENTORY.questionCount) failures.push("Canonical content inventory is incomplete.");
} catch (error) { failures.push(`Canonical generated content failed validation: ${error.message}`); }
if (/from\s+["'][^"']*(?:tests\/|fixtures)[^"']*["']/.test(source)) failures.push("Production bundle imports a test fixture.");
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; } else console.log("CONTENT_BOUNDARY_CHECK=passed");
