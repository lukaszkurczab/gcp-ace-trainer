import assert from "node:assert/strict";
import test from "node:test";

import { OAuthProvider } from "firebase/auth";

import { completeLocalFirebaseAuthSignOut, createAppleCredential, FirebaseAuthClientError, getAuthorizationGenerationForCurrentUser, parseAuthorizationGenerationClaim, type AppleCredentialDependencies } from "./firebaseAuthClient";
import { AUTH_USER_STORAGE_KEY, clearPersistedFirebaseAuthUser } from "./secureAuthPersistence";
import { sha256Utf8 } from "../identity/sha256";

test("Apple nonce boundary hashes the Expo request and preserves the Firebase raw nonce", async () => {
  const rawNonce = "raw-apple-nonce-for-boundary-test";
  let expoNonce: string | undefined;
  const dependencies: AppleCredentialDependencies = {
    apple: {
      AppleAuthenticationScope: { EMAIL: 1, FULL_NAME: 0 },
      isAvailableAsync: async () => true,
      signInAsync: async (options) => {
        expoNonce = options?.nonce;
        return { identityToken: "apple-identity-token" } as Awaited<ReturnType<AppleCredentialDependencies["apple"]["signInAsync"]>>;
      },
    } as AppleCredentialDependencies["apple"],
    createCredential: (identityToken, preservedRawNonce) => new OAuthProvider("apple.com").credential({ idToken: identityToken, rawNonce: preservedRawNonce }),
    createRawNonce: () => rawNonce,
  };

  const credential = await createAppleCredential(dependencies);
  const serialized = credential.toJSON() as Readonly<{ idToken?: string; nonce?: string }>;

  assert.equal(expoNonce, sha256Utf8(rawNonce));
  assert.equal(serialized.idToken, "apple-identity-token");
  assert.equal(serialized.nonce, rawNonce);
  assert.notEqual(expoNonce, rawNonce);
});

test("authorization generation claim identifies exchanged sessions and rejects malformed values", () => {
  assert.equal(parseAuthorizationGenerationClaim(undefined), null);
  assert.equal(parseAuthorizationGenerationClaim(1), 1);
  assert.equal(parseAuthorizationGenerationClaim(12), 12);
  for (const value of [null, 0, -1, 1.5, "1", Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => parseAuthorizationGenerationClaim(value), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid");
  }
});

test("authorization generation reads force-refresh claims for the same current Firebase identity", async () => {
  const auth = { currentUser: { uid: "firebase-uid" } };
  const currentUser = auth.currentUser;
  const calls: unknown[][] = [];
  const generation = await getAuthorizationGenerationForCurrentUser(auth, currentUser, async (user, forceRefresh) => {
    calls.push([user.uid, forceRefresh]);
    return { claims: { authorizationGeneration: 7 } };
  });

  assert.equal(generation, 7);
  assert.deepEqual(calls, [["firebase-uid", true]]);
});

test("authorization generation refresh rejects a result after the Firebase identity changes", async () => {
  const auth: { currentUser: { uid: string } | null } = { currentUser: { uid: "firebase-uid" } };
  const currentUser = auth.currentUser!;
  await assert.rejects(getAuthorizationGenerationForCurrentUser(auth, currentUser, async () => {
    auth.currentUser = { uid: "different-uid" };
    return { claims: { authorizationGeneration: 7 } };
  }), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/uid-changed");
});

test("local Firebase sign-out retries and verifies persisted-user removal after SDK persistence rejection", async () => {
  const stored = new Map([[AUTH_USER_STORAGE_KEY, "persisted-refresh-token"]]);
  const secureStore = {
    deleteItemAsync: async (key: string) => { stored.delete(key); },
    getItemAsync: async (key: string) => stored.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => { stored.set(key, value); },
  };
  const sdkUser = { uid: "firebase-user" };
  let currentUser: typeof sdkUser | null = sdkUser;
  let publishedUser: typeof sdkUser | null = sdkUser;
  const calls: string[] = [];

  await completeLocalFirebaseAuthSignOut({
    clearPersistedUser: async () => {
      calls.push("clear-persisted-user");
      await clearPersistedFirebaseAuthUser(secureStore);
    },
    getCurrentUser: () => currentUser,
    publishCurrentUser: (user) => { publishedUser = user; },
    signOut: async () => {
      calls.push("firebase-sign-out");
      currentUser = null;
      throw new Error("firebase_persistence_remove_rejected");
    },
  });

  assert.deepEqual(calls, ["firebase-sign-out", "clear-persisted-user"]);
  assert.equal(currentUser, null);
  assert.equal(publishedUser, null);
  assert.equal(stored.has(AUTH_USER_STORAGE_KEY), false);
});

test("local Firebase sign-out stays failed if Auth still has a user or persistence cannot be verified", async () => {
  const sdkUser = { uid: "firebase-user" };
  let currentUser: typeof sdkUser | null = sdkUser;
  let clearAttempted = false;
  await assert.rejects(completeLocalFirebaseAuthSignOut({
    clearPersistedUser: async () => { clearAttempted = true; },
    getCurrentUser: () => currentUser,
    publishCurrentUser: () => undefined,
    signOut: async () => { throw new Error("sign-out-did-not-clear-auth"); },
  }), /sign-out-did-not-clear-auth/u);
  assert.equal(clearAttempted, false);

  currentUser = null;
  await assert.rejects(completeLocalFirebaseAuthSignOut({
    clearPersistedUser: async () => { throw new Error("auth-persistence-clear-failed"); },
    getCurrentUser: () => currentUser,
    publishCurrentUser: () => undefined,
    signOut: async () => { throw new Error("firebase-persistence-remove-rejected"); },
  }), /auth-persistence-clear-failed/u);
});
