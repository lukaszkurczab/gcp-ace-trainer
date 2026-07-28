import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const excludedSourceFiles = new Set([
  join(sourceRoot, "content", "bundled", "generatedArtifacts.ts"),
  join(sourceRoot, "content", "bundled", "generatedAlgorithmFeedbackAssets.ts"),
]);
const failures = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);
}

for (const path of walk(sourceRoot).filter((candidate) => /\.(ts|tsx)$/.test(candidate) && !excludedSourceFiles.has(candidate))) {
  const source = readFileSync(path, "utf8");
  const displayPath = relative(root, path);
  for (const [label, pattern] of [
    ["raw operational error message", /\b(?:error|cause|startCause|issue)\.message\b/],
    ["production console diagnostic", /\bconsole\.(?:log|debug|info|warn|error)\s*\(/],
    ["network client", /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\baxios\b/],
  ]) {
    if (pattern.test(source)) failures.push(`${displayPath}: ${label}`);
  }
}

const diagnostics = readFileSync(join(sourceRoot, "application", "operationalDiagnostics.ts"), "utf8");
if (!diagnostics.includes("export function describeOperationalFailure")) failures.push("src/application/operationalDiagnostics.ts: canonical redaction projection is missing");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("RUNTIME_PRIVACY_BOUNDARY_CHECK=passed");
}
