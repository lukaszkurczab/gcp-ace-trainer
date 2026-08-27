import assert from "node:assert/strict";
import { afterEach } from "node:test";
import test from "node:test";

import { readDevelopmentFirebaseAuthEmulatorOrigin, readPublicLegalLinksFromRuntime } from "../src/infrastructure/firebase/publicConfig";

const PUBLIC_ENVIRONMENT_KEY = "EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT";
const BACKEND_E2E_KEY = "EXPO_PUBLIC_PATTERNLY_BACKEND_E2E";
const AUTH_EMULATOR_KEY = "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN";
const originalEnvironment = process.env[PUBLIC_ENVIRONMENT_KEY];
const originalBackendE2e = process.env[BACKEND_E2E_KEY];
const originalAuthEmulator = process.env[AUTH_EMULATOR_KEY];
const developmentFlag = globalThis as typeof globalThis & { __DEV__?: boolean };
const originalDevelopment = developmentFlag.__DEV__;

afterEach(() => {
  if (originalEnvironment === undefined) delete process.env[PUBLIC_ENVIRONMENT_KEY];
  else process.env[PUBLIC_ENVIRONMENT_KEY] = originalEnvironment;
  if (originalBackendE2e === undefined) delete process.env[BACKEND_E2E_KEY];
  else process.env[BACKEND_E2E_KEY] = originalBackendE2e;
  if (originalAuthEmulator === undefined) delete process.env[AUTH_EMULATOR_KEY];
  else process.env[AUTH_EMULATOR_KEY] = originalAuthEmulator;
  if (originalDevelopment === undefined) delete developmentFlag.__DEV__;
  else developmentFlag.__DEV__ = originalDevelopment;
});

test("Firebase Auth Emulator is unavailable outside explicit development E2E", () => {
  process.env[BACKEND_E2E_KEY] = "true";
  process.env[AUTH_EMULATOR_KEY] = "http://127.0.0.1:9099";
  developmentFlag.__DEV__ = false;
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), undefined);

  developmentFlag.__DEV__ = true;
  process.env[BACKEND_E2E_KEY] = "false";
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), undefined);
});

test("Firebase Auth Emulator requires the canonical local development origin", () => {
  developmentFlag.__DEV__ = true;
  process.env[BACKEND_E2E_KEY] = "true";
  process.env[AUTH_EMULATOR_KEY] = "https://sandbox.patternly.invalid";
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), undefined);

  process.env[AUTH_EMULATOR_KEY] = "http://127.0.0.1:9099";
  assert.equal(readDevelopmentFirebaseAuthEmulatorOrigin(), "http://127.0.0.1:9099");
});

test("local builds keep public legal links explicitly unavailable without configuration", () => {
  delete process.env[PUBLIC_ENVIRONMENT_KEY];

  assert.deepEqual(readPublicLegalLinksFromRuntime(), {
    kind: "unavailable",
    reason: "no_public_environment_configuration",
  });
});

test("missing public URL fails closed instead of inferring a destination", () => {
  process.env[PUBLIC_ENVIRONMENT_KEY] = JSON.stringify({
    apiOrigin: "https://api.sandbox.patternly.invalid",
    androidAppLinkHost: "sandbox.patternly.invalid",
    authActionOrigin: "https://sandbox.patternly.invalid",
    authRedirectDomain: "sandbox.patternly.invalid",
    environment: "sandbox",
    iosAssociatedDomain: "applinks:sandbox.patternly.invalid",
    privacyUrl: "",
    publicDeletionUrl: "https://sandbox.patternly.invalid/delete",
    publicWebOrigin: "https://sandbox.patternly.invalid",
    supportUrl: "https://sandbox.patternly.invalid/support",
    termsUrl: "https://sandbox.patternly.invalid/terms",
    transactionalSenderDomain: "sandbox.patternly.invalid",
  });

  assert.deepEqual(readPublicLegalLinksFromRuntime(), {
    kind: "unavailable",
    reason: "invalid_public_environment",
  });
});

test("configured public legal links preserve the validated contract destinations", () => {
  process.env[PUBLIC_ENVIRONMENT_KEY] = JSON.stringify({
    apiOrigin: "https://api.sandbox.patternly.invalid",
    androidAppLinkHost: "sandbox.patternly.invalid",
    authActionOrigin: "https://sandbox.patternly.invalid",
    authRedirectDomain: "sandbox.patternly.invalid",
    environment: "sandbox",
    iosAssociatedDomain: "applinks:sandbox.patternly.invalid",
    privacyUrl: "https://sandbox.patternly.invalid/privacy",
    publicDeletionUrl: "https://sandbox.patternly.invalid/delete",
    publicWebOrigin: "https://sandbox.patternly.invalid",
    supportUrl: "https://sandbox.patternly.invalid/support",
    termsUrl: "https://sandbox.patternly.invalid/terms",
    transactionalSenderDomain: "sandbox.patternly.invalid",
  });

  assert.deepEqual(readPublicLegalLinksFromRuntime(), {
    kind: "configured",
    value: {
      privacyUrl: "https://sandbox.patternly.invalid/privacy",
      publicDeletionUrl: "https://sandbox.patternly.invalid/delete",
      supportUrl: "https://sandbox.patternly.invalid/support",
      termsUrl: "https://sandbox.patternly.invalid/terms",
    },
  });
});
