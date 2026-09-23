import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { isLoopbackHttpOrigin, parseDotenv, probeSmokeApiReady, probeSmokeAuthEmulator, runLocalProfile, validateLocalProfile } from "./runLocalProfile.mjs";

const smoke = Object.freeze({
  PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
  EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:9099",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "local-api-key",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:123:ios:local",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "patternly-app-sandbox.firebaseapp.com",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: "local-android-client",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: "local-ios-client",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: "local-web-client",
  EXPO_PUBLIC_PATTERNLY_E2E_EMAIL: "smoke@example.test",
  EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD: "local-password",
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
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "invalid" }), /local App Check/);
  assert.throws(() => validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64), EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "production" }), /FIREBASE_PROJECT_ID=patternly-app-sandbox/);
  for (const key of ["EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY", "EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID", "EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID"]) {
    assert.throws(() => validateLocalProfile("smoke", { ...smoke, [key]: "" }), new RegExp(key));
  }
  assert.equal(validateLocalProfile("smoke", { ...smoke, EXPO_PUBLIC_PATTERNLY_E2E_EMAIL: "", EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD: "" }).EXPO_NO_DOTENV, "1");
});

test("sandbox profile rejects every local auth override", () => {
  const sandbox = { PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" };
  assert.equal(validateLocalProfile("sandbox", sandbox).EXPO_NO_DOTENV, "1");
  assert.throws(() => validateLocalProfile("sandbox", { ...sandbox, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" }), /must not set/);
  assert.throws(() => validateLocalProfile("sandbox", { ...sandbox, EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN: "a".repeat(64) }), /must not set/);
});

test("smoke emulator probe reports profile, origin, and action on failure", async () => {
  await assert.rejects(
    () => probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async () => { throw new Error("sensitive-value"); }),
    (error) => /profile=smoke origin=http:\/\/127\.0\.0\.1:9099 action=start Firebase Auth emulator, then rerun npm run start:smoke/.test(error.message) && !error.message.includes("sensitive-value"),
  );
});

test("Auth probe requires the documented emulator configuration response", async () => {
  const calls = [];
  await probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async (url) => {
    calls.push(url.pathname);
    return { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false }, extra: true }) };
  });
  assert.deepEqual(calls, ["/emulator/v1/projects/patternly-app-sandbox/config"]);
  await assert.rejects(() => probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async () => ({ ok: false, json: async () => ({}) })), /probe failed/);
  await assert.rejects(() => probeSmokeAuthEmulator("http://127.0.0.1:9099", "patternly-app-sandbox", async () => ({ ok: true, json: async () => ({ signIn: {} }) })), /probe failed/);
});

test("API readiness waits for dependencies and rejects false checks", async () => {
  let calls = 0;
  await probeSmokeApiReady("http://127.0.0.1:8080", async (url) => {
    assert.equal(url.pathname, "/ready");
    calls += 1;
    return { ok: true, json: async () => calls === 1
      ? { status: "ready", checks: { database: false, authentication: true, providerReader: true } }
      : { status: "ready", checks: { database: true, authentication: true, providerReader: true } } };
  }, { timeoutMs: 100, delayMs: 0 });
  assert.equal(calls, 2);
  await assert.rejects(() => probeSmokeApiReady("http://127.0.0.1:8080", async () => ({ ok: true, json: async () => ({ status: "ready", checks: { database: false, authentication: true, providerReader: true } }) }), { timeoutMs: 5, delayMs: 0 }), /not ready/);
});

test("failed smoke preflight cannot spawn Expo", async () => {
  const root = mkdtempSync(join(tmpdir(), "patternly-smoke-preflight-"));
  try {
    writeFileSync(join(root, ".env.smoke.local"), Object.entries(smoke).map(([key, value]) => `${key}=${value}`).join("\n"));
    await assert.rejects(() => runLocalProfile(["smoke", "start"], {
      repositoryRoot: root,
      command: "/no-such-expo-command",
      fetchImplementation: async (url) => url.pathname.includes("/config")
        ? { ok: true, json: async () => ({ signIn: { allowDuplicateEmails: false } }) }
        : { ok: false, json: async () => ({ status: "not_ready" }) },
    }), /smoke API is not ready/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
