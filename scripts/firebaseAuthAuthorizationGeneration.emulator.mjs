import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { createRequire } from "node:module";
import test from "node:test";

import { deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, getIdTokenResult, inMemoryPersistence, initializeAuth, signInWithCustomToken, signOut } from "firebase/auth";

const require = createRequire(import.meta.url);
const { FirebaseAuthClientError, getAuthorizationGenerationForCurrentUser } = require("../src/infrastructure/firebase/firebaseAuthClient.ts");

const PROJECT_ID = "demo-patternly-auth-generation";
const EMULATOR_ORIGIN = "http://127.0.0.1:19109";
const CUSTOM_TOKEN_AUDIENCE = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
let userSequence = 0;

function encodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createCustomToken(claims) {
  const now = Math.floor(Date.now() / 1000);
  const issuer = `auth-emulator-test@${PROJECT_ID}.iam.gserviceaccount.com`;
  const header = encodeJson({ alg: "RS256", typ: "JWT", kid: "patternly-auth-emulator-test" });
  const payload = encodeJson({
    aud: CUSTOM_TOKEN_AUDIENCE,
    claims,
    exp: now + 3600,
    iat: now,
    iss: issuer,
    sub: issuer,
    uid: `authorization-generation-test-${++userSequence}`,
  });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign("RSA-SHA256", Buffer.from(unsignedToken), privateKey).toString("base64url")}`;
}

test("Firebase Auth custom-token generation claim survives initial sign-in and forced ID-token refresh", async () => {
  const app = initializeApp({ apiKey: "fake-api-key", authDomain: `${PROJECT_ID}.firebaseapp.com`, projectId: PROJECT_ID, appId: "1:1234567890:web:auth-generation-test" }, `auth-generation-emulator-${process.pid}`);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, EMULATOR_ORIGIN, { disableWarnings: true });

  try {
    const signedIn = await signInWithCustomToken(auth, createCustomToken({ authorizationGeneration: 42 }));
    const initialResult = await getIdTokenResult(signedIn.user);
    assert.equal(initialResult.claims.authorizationGeneration, 42, "initial ID token must include the custom authorizationGeneration claim");

    const refreshedGeneration = await getAuthorizationGenerationForCurrentUser(auth, signedIn.user);
    assert.equal(refreshedGeneration, 42, "force-refreshed ID token must retain authorizationGeneration");

    await signOut(auth);
    const missingClaimUser = (await signInWithCustomToken(auth, createCustomToken({}))).user;
    const missingClaimResult = await getIdTokenResult(missingClaimUser);
    assert.equal(missingClaimResult.claims.authorizationGeneration, undefined);
    assert.equal(await getAuthorizationGenerationForCurrentUser(auth, missingClaimUser), null);

    await signOut(auth);
    const malformedClaimUser = (await signInWithCustomToken(auth, createCustomToken({ authorizationGeneration: "42" }))).user;
    await assert.rejects(
      getAuthorizationGenerationForCurrentUser(auth, malformedClaimUser),
      (error) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid",
    );
  } finally {
    await signOut(auth);
    await auth._delete();
    await deleteApp(app);
  }
});
