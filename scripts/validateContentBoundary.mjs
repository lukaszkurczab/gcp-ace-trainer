import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const sourceRoot = join(root, "src");
function walk(directory) { return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]); }
const source = walk(sourceRoot).filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
for (const path of ["src/tracks/coding-interview/content", "src/features/questions/defaultQuestionBank.ts", "data/question-bank"]) if (existsSync(join(root, path))) failures.push(`Production content remains in application: ${path}`);
for (const pattern of [/algorithmContentGroups/, /defaultQuestionBank/, /HttpContentSource/, /ContentCacheRepository/, /loadTrackContent/, /RemoteQuestionAdapter/, /ContentCompatibilityLayer/, /\bfetch\s*\(/, /XMLHttpRequest/, /axios/, /WebSocket/, /as unknown as/, /@ts-ignore/, /@ts-expect-error/, /\bconsole\.(?:log|debug|info|warn|error)\s*\(/]) if (pattern.test(source)) failures.push(`Forbidden production ingress or diagnostic path remains: ${pattern}`);
if (!source.includes("contentPackageRuntimeOwner.verifyBundledPackages")) failures.push("The verified bundled-package preparation gate is missing.");
if (!source.includes("GENERATED_FREE_NODE_PACKAGES")) failures.push("The generated Free-package boundary is missing.");
const lock = JSON.parse(readFileSync(join(root, "integration", "contracts", "content-release", "release.lock.json"), "utf8"));
const generatedBundle = readFileSync(join(root, "src", "content", "bundled", "generatedFreeNodePackages.ts"), "utf8");
if (lock.schemaVersion !== 2 || !Array.isArray(lock.artifacts)) failures.push("The application content lock is invalid.");
else {
  for (const artifact of lock.artifacts) if (!generatedBundle.includes(JSON.stringify(artifact.releaseId))) failures.push(`The generated bundle does not pin producer release ${artifact.releaseId}.`);
}
if (/approvalCoverage|approvalActivationIdentity/.test(generatedBundle)) failures.push("The generated bundle retains retired approval or activation fields.");
if (/from\s+["'][^"']*(?:tests\/|fixtures)[^"']*["']/.test(source)) failures.push("Production bundle imports a test fixture.");
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; } else console.log("CONTENT_BOUNDARY_CHECK=passed");
