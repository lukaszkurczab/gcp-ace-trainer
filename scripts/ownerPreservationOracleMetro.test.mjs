import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const metroConfigPath = resolve(root, "metro.config.js");
const ownerOracleRequest = "../../infrastructure/testing/ownerPreservationOracleRuntime";
const ownerSourceRequest = "../testing/ownerPreservationSourceRuntime";
const ownerSourceRuntimeRequest = "./ownerPreservationSourceRuntime";

function resolvedOracleFor(mode) {
  process.env.PATTERNLY_RUNTIME_MODE = mode;
  delete require.cache[metroConfigPath];
  const config = require(metroConfigPath);
  const fallback = () => { throw new Error("oracle request was not intercepted by Metro"); };
  return config.resolver.resolveRequest({ resolveRequest: fallback }, ownerOracleRequest, "ios");
}

test("Metro module graph selects smoke oracle only for smoke bundles", () => {
  const smoke = resolvedOracleFor("smoke");
  assert.equal(smoke.type, "sourceFile");
  assert.equal(smoke.filePath, resolve(root, "src/infrastructure/testing/ownerPreservationOracleRuntime.smoke.ts"));

  for (const request of [ownerSourceRequest, ownerSourceRuntimeRequest]) {
    const source = require(metroConfigPath).resolver.resolveRequest({ resolveRequest() { throw new Error("owner source request was not intercepted by Metro"); } }, request, "ios");
    assert.equal(source.type, "sourceFile");
    assert.equal(source.filePath, resolve(root, "src/infrastructure/testing/ownerPreservationSourceRuntime.smoke.ts"));
  }

  for (const mode of ["sandbox", "release", "unset-or-invalid"]) {
    const selected = resolvedOracleFor(mode);
    assert.equal(selected.type, "sourceFile");
    assert.equal(selected.filePath, resolve(root, "src/infrastructure/testing/ownerPreservationOracleRuntime.disabled.ts"));
    assert.notEqual(selected.filePath, smoke.filePath);

    const source = require(metroConfigPath).resolver.resolveRequest({ resolveRequest() { throw new Error("owner source request was not intercepted by Metro"); } }, ownerSourceRequest, "ios");
    assert.equal(source.filePath, resolve(root, "src/infrastructure/testing/ownerPreservationSourceRuntime.disabled.ts"));
  }
});

test("narrow Metro bundles include smoke oracle modules only in smoke graph", () => {
  const outputRoot = mkdtempSync(resolve(tmpdir(), "patternly-owner-oracle-bundle-"));
  try {
    const graphs = new Map();
    for (const mode of ["smoke", "release"]) {
      const output = resolve(outputRoot, `${mode}.js`);
      execFileSync(resolve(root, "node_modules/.bin/metro"), [
        "build", "scripts/fixtures/owner-preservation-oracle.bundle-entry.js",
        "--platform", "ios", "--out", output, "--config", "metro.config.js", "--max-workers", "1",
      ], {
        cwd: root,
        env: { ...process.env, PATTERNLY_RUNTIME_MODE: mode },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120_000,
        maxBuffer: 16 * 1024 * 1024,
      });
      const bundle = readFileSync(output, "utf8");
      graphs.set(mode, { bundle });
    }

    const smoke = graphs.get("smoke");
    const release = graphs.get("release");
    assert.ok(smoke.bundle.includes("patternly.smoke.owner-preservation-oracle.v1"));
    assert.ok(smoke.bundle.includes("createSmokeOwnerPreservationOracle"));
    assert.ok(smoke.bundle.includes("getLegacyOwnerReadOnlyScope"));
    assert.ok(!release.bundle.includes("patternly.smoke.owner-preservation-oracle.v1"));
    assert.ok(release.bundle.includes("ownerPreservationOracleRuntime"));
    assert.ok(!release.bundle.includes("createSmokeOwnerPreservationOracle"));
  } finally {
    rmSync(outputRoot, { recursive: true, force: true });
  }
});
