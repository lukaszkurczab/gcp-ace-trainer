import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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

test("an explicit backend root is not imported until repository and source-pin fences pass", () => {
  const directory = mkdtempSync(join(tmpdir(), "recovery-runner-backend-root-"));
  try {
    const backendRoot = join(directory, "backend");
    mkdirSync(join(backendRoot, "scripts"), { recursive: true });
    writeFileSync(join(backendRoot, "package.json"), JSON.stringify({ name: "sentinel-backend" }));
    writeFileSync(join(backendRoot, "scripts/isolated-emulator-test-runner.mjs"), "throw new Error('sentinel_backend_imported');\n");
    execFileSync("git", ["init", "-q"], { cwd: backendRoot });
    execFileSync("git", ["add", "."], { cwd: backendRoot });
    execFileSync("git", ["-c", "user.name=recovery-runner-test", "-c", "user.email=recovery-runner-test@example.com", "commit", "-qm", "sentinel backend"], { cwd: backendRoot });
    const canonicalBackendRoot = realpathSync(backendRoot);

    const pinsPath = join(directory, "pins.json");
    const packageSha = createHash("sha256").update(readFileSync(join(backendRoot, "package.json"))).digest("hex");
    writeFileSync(pinsPath, JSON.stringify({
      files: { "package.json": packageSha },
      appHeadAtImplementationStart: "0".repeat(40),
      producerHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: backendRoot, encoding: "utf8" }).trim(),
    }));
    const result = spawnSync(process.execPath, [runner], {
      env: { ...process.env, PATTERNLY_BACKEND_ROOT: canonicalBackendRoot, PATTERNLY_BACKEND_SOURCE_PINS: pinsPath },
      encoding: "utf8",
      timeout: 10_000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /recovery_integration_app_head_mismatch/u);
    assert.doesNotMatch(result.stderr, /sentinel_backend_imported/u);
    assert.equal(result.stdout, "");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
