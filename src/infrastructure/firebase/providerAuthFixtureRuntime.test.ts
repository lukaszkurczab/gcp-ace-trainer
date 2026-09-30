import assert from "node:assert/strict";
import test from "node:test";
import { createAppleCredential } from "./firebaseAuthClient";
import { createProviderAuthFixtureRuntime } from "./providerAuthFixtureRuntime.smoke";
import type { ProviderAuthFixtureCommand } from "./providerAuthFixtureCommand";
import { sha256Utf8 } from "../identity/sha256";

const googleCommand: ProviderAuthFixtureCommand = Object.freeze({ runId: "local-run-123", provider: "google", scenario: "unmapped" });
const appleCommand: ProviderAuthFixtureCommand = Object.freeze({ runId: "local-run-123", provider: "apple", scenario: "mapped" });

test("Google mock OIDC token uses a stable synthetic subject and no real account fields", () => {
  const runtime = createProviderAuthFixtureRuntime();
  const first = runtime.createGoogleIdToken(googleCommand);
  const retry = runtime.createGoogleIdToken(googleCommand);
  assert.equal(first, retry);
  assert.deepEqual(JSON.parse(first), { sub: "patternly-smoke-google-local-run-123", email_verified: true });
  assert.throws(() => runtime.createGoogleIdToken(appleCommand), /armed for apple/u);
});

test("Apple fixture feeds a fresh raw nonce through the production OAuthCredential builder", async () => {
  const rawNonces = ["apple-raw-nonce-attempt-one", "apple-raw-nonce-attempt-two"];
  let nonceIndex = 0;
  const runtime = createProviderAuthFixtureRuntime({ createRawNonce: () => rawNonces[nonceIndex++]! });
  const dependencies = runtime.createAppleCredentialDependencies(appleCommand);
  const first = await createAppleCredential(dependencies);
  const second = await createAppleCredential(dependencies);
  const firstSerialized = first.toJSON() as Readonly<{ idToken?: string; nonce?: string }>;
  const secondSerialized = second.toJSON() as Readonly<{ idToken?: string; nonce?: string }>;
  assert.equal(first.providerId, "apple.com");
  assert.equal(second.providerId, "apple.com");
  assert.deepEqual(JSON.parse(firstSerialized.idToken ?? "{}"), {
    sub: "patternly-smoke-apple-local-run-123",
    email_verified: true,
    nonce: sha256Utf8(rawNonces[0]!),
  });
  assert.equal(firstSerialized.nonce, rawNonces[0]);
  assert.equal(secondSerialized.nonce, rawNonces[1]);
  assert.notEqual(firstSerialized.nonce, secondSerialized.nonce);
  assert.throws(() => runtime.createAppleCredentialDependencies(googleCommand), /armed for google/u);
});
