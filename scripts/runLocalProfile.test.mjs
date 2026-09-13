import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isLoopbackHttpOrigin, parseDotenv, probeSmokeAuthEmulator, validateLocalProfile } from "./runLocalProfile.mjs";

const smoke = Object.freeze({
  PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
  EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:9099",
});

test("local profile dotenv parser has no process side effect", () => {
  assert.deepEqual(parseDotenv("# comment\nA=one\nB=\"two\"\n"), { A: "one", B: "two" });
  assert.throws(() => parseDotenv("not-an-assignment"), /invalid dotenv/);
});

test("generic local commands refuse to select a profile", () => {
  const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
  for (const command of ["start", "web", "ios", "android"]) assert.equal(scripts[command], "node scripts/runLocalProfile.mjs");
  assert.equal(scripts["start:smoke"], "node scripts/runLocalProfile.mjs smoke start");
  assert.equal(scripts["start:sandbox"], "node scripts/runLocalProfile.mjs sandbox start");
  assert.equal(scripts["web:smoke"], "node scripts/runLocalProfile.mjs smoke web");
  assert.equal(scripts["web:sandbox"], "node scripts/runLocalProfile.mjs sandbox web");
});

test("smoke profile requires explicit matching local E2E endpoints", () => {
  assert.equal(validateLocalProfile("smoke", smoke).EXPO_NO_DOTENV, "1");
  assert.ok(isLoopbackHttpOrigin(smoke.EXPO_PUBLIC_PATTERNLY_API_ORIGIN));
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" }), /BACKEND_E2E=true/);
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "https://sandbox.patternly.invalid" }), /127\.0\.0\.1/);
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" }), /matching/);
});

test("sandbox profile rejects every local auth override", () => {
  const sandbox = { PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" };
  assert.equal(validateLocalProfile("sandbox", sandbox).EXPO_NO_DOTENV, "1");
  assert.throws(() => validateLocalProfile("sandbox", { ...sandbox, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" }), /must not set/);
});

test("smoke emulator probe reports profile, origin, and action on failure", async () => {
  await assert.rejects(
    () => probeSmokeAuthEmulator("http://127.0.0.1:9099", async () => { throw new Error("connection refused"); }),
    /profile=smoke origin=http:\/\/127\.0\.0\.1:9099 action=start Firebase Auth emulator, then rerun npm run start:smoke/,
  );
});
