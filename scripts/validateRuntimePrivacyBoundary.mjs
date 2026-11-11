import { existsSync, readdirSync, readFileSync } from "node:fs";
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

// Release perf build (Plan T0.1): the flag and the trace file sink stay behind one
// compile-time gate, so bundles built without the flag carry neither.
const PERF_FLAG_READERS = new Set(["infrastructure/runtime/runtimeMode.ts", "infrastructure/diagnostics/startupTrace.ts"]);
const PERF_SINK_OWNER = "infrastructure/diagnostics/startupTrace.ts";
const PERF_SINK_MODULE = "infrastructure/diagnostics/startupTraceSink.ts";
const PERF_SINK_GUARD = /if\s*\(\s*process\.env\.EXPO_PUBLIC_PATTERNLY_PERF_BUILD\s*===\s*"1"[^{\n]*\{\s*try\s*\{\s*sink\s*=\s*\(require\("\.\/startupTraceSink"\)/u;

function perfBuildSourceFailures(sourcePath, displayPath, source) {
  const failures = [];
  if (source.includes("EXPO_PUBLIC_PATTERNLY_PERF_BUILD") && !PERF_FLAG_READERS.has(sourcePath)) {
    failures.push(`${displayPath}: perf build flag read outside runtimeMode/startupTrace`);
  }
  const sinkValueImport = /(?:^|\n)\s*import\s+(?!type\b)[^;]*["'][^"']*startupTraceSink["']|require\(\s*["'][^"']*startupTraceSink["']\s*\)/u.test(source);
  if (sinkValueImport && sourcePath !== PERF_SINK_OWNER) failures.push(`${displayPath}: perf trace sink loaded outside startupTrace`);
  if (sourcePath === PERF_SINK_OWNER && sinkValueImport && (!PERF_SINK_GUARD.test(source) || /(?:^|\n)\s*import\s+(?!type\b)[^;]*startupTraceSink/u.test(source))) {
    failures.push(`${displayPath}: perf trace sink must load only behind the compile-time perf flag`);
  }
  if (sourcePath === PERF_SINK_MODULE && /(?:^|\n)\s*import\s+(?!type\b)[^;]*["']expo-file-system["']/u.test(source)) {
    failures.push(`${displayPath}: perf trace sink must load expo-file-system lazily`);
  }
  return failures;
}

/**
 * Built-bundle check (JS or Hermes bytecode). Without `perf`, the bundle must
 * not contain the trace sink, loopback E2E origins or the E2E credentials from
 * the current environment. With `perf`, the sink must be present.
 */
export function validateBuiltBundle(bundlePath, { perf = false, environment = process.env } = {}) {
  const bytes = readFileSync(bundlePath);
  const contains = (text) => bytes.includes(Buffer.from(text, "utf8"));
  const failures = [];
  if (perf) {
    if (!contains("perf-trace")) failures.push("bundle: perf build without the trace file sink");
    return failures;
  }
  if (contains("perf-trace")) failures.push("bundle: trace file sink present without the perf flag");
  if (contains("http://127.0.0.1")) failures.push("bundle: loopback E2E origin present");
  for (const key of ["EXPO_PUBLIC_PATTERNLY_E2E_EMAIL", "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD"]) {
    const value = environment[key];
    if (value && contains(value)) failures.push(`bundle: ${key} value present`);
  }
  return failures;
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
  const excludedSourceFiles = new Set();
  const failures = [];

  for (const path of walk(sourceRoot).filter((candidate) => /\.(ts|tsx)$/.test(candidate) && !/\.test\.(?:[cm]?[jt]sx?)$/.test(candidate) && !excludedSourceFiles.has(candidate))) {
    const source = readFileSync(path, "utf8");
    const displayPath = relative(root, path);
    for (const [label, pattern] of [
      ["raw operational error message", /\b(?:error|cause|startCause|issue)\.message\b/],
      ["production console diagnostic", /\bconsole\.(?:log|debug|info|warn|error)\s*\(/],
    ]) {
      if (pattern.test(source)) failures.push(`${displayPath}: ${label}`);
    }
    const hasNetworkClient = /(?<![.\w$])\bfetch\s*\(/u.test(source)
      || /\b(?:globalThis|window|self)\s*\.\s*fetch\s*\(/u.test(source)
      || /\bXMLHttpRequest\b|\bWebSocket\b|\baxios\b/u.test(source);
    if (hasNetworkClient) {
      const expectedExport = approvedNetworkAdapterExport(path);
      if (!expectedExport || !new RegExp(`export\\s+(?:async\\s+)?function\\s+${expectedExport}\\b`, "u").test(source)) {
        failures.push(`${displayPath}: network client outside approved adapter boundary`);
      }
    }
    if (/from\s+["']firebase(?:\/firestore)?["']|\bgetFirestore\s*\(/u.test(source)) {
      failures.push(`${displayPath}: direct Firebase Firestore client is prohibited`);
    }
    failures.push(...perfBuildSourceFailures(relative(sourceRoot, path), displayPath, source));
  }

  for (const client of ["account_auth", "entitlement", "package_delivery", "analytics_crash", "content_report"]) {
    if (!registry.includes(`"${client}"`)) failures.push(`approved client registry: missing ${client}`);
  }

  const diagnostics = readFileSync(join(sourceRoot, "application", "operationalDiagnostics.ts"), "utf8");
  if (!diagnostics.includes("export function describeOperationalFailure")) failures.push("src/application/operationalDiagnostics.ts: canonical redaction projection is missing");

  return failures;
}

// Usage: validateRuntimePrivacyBoundary.mjs [--bundle <main.jsbundle> [--perf]]
const bundleIndex = process.argv.indexOf("--bundle");
if (bundleIndex !== -1 && (!process.argv[bundleIndex + 1] || !existsSync(process.argv[bundleIndex + 1]))) {
  console.error("--bundle requires an existing bundle path");
  process.exitCode = 1;
} else {
  const failures = [
    ...validateRuntimePrivacyBoundary(),
    ...(bundleIndex === -1 ? [] : validateBuiltBundle(process.argv[bundleIndex + 1], { perf: process.argv.includes("--perf") })),
  ];
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("RUNTIME_PRIVACY_BOUNDARY_CHECK=passed");
  }
}
