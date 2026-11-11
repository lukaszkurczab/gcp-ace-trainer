import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const validator = resolve("scripts/validateRuntimePrivacyBoundary.mjs");
const registry = `export const APPROVED_CLIENT_ADAPTERS = Object.freeze({
  account_auth: Object.freeze({ exportName: "createPatternlyApiClient", fileName: "PatternlyApiClientAdapter.ts" }),
  entitlement: Object.freeze({ exportName: "createEntitlementClientAdapter", fileName: "EntitlementClientAdapter.ts" }),
  package_delivery: Object.freeze({ exportName: "createPackageDeliveryClientAdapter", fileName: "PackageDeliveryClientAdapter.ts" }),
  analytics_crash: Object.freeze({ exportName: "createAnalyticsCrashClientAdapter", fileName: "AnalyticsCrashClientAdapter.ts" }),
  content_report: Object.freeze({ exportName: "createContentReportClientAdapter", fileName: "ContentReportClientAdapter.ts" }),
} satisfies Record<string, unknown>);
export const clients = ["account_auth", "entitlement", "package_delivery", "analytics_crash", "content_report"];
`;
const guardedTrace = `import type { StartupTraceSink } from "./startupTraceSink";
let sink: StartupTraceSink | null = null;
if (process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD === "1" && isPatternlyPerfBuild()) {
  try {
    sink = (require("./startupTraceSink") as typeof import("./startupTraceSink")).createExpoStartupTraceSink();
  } catch { sink = null; }
}
`;
const lazySink = `export function sink() { return require("expo-file-system"); }\n`;

function run(files: Readonly<Record<string, string | Buffer>>, args: readonly string[] = [], env: Readonly<Record<string, string>> = {}) {
  const fixture = mkdtempSync(join(tmpdir(), "patternly-perf-privacy-"));
  try {
    const all: Record<string, string | Buffer> = {
      "src/application/operationalDiagnostics.ts": "export function describeOperationalFailure() {}\n",
      "src/infrastructure/clients/approvedClientRegistry.ts": registry,
      ...files,
    };
    for (const [relativePath, source] of Object.entries(all)) {
      const path = join(fixture, relativePath);
      mkdirSync(resolve(path, ".."), { recursive: true });
      writeFileSync(path, source);
    }
    return spawnSync(process.execPath, [validator, ...args.map((arg) => arg.startsWith("@") ? join(fixture, arg.slice(1)) : arg)], {
      cwd: fixture, encoding: "utf8", env: { PATH: process.env.PATH, NODE_ENV: "test", ...env },
    });
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
}

test("the perf flag and the trace sink stay behind the compile-time gate in source", () => {
  const clean = run({
    "src/infrastructure/diagnostics/startupTrace.ts": guardedTrace,
    "src/infrastructure/diagnostics/startupTraceSink.ts": lazySink,
    "src/infrastructure/runtime/runtimeMode.ts": `export const perf = process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD === "1";\n`,
  });
  assert.equal(clean.status, 0, clean.stderr);

  const leaks = run({
    "src/features/home/Home.ts": `export const perf = process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD;\nimport { createExpoStartupTraceSink } from "../../infrastructure/diagnostics/startupTraceSink";\n`,
    "src/infrastructure/diagnostics/startupTrace.ts": `import { createExpoStartupTraceSink } from "./startupTraceSink";\n`,
    "src/infrastructure/diagnostics/startupTraceSink.ts": `import { File } from "expo-file-system";\n`,
  });
  assert.equal(leaks.status, 1);
  assert.match(leaks.stderr, /Home\.ts: perf build flag read outside runtimeMode\/startupTrace/u);
  assert.match(leaks.stderr, /Home\.ts: perf trace sink loaded outside startupTrace/u);
  assert.match(leaks.stderr, /startupTrace\.ts: perf trace sink must load only behind the compile-time perf flag/u);
  assert.match(leaks.stderr, /startupTraceSink\.ts: perf trace sink must load expo-file-system lazily/u);
});

test("built bundles without the flag carry no sink, loopback origin or E2E credentials", () => {
  const source = { "src/infrastructure/diagnostics/startupTrace.ts": guardedTrace };
  assert.equal(run({ ...source, "out/main.jsbundle": "var a=1;" }, ["--bundle", "@out/main.jsbundle"]).status, 0);
  const leaked = run({ ...source, "out/main.jsbundle": Buffer.from("x perf-trace y http://127.0.0.1:8080 tester@example.test") },
    ["--bundle", "@out/main.jsbundle"], { EXPO_PUBLIC_PATTERNLY_E2E_EMAIL: "tester@example.test" });
  assert.equal(leaked.status, 1);
  assert.match(leaked.stderr, /trace file sink present without the perf flag/u);
  assert.match(leaked.stderr, /loopback E2E origin present/u);
  assert.match(leaked.stderr, /EXPO_PUBLIC_PATTERNLY_E2E_EMAIL value present/u);
  assert.doesNotMatch(leaked.stderr, /tester@example\.test/u);
  assert.equal(run({ ...source, "out/main.jsbundle": "perf-trace" }, ["--bundle", "@out/main.jsbundle", "--perf"]).status, 0);
  assert.equal(run({ ...source, "out/main.jsbundle": "var a=1;" }, ["--bundle", "@out/main.jsbundle", "--perf"]).status, 1);
});
