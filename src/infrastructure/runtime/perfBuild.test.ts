import assert from "node:assert/strict";
import test from "node:test";
import { isPatternlyLocalSmokeBuild, isPatternlyPerfBuild, readPatternlyRuntimeMode } from "./runtimeMode";
import { readPatternlyBackendRuntime } from "../clients/patternlyBackendRuntime";
import { readLocalSmokeAppCheckToken } from "../clients/localSmokeAppCheck";
import { readDevelopmentFirebaseAuthEmulatorOrigin } from "../firebase/publicConfig";
import { createAccountStartupDiagnosticWriter, readDevelopmentAccountStartupDiagnostic } from "../../application/operationalDiagnostics";

const KEYS = [
  "EXPO_PUBLIC_PATTERNLY_PERF_BUILD", "EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE", "EXPO_PUBLIC_PATTERNLY_BACKEND_E2E",
  "EXPO_PUBLIC_PATTERNLY_API_ORIGIN", "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN", "EXPO_PUBLIC_PATTERNLY_E2E_EMAIL",
  "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD", "EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID", "EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN",
] as const;
const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
const savedDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
const smoke = {
  EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
  EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080", EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:29099",
  EXPO_PUBLIC_PATTERNLY_E2E_EMAIL: "tester@example.test", EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD: "not-a-real-password",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-sandbox", EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64),
};

function configure(dev: boolean, environment: Partial<Record<(typeof KEYS)[number], string>>) {
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: dev });
  for (const key of KEYS) {
    if (environment[key] === undefined) delete process.env[key]; else process.env[key] = environment[key];
  }
}
test.after(() => {
  for (const key of KEYS) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  if (savedDev) Object.defineProperty(globalThis, "__DEV__", savedDev); else Reflect.deleteProperty(globalThis, "__DEV__");
});

test("perf flag counts only as exactly 1 inside the smoke runtime", () => {
  for (const [flag, mode] of [["1", "release"], ["1", "sandbox"], ["true", "smoke"], ["", "smoke"], [undefined, "smoke"]] as const) {
    configure(false, { ...smoke, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_PERF_BUILD: flag });
    assert.equal(isPatternlyPerfBuild(), false, `${flag}/${mode}`);
  }
  configure(false, { ...smoke, EXPO_PUBLIC_PATTERNLY_PERF_BUILD: "1" });
  assert.equal(isPatternlyPerfBuild(), true);
});

test("Release without the perf flag keeps every local smoke integration closed", () => {
  configure(false, smoke);
  assert.equal(isPatternlyLocalSmokeBuild(), false);
  assert.deepEqual(readPatternlyBackendRuntime(), { kind: "invalid", reason: "e2e_requires_development" });
  assert.equal(readLocalSmokeAppCheckToken(), null);
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), undefined);
});

test("the Release perf build opens the same local smoke integrations as development", () => {
  configure(false, { ...smoke, EXPO_PUBLIC_PATTERNLY_PERF_BUILD: "1" });
  assert.equal(isPatternlyLocalSmokeBuild(), true);
  assert.equal(readPatternlyBackendRuntime().kind, "configured");
  assert.equal(readLocalSmokeAppCheckToken(), "a".repeat(64));
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), "http://127.0.0.1:29099");
});

test("development smoke is unchanged and a perf flag outside smoke opens nothing", () => {
  configure(true, smoke);
  assert.equal(readPatternlyBackendRuntime().kind, "configured");
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), "http://127.0.0.1:29099");
  configure(false, { ...smoke, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PERF_BUILD: "1" });
  assert.deepEqual(readPatternlyBackendRuntime(), { kind: "invalid", reason: "e2e_requires_development" });
  assert.equal(readLocalSmokeAppCheckToken(), null);
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), undefined);
});

test("runtime mode falls back to smoke only for the perf build read from process.env", () => {
  configure(false, { ...smoke, EXPO_PUBLIC_PATTERNLY_PERF_BUILD: "1" });
  assert.equal(readPatternlyRuntimeMode(), "smoke");
  assert.equal(readPatternlyRuntimeMode({} as NodeJS.ProcessEnv), undefined);
  configure(false, {});
  assert.equal(readPatternlyRuntimeMode(), undefined);
});

test("account startup stages reach the trace in the Release perf build only", () => {
  configure(false, smoke);
  createAccountStartupDiagnosticWriter().ready("authenticated");
  assert.equal(readDevelopmentAccountStartupDiagnostic(), null);
  configure(false, { ...smoke, EXPO_PUBLIC_PATTERNLY_PERF_BUILD: "1" });
  createAccountStartupDiagnosticWriter().ready("authenticated");
  assert.equal(readDevelopmentAccountStartupDiagnostic()?.stage, "complete");
});
