import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createEnvironmentIdentity } from "./environmentIdentity";

const environment = {
  PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true", EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:9099",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "demo-patternly-a", EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:ios:a",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "demo-patternly-a.firebaseapp.com",
};

test("one build/runtime digest binds endpoints, Firebase identity and the RC key, not credentials or build metadata", () => {
  const a = createEnvironmentIdentity(environment);
  const require = createRequire(import.meta.url);
  assert.equal(require("../../../app.config.js").createExpoConfig(environment).expo.extra.patternlyEnvironmentFingerprint, a.fingerprint);
  assert.equal(createEnvironmentIdentity({ ...environment, EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD: "different", BUILD_NUMBER: "2" }).fingerprint, a.fingerprint);
  assert.equal(createEnvironmentIdentity({ ...environment, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080/" }).fingerprint, a.fingerprint);
  for (const [key, value] of Object.entries({
    EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8081",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:9100",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "demo-patternly-b", EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:ios:b",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "demo-patternly-b.firebaseapp.com",
    EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "appl_another_public_key",
  })) assert.notEqual(createEnvironmentIdentity({ ...environment, [key]: value }).fingerprint, a.fingerprint, key);
});

test("missing/ambiguous/remote smoke identities fail before a marker can be assigned", () => {
  for (const replacement of [
    { EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "" }, { EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "" },
    { EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" }, { EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "https://example.test" },
  ]) assert.throws(() => createEnvironmentIdentity({ ...environment, ...replacement }));
});

test("same endpoints still separate smoke/sandbox/release; remote overrides are rejected", () => {
  const publicEnvironment = {
    environment: "sandbox", apiOrigin: "https://api.patternly.test", publicWebOrigin: "https://patternly.test",
    authActionOrigin: "https://patternly.test", authRedirectDomain: "patternly.test", androidAppLinkHost: "patternly.test",
    iosAssociatedDomain: "applinks:patternly.test", transactionalSenderDomain: "patternly.test",
    privacyUrl: "https://patternly.test/privacy", termsUrl: "https://patternly.test/terms", supportUrl: "https://patternly.test/support",
  };
  const remote = { ...environment, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "", EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "", EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: JSON.stringify(publicEnvironment) };
  const sandbox = createEnvironmentIdentity(remote);
  assert.notEqual(createEnvironmentIdentity({ ...remote, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: JSON.stringify({ ...publicEnvironment, environment: "production" }) }).fingerprint, sandbox.fingerprint);
  assert.throws(() => createEnvironmentIdentity({ ...remote, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080" }));
  assert.equal(createEnvironmentIdentity({ ...remote, EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: JSON.stringify({ ...publicEnvironment, supportUrl: "https://patternly.test/new-help" }) }).fingerprint, sandbox.fingerprint);
});
