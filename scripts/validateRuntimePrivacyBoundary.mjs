import { readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]);
}

function loadApprovedClientAdapters(source) {
  const adapterSection = /APPROVED_CLIENT_ADAPTERS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\s+satisfies/u.exec(source)?.[1];
  if (!adapterSection) throw new Error("approved client registry adapter manifest is missing");
  const entries = [...adapterSection.matchAll(/\b(account_auth|entitlement|package_delivery|analytics_crash|content_report):\s*Object\.freeze\(\{\s*exportName:\s*"([A-Za-z][A-Za-z0-9_]*)",\s*fileName:\s*"([A-Za-z][A-Za-z0-9]*ClientAdapter\.ts)"\s*\}\)/gu)];
  if (entries.length !== 5 || new Set(entries.map((entry) => entry[1])).size !== 5) throw new Error("approved client registry adapter manifest is invalid");
  return new Map(entries.map((entry) => [entry[3], entry[2]]));
}

export function validateRuntimePrivacyBoundary(root = process.cwd()) {
  const sourceRoot = join(root, "src");
  const approvedClientDirectory = join(sourceRoot, "infrastructure", "clients");
  const registry = readFileSync(join(approvedClientDirectory, "approvedClientRegistry.ts"), "utf8");
  const approvedClientAdapters = loadApprovedClientAdapters(registry);
  const approvedNetworkAdapterExport = (path) => {
    const candidate = relative(approvedClientDirectory, path);
    if (candidate === "" || candidate.startsWith("..") || isAbsolute(candidate) || candidate.includes("/")) return undefined;
    return approvedClientAdapters.get(candidate);
  };
  const excludedSourceFiles = new Set([
    join(sourceRoot, "content", "bundled", "generatedArtifacts.ts"),
    join(sourceRoot, "content", "bundled", "generatedAlgorithmFeedbackAssets.ts"),
  ]);
  const failures = [];

  for (const path of walk(sourceRoot).filter((candidate) => /\.(ts|tsx)$/.test(candidate) && !excludedSourceFiles.has(candidate))) {
    const source = readFileSync(path, "utf8");
    const displayPath = relative(root, path);
    for (const [label, pattern] of [
      ["raw operational error message", /\b(?:error|cause|startCause|issue)\.message\b/],
      ["production console diagnostic", /\bconsole\.(?:log|debug|info|warn|error)\s*\(/],
    ]) {
      if (pattern.test(source)) failures.push(`${displayPath}: ${label}`);
    }
    if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\baxios\b/.test(source)) {
      const expectedExport = approvedNetworkAdapterExport(path);
      if (!expectedExport || !new RegExp(`export\\s+(?:async\\s+)?function\\s+${expectedExport}\\b`, "u").test(source)) {
        failures.push(`${displayPath}: network client outside approved adapter boundary`);
      }
    }
    if (/from\s+["']firebase(?:\/firestore)?["']|\bgetFirestore\s*\(/u.test(source)) {
      failures.push(`${displayPath}: direct Firebase Firestore client is prohibited`);
    }
  }

  for (const client of ["account_auth", "entitlement", "package_delivery", "analytics_crash", "content_report"]) {
    if (!registry.includes(`"${client}"`)) failures.push(`approved client registry: missing ${client}`);
  }

  const diagnostics = readFileSync(join(sourceRoot, "application", "operationalDiagnostics.ts"), "utf8");
  if (!diagnostics.includes("export function describeOperationalFailure")) failures.push("src/application/operationalDiagnostics.ts: canonical redaction projection is missing");

  return failures;
}

const failures = validateRuntimePrivacyBoundary();
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("RUNTIME_PRIVACY_BOUNDARY_CHECK=passed");
}
