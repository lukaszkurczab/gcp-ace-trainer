import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { prepareEnvironmentIsolationIos } from "./prepareEnvironmentIsolationIos.mjs";

const skip = !existsSync("/private/tmp") || typeof process.getuid !== "function";
const isolatedPlugin = createRequire(import.meta.url)("./sec03IsolatedIosPlugin.cjs");

test("the isolated callback plugin cannot be registered for the preserved app or release runtime", () => {
  for (const [bundleIdentifier, patternlyRuntime] of [["com.lkurczab.patternly", "smoke"], ["com.lkurczab.patternly.sec03", "release"]]) {
    assert.throws(() => isolatedPlugin({ ios: { bundleIdentifier }, extra: { patternlyRuntime } }), /sec03_isolated_config_required/);
  }
});

test("preparation refuses a shared output directory before copying sources", { skip }, () => {
  const root = mkdtempSync("/private/tmp/patternly-sec03-negative-");
  try {
    chmodSync(root, 0o755);
    assert.throws(() => prepareEnvironmentIsolationIos(root, join(root, "absent-key")), /private_root_rejected/);
    assert.deepEqual(readdirSync(root), []);
  } finally { rmSync(root, { recursive: true }); }
});

test("preparation refuses non-Test-Store keys or public key files without creating a project", { skip }, () => {
  const root = mkdtempSync("/private/tmp/patternly-sec03-negative-");
  try {
    chmodSync(root, 0o700);
    const key = join(root, "key.txt");
    writeFileSync(key, "appl_not_for_this_test", { mode: 0o600 });
    assert.throws(() => prepareEnvironmentIsolationIos(root, key), /test_store_key_required/);
    writeFileSync(key, "test_local_format_only");
    chmodSync(key, 0o644);
    assert.throws(() => prepareEnvironmentIsolationIos(root, key), /key_file_rejected/);
    assert.deepEqual(readdirSync(root), ["key.txt"]);
  } finally { rmSync(root, { recursive: true }); }
});
