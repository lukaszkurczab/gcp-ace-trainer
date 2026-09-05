import assert from "node:assert/strict";
import test from "node:test";

import { OAuthProvider } from "firebase/auth";

import { createAppleCredential, type AppleCredentialDependencies } from "./firebaseAuthClient";
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
