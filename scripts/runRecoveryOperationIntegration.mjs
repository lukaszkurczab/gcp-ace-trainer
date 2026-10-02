import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runIsolatedEmulatorTests } from "../../patternly-backend/scripts/isolated-emulator-test-runner.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = resolve(appRoot, "../patternly-backend");
const pinsPath = resolve(appRoot, process.env.PATTERNLY_BACKEND_SOURCE_PINS ?? "docs/active/AUD-08/evidence/B3/CURRENT-PRODUCER-PINS.json");
const pins = JSON.parse(await readFile(pinsPath, "utf8"));
if (typeof pins.files !== "object" || pins.files === null || Array.isArray(pins.files) || Object.keys(pins.files).length === 0) {
  throw new Error("recovery_integration_producer_files_invalid");
}
const expectedAppHead = process.env.PATTERNLY_APP_EXPECTED_SHA ?? pins.appHeadAtImplementationStart;
const expectedBackendHead = pins.producerHead;
if (!/^[a-f0-9]{40}$/u.test(expectedAppHead ?? "") || !/^[a-f0-9]{40}$/u.test(expectedBackendHead ?? "")) {
  throw new Error("recovery_integration_pins_invalid");
}

function git(repositoryRoot, ...args) {
  return execFileSync("git", ["-C", repositoryRoot, ...args], { encoding: "utf8" }).trim();
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

if (resolve(git(appRoot, "rev-parse", "--show-toplevel")) !== appRoot
  || resolve(git(backendRoot, "rev-parse", "--show-toplevel")) !== backendRoot) {
  throw new Error("recovery_integration_repository_root_mismatch");
}
if (git(appRoot, "rev-parse", "HEAD") !== expectedAppHead) throw new Error("recovery_integration_app_head_mismatch");
if (git(backendRoot, "rev-parse", "HEAD") !== expectedBackendHead) throw new Error("recovery_integration_backend_head_mismatch");

for (const [relativePath, expectedHash] of Object.entries(pins.files ?? {})) {
  if (!/^[a-f0-9]{64}$/u.test(expectedHash)) throw new Error("recovery_integration_producer_pin_invalid");
  if (await sha256(join(backendRoot, relativePath)) !== expectedHash) {
    throw new Error(`recovery_integration_producer_file_mismatch:${relativePath}`);
  }
}

if (process.env.PATTERNLY_APP_SOURCE_PINS) {
  const sourcePinsPath = resolve(appRoot, process.env.PATTERNLY_APP_SOURCE_PINS);
  const sourcePins = JSON.parse(await readFile(sourcePinsPath, "utf8"));
  const sourceFiles = sourcePins.files ?? sourcePins;
  if (typeof sourceFiles !== "object" || sourceFiles === null || Array.isArray(sourceFiles)) throw new Error("recovery_integration_app_source_pins_invalid");
  for (const [relativePath, expectedHash] of Object.entries(sourceFiles)) {
    const absolutePath = resolve(appRoot, relativePath);
    if (!absolutePath.startsWith(`${appRoot}/`) || !/^[a-f0-9]{64}$/u.test(expectedHash)) throw new Error("recovery_integration_app_source_pin_invalid");
    if (await sha256(absolutePath) !== expectedHash) throw new Error(`recovery_integration_app_source_mismatch:${relativePath}`);
  }
}

const tsxLoader = join(appRoot, "node_modules/tsx/dist/loader.mjs");
const testPath = join(appRoot, "scripts/recoveryOperationIntegration.emulator.test.ts");
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
const command = `${quote(process.execPath)} --import ${quote(tsxLoader)} --test --test-concurrency=1 ${quote(testPath)}`;

console.log(`AUD-08 B3 mobile integration: app=${expectedAppHead} backend=${expectedBackendHead} producerPins=${Object.keys(pins.files).length}`);
process.exitCode = await runIsolatedEmulatorTests({
  backendRoot,
  projectId: "demo-patternly-aud08-mobile",
  command,
  environment: {
    AUD08_RECOVERY_MOBILE_INTEGRATION: "1",
    PATTERNLY_BACKEND_ROOT: backendRoot,
    PATTERNLY_APP_ROOT: appRoot,
  },
});
