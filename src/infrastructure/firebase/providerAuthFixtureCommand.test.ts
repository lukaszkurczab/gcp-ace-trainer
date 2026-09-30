import assert from "node:assert/strict";
import test from "node:test";
import { PROVIDER_AUTH_FIXTURE_URL, PROVIDER_AUTH_FIXTURE_PROJECT_ID, isProviderAuthFixtureEnabled, parseProviderAuthFixtureUrl } from "./providerAuthFixtureCommand";

const enabledEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "development",
  PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: PROVIDER_AUTH_FIXTURE_PROJECT_ID,
  EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:9099",
};

const commandUrl = (provider = "google", scenario = "mapped") => `${PROVIDER_AUTH_FIXTURE_URL}?runId=local-run-123&provider=${provider}&scenario=${scenario}`;

test("provider fixture URL accepts only the strict local emulator command and opaque identity", () => {
  const result = parseProviderAuthFixtureUrl(commandUrl(), enabledEnvironment, true);
  assert.deepEqual(result, { kind: "armed", command: { runId: "local-run-123", provider: "google", scenario: "mapped" } });
  assert.equal(parseProviderAuthFixtureUrl(null, enabledEnvironment, true).kind, "unmatched");
  assert.equal(parseProviderAuthFixtureUrl("com.lkurczab.patternly://account", enabledEnvironment, true).kind, "unmatched");
});

test("provider fixture URL rejects extra, duplicate, reordered, malformed, and credential-bearing parameters", () => {
  const malformed = [
    `${commandUrl()}&email=private@example.test`,
    `${PROVIDER_AUTH_FIXTURE_URL}?runId=local-run-123&runId=other-run-123&provider=google&scenario=mapped`,
    `${PROVIDER_AUTH_FIXTURE_URL}?provider=google&runId=local-run-123&scenario=mapped`,
    `${commandUrl()}#fragment`,
    `${PROVIDER_AUTH_FIXTURE_URL}?runId=local-run-123&provider=google&scenario=unknown`,
    `${PROVIDER_AUTH_FIXTURE_URL}?runId=local-run-123&provider=google&scenario=mapped&token=secret`,
    `com.lkurczab.patternly://user:pass@audit/provider-auth?runId=local-run-123&provider=google&scenario=mapped`,
  ];
  for (const url of malformed) assert.deepEqual(parseProviderAuthFixtureUrl(url, enabledEnvironment, true), { kind: "invalid", reason: "malformed" });
});

test("provider fixture guard requires explicit development smoke and loopback emulator/API project", () => {
  assert.equal(isProviderAuthFixtureEnabled(enabledEnvironment, true), true);
  assert.equal(isProviderAuthFixtureEnabled(enabledEnvironment, false), false);
  for (const changed of [
    { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" },
    { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release" },
    { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" },
    { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "production" },
    { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "https://127.0.0.1:8080" },
    { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://localhost:9099" },
    { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://user:pass@127.0.0.1:8080" },
  ]) assert.equal(isProviderAuthFixtureEnabled(changed, true), false);
  assert.deepEqual(parseProviderAuthFixtureUrl(commandUrl(), { ...enabledEnvironment, EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "false" }, true), { kind: "invalid", reason: "unavailable" });
});
