import assert from "node:assert/strict";
import test from "node:test";

import { classifyAccountFailure, isNonEnumeratingRecoveryError } from "../src/application/account/AccountSessionProvider";
import { parseConfiguredPublicEnvironment } from "../src/infrastructure/clients/publicEnvironment";
import { PatternlyApiClientError } from "../src/infrastructure/clients/PatternlyApiClientAdapter";
import { configurePatternlyAppCheckTokenProvider, getPatternlyAppCheckToken } from "../src/infrastructure/clients/patternlyAppCheckToken";
import { parseFirebaseClientConfiguration } from "../src/infrastructure/firebase/publicConfig";
import { createSecureAuthPersistence, redactPersistedAuthUser } from "../src/infrastructure/firebase/secureAuthPersistence";

const publicEnvironment = {
  apiOrigin: "https://api.patternly.example",
  androidAppLinkHost: "app.patternly.example",
  authActionOrigin: "https://auth.patternly.example",
  authRedirectDomain: "auth.patternly.example",
  environment: "sandbox",
  iosAssociatedDomain: "applinks:app.patternly.example",
  privacyUrl: "https://patternly.example/privacy",
  publicDeletionUrl: "https://patternly.example/delete",
  publicWebOrigin: "https://patternly.example",
  supportUrl: "https://patternly.example/support",
  termsUrl: "https://patternly.example/terms",
  transactionalSenderDomain: "mail.patternly.example",
} as const;

const firebaseConfiguration = {
  apiKey: "public-api-key",
  appId: "1:1234567890:ios:abcdef123456",
  authDomain: "patternly-app-sandbox.firebaseapp.com",
  googleAndroidClientId: "1234567890-android.apps.googleusercontent.com",
  googleIosClientId: "1234567890-ios.apps.googleusercontent.com",
  googleWebClientId: "1234567890-web.apps.googleusercontent.com",
  projectId: "patternly-app-sandbox",
};

test.afterEach(() => configurePatternlyAppCheckTokenProvider(null));

test("public environment and Firebase client configuration fail closed", () => {
  assert.deepEqual(parseConfiguredPublicEnvironment(publicEnvironment).environment, "sandbox");
  assert.equal(parseFirebaseClientConfiguration({}).kind, "unavailable");
  const invalidFirebase = parseFirebaseClientConfiguration({ ...firebaseConfiguration, authDomain: "https://not-a-host.example" });
  assert.equal(invalidFirebase.kind, "unavailable");
  if (invalidFirebase.kind === "unavailable") assert.equal(invalidFirebase.reason, "invalid_configuration");
  assert.equal(parseFirebaseClientConfiguration(firebaseConfiguration).kind, "configured");
});

test("secure auth persistence stores only a Firebase refresh-token-shaped record", async () => {
  let stored: string | null = null;
  const Persistence = createSecureAuthPersistence({
    deleteItemAsync: async () => { stored = null; },
    getItemAsync: async () => stored,
    setItemAsync: async (_key, value) => { stored = value; },
  });
  const persistence = new Persistence();
  const input = {
    accessToken: "synthetic-short-lived-value",
    displayName: "Patternly Test",
    email: "learner@example.com",
    emailVerified: true,
    isAnonymous: false,
    providerData: [{ providerId: "password" }],
    stsTokenManager: { accessToken: "synthetic-short-lived-value", expirationTime: 9999999999999, refreshToken: "synthetic-refresh-value" },
    uid: "firebase-user-1",
  };
  const redacted = redactPersistedAuthUser(input);
  assert.ok(redacted);
  if (!redacted) throw new Error("expected_redacted_auth_user");
  assert.equal("accessToken" in redacted, false);
  assert.equal("accessToken" in (redacted.stsTokenManager as Record<string, unknown>), false);
  assert.equal((redacted.stsTokenManager as Record<string, unknown>).expirationTime, 0);
  assert.equal(Persistence.type, "LOCAL");
  await persistence._set("firebase:authUser:patternly", input);
  assert.ok(stored);
  assert.doesNotMatch(stored, /accessToken/u);
  const restored = await persistence._get<Record<string, unknown>>("firebase:authUser:patternly");
  assert.equal(restored?.uid, "firebase-user-1");
  assert.equal((restored?.stsTokenManager as Record<string, unknown>).refreshToken, "synthetic-refresh-value");
});

test("App Check has an explicit unavailable state and never fabricates a token", async () => {
  configurePatternlyAppCheckTokenProvider(null);
  assert.equal(await getPatternlyAppCheckToken(), null);
});

test("account failures expose explicit provider, network, expiry, and revoked-session states", () => {
  assert.equal(classifyAccountFailure({ code: "auth/invalid-email", message: "private provider detail" }), "invalid");
  assert.equal(classifyAccountFailure({ code: "auth/email-already-in-use", message: "private provider detail" }), "invalidCredential");
  assert.equal(classifyAccountFailure({ code: "auth/too-many-requests", message: "private provider detail" }), "rateLimited");
  assert.equal(classifyAccountFailure({ code: "auth/network-request-failed", message: "private provider detail" }), "offline");
  assert.equal(classifyAccountFailure({ code: "auth/expired-action-code", message: "private provider detail" }), "expiredAction");
  assert.equal(classifyAccountFailure({ code: "auth/user-token-expired", message: "private provider detail" }), "revokedSession");
  assert.equal(classifyAccountFailure({ code: "auth/operation-not-allowed", message: "private provider detail" }), "providerUnavailable");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("transport_failed")), "offline");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 401, "authentication_required")), "revokedSession");
  assert.equal(classifyAccountFailure(new PatternlyApiClientError("server_error", 503)), "backendUnavailable");
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/user-not-found", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/invalid-credential", message: "private provider detail" }), true);
  assert.equal(isNonEnumeratingRecoveryError({ code: "auth/too-many-requests", message: "private provider detail" }), false);
});
