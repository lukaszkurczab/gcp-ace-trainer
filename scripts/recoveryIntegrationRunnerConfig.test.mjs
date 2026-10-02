import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const runner = fileURLToPath(new URL("./runRecoveryOperationIntegration.mjs", import.meta.url));

for (const configuredPath of [undefined, "   "]) {
  test(`recovery integration refuses ${configuredPath === undefined ? "missing" : "blank"} producer pins before starting emulators`, () => {
    const environment = { ...process.env };
    delete environment.PATTERNLY_BACKEND_SOURCE_PINS;
    if (configuredPath !== undefined) environment.PATTERNLY_BACKEND_SOURCE_PINS = configuredPath;
    const result = spawnSync(process.execPath, [runner], { env: environment, encoding: "utf8", timeout: 10_000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /recovery_integration_backend_source_pins_required/u);
    assert.equal(result.stdout, "");
  });
}

test("an explicit producer pin file retains the exact repository HEAD fence", () => {
  const directory = mkdtempSync(join(tmpdir(), "recovery-runner-pins-"));
  try {
    const pinsPath = join(directory, "pins.json");
    writeFileSync(pinsPath, JSON.stringify({
      files: { "package.json": "0".repeat(64) },
      appHeadAtImplementationStart: "0".repeat(40),
      producerHead: "0".repeat(40),
    }));
    const environment = { ...process.env, PATTERNLY_BACKEND_SOURCE_PINS: pinsPath };
    delete environment.PATTERNLY_APP_EXPECTED_SHA;
    const result = spawnSync(process.execPath, [runner], { env: environment, encoding: "utf8", timeout: 10_000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /recovery_integration_app_head_mismatch/u);
    assert.equal(result.stdout, "");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
