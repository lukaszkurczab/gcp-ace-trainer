import assert from "node:assert/strict";
import test from "node:test";

import { FirebaseAuthClientError, parseAuthorizationGenerationClaim } from "../../infrastructure/firebase/firebaseAuthClient";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";
import { getMeWithExchangedSession } from "./accountSessionExchange";
import type { MeResponseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";

const user: FirebaseAuthUserSnapshot = { email: "learner@example.com", emailVerified: true, providers: ["password"], uid: "firebase-uid" };
const me = { user: { id: "account-id" } } as MeResponseDto;

test("ordinary Firebase identity exchanges before /me and blocks its custom-token observer event", async () => {
  const calls: string[] = [];
  let authorizationGeneration: number | null = null;
  let observerBlocked = false;
  const result = await getMeWithExchangedSession({
    api: {
      exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "session-token" }; },
      getMe: async () => { calls.push("me"); return me; },
    },
    auth: {
      getAuthorizationGeneration: async () => { calls.push("read-generation"); return authorizationGeneration; },
      getSnapshot: () => user,
      signInWithSessionToken: async () => {
        calls.push("sign-in-session-token");
        calls.push(observerBlocked ? "observer-skipped" : "observer-started-duplicate-bootstrap");
        authorizationGeneration = 1;
        return user;
      },
    },
    canContinue: () => true,
    onExchangeStarting: () => { observerBlocked = true; calls.push("block-observer"); },
    user,
  });

  assert.equal(result, me);
  assert.deepEqual(calls, ["read-generation", "exchange", "block-observer", "sign-in-session-token", "observer-skipped", "read-generation", "me"]);
});

test("a custom-token recovery session with an authorization generation bypasses exchange", async () => {
  const calls: string[] = [];
  const result = await getMeWithExchangedSession({
    api: {
      exchangeAccountSession: async () => { calls.push("unexpected-exchange"); return { customToken: "unused" }; },
      getMe: async () => { calls.push("me"); return me; },
    },
    auth: {
      getAuthorizationGeneration: async () => { calls.push("read-generation"); return 1; },
      getSnapshot: () => user,
      signInWithSessionToken: async () => { calls.push("unexpected-sign-in"); return user; },
    },
    canContinue: () => true,
    onExchangeStarting: () => { calls.push("unexpected-observer-block"); },
    user,
  });

  assert.equal(result, me);
  assert.deepEqual(calls, ["read-generation", "me"]);
});

test("a generation change after exchange prevents token sign-in and /me", async () => {
  const calls: string[] = [];
  let current = true;
  await assert.rejects(getMeWithExchangedSession({
    api: {
      exchangeAccountSession: async () => { calls.push("exchange"); current = false; return { customToken: "session-token" }; },
      getMe: async () => { calls.push("unexpected-me"); return me; },
    },
    auth: {
      getAuthorizationGeneration: async () => null,
      getSnapshot: () => user,
      signInWithSessionToken: async () => { calls.push("unexpected-sign-in"); return user; },
    },
    canContinue: () => current,
    onExchangeStarting: () => { calls.push("unexpected-observer-block"); },
    user,
  }), AccountSessionGenerationStaleError);
  assert.deepEqual(calls, ["exchange"]);
});

test("custom-token exchange requires a valid authorization generation before /me", async (t) => {
  for (const claim of [undefined, 0, "1"]) {
    await t.test(`rejects claim ${String(claim)}`, async () => {
      const calls: string[] = [];
      let rawGeneration: unknown;
      await assert.rejects(getMeWithExchangedSession({
        api: {
          exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "session-token" }; },
          getMe: async () => { calls.push("unexpected-me"); return me; },
        },
        auth: {
          getAuthorizationGeneration: async () => { calls.push("read-generation"); return parseAuthorizationGenerationClaim(rawGeneration); },
          getSnapshot: () => user,
          signInWithSessionToken: async () => {
            calls.push("sign-in-session-token");
            rawGeneration = claim;
            return user;
          },
        },
        canContinue: () => true,
        onExchangeStarting: () => calls.push("block-observer"),
        user,
      }), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid");
      assert.deepEqual(calls, ["read-generation", "exchange", "block-observer", "sign-in-session-token", "read-generation"]);
    });
  }
});
