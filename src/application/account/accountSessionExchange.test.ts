import assert from "node:assert/strict";
import test from "node:test";

import { FirebaseAuthClientError, parseAuthorizationGenerationClaim } from "../../infrastructure/firebase/firebaseAuthClient";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";
import { ensureRecoveryIssueSignInSession, getMeWithExchangedSession } from "./accountSessionExchange";
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
    requiredAuthorizationGeneration: 1,
  });

  assert.equal(result, me);
  assert.deepEqual(calls, ["read-generation", "me"]);
});

test("recovery requires its exact generation and never exchanges a missing or mismatched claim", async (t) => {
  for (const generation of [null, 1, 3]) {
    await t.test(`rejects generation ${String(generation)}`, async () => {
      const calls: string[] = [];
      await assert.rejects(getMeWithExchangedSession({
        api: {
          exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "unused" }; },
          getMe: async () => { calls.push("me"); return me; },
        },
        auth: {
          getAuthorizationGeneration: async () => generation,
          getSnapshot: () => user,
          signInWithSessionToken: async () => { calls.push("sign-in"); return user; },
        },
        canContinue: () => true,
        onExchangeStarting: () => calls.push("block-observer"),
        user,
        requiredAuthorizationGeneration: 2,
      }), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid");
      assert.deepEqual(calls, []);
    });
  }
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

test("recovery issue session restore requires a current explicit sign-in intent and matching UID", async (t) => {
  const cases = [
    { name: "before the user chooses sign-in", explicit: false, canContinue: true, snapshot: user },
    { name: "after the pending intent expires", explicit: true, canContinue: false, snapshot: user },
    { name: "after restart has lost the pending intent", explicit: false, canContinue: true, snapshot: user },
    { name: "when Firebase is bound to another UID", explicit: true, canContinue: true, snapshot: { ...user, uid: "different-uid" } },
  ] as const;
  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const calls: string[] = [];
      await assert.rejects(ensureRecoveryIssueSignInSession({
        api: { exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "session-token" }; } },
        auth: {
          getAuthorizationGeneration: async () => { calls.push("read-generation"); return null; },
          getSnapshot: () => scenario.snapshot,
          signInWithSessionToken: async () => { calls.push("sign-in"); return user; },
        },
        canContinue: () => scenario.canContinue,
        isExplicitSignInCurrent: () => scenario.explicit,
        onExchangeStarting: () => calls.push("block-observer"),
        user,
        requiredAuthorizationGeneration: 7,
      }), AccountSessionGenerationStaleError);
      assert.deepEqual(calls, []);
    });
  }
});

test("recovery issue session restore rejects a present mismatched or malformed generation before exchange", async (t) => {
  await t.test("present wrong generation", async () => {
    const calls: string[] = [];
    await assert.rejects(ensureRecoveryIssueSignInSession({
      api: { exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "session-token" }; } },
      auth: {
        getAuthorizationGeneration: async () => { calls.push("read-generation"); return 8; },
        getSnapshot: () => user,
        signInWithSessionToken: async () => { calls.push("sign-in"); return user; },
      },
      canContinue: () => true,
      isExplicitSignInCurrent: () => true,
      onExchangeStarting: () => calls.push("block-observer"),
      user,
      requiredAuthorizationGeneration: 7,
    }), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid");
    assert.deepEqual(calls, ["read-generation"]);
  });

  await t.test("malformed Firebase claim", async () => {
    const calls: string[] = [];
    await assert.rejects(ensureRecoveryIssueSignInSession({
      api: { exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "session-token" }; } },
      auth: {
        getAuthorizationGeneration: async () => {
          calls.push("read-generation");
          return parseAuthorizationGenerationClaim(0);
        },
        getSnapshot: () => user,
        signInWithSessionToken: async () => { calls.push("sign-in"); return user; },
      },
      canContinue: () => true,
      isExplicitSignInCurrent: () => true,
      onExchangeStarting: () => calls.push("block-observer"),
      user,
      requiredAuthorizationGeneration: 7,
    }), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid");
    assert.deepEqual(calls, ["read-generation"]);
  });
});

test("a missing recovery generation restores only for current explicit intent, then checks the exact generation", async () => {
  const calls: string[] = [];
  let generation: number | null = null;
  const restored = await ensureRecoveryIssueSignInSession({
    api: { exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "session-token" }; } },
    auth: {
      getAuthorizationGeneration: async () => { calls.push("read-generation"); return generation; },
      getSnapshot: () => user,
      signInWithSessionToken: async () => {
        calls.push("sign-in-session-token");
        generation = 7;
        return user;
      },
    },
    canContinue: () => true,
    isExplicitSignInCurrent: () => true,
    onExchangeStarting: () => calls.push("block-observer"),
    user,
    requiredAuthorizationGeneration: 7,
  });

  assert.equal(restored, 7);
  assert.equal(calls.filter((call) => call === "exchange").length, 1);
  assert.equal(calls.filter((call) => call === "block-observer").length, 1);
  assert.equal(calls.filter((call) => call === "sign-in-session-token").length, 1);
  assert.deepEqual(calls, ["read-generation", "read-generation", "exchange", "block-observer", "sign-in-session-token", "read-generation"]);
});

test("recovery intent expiring during exchange prevents observer release and Firebase sign-in", async () => {
  const calls: string[] = [];
  let intentCurrent = true;
  await assert.rejects(ensureRecoveryIssueSignInSession({
    api: { exchangeAccountSession: async () => { calls.push("exchange"); intentCurrent = false; return { customToken: "session-token" }; } },
    auth: {
      getAuthorizationGeneration: async () => { calls.push("read-generation"); return null; },
      getSnapshot: () => user,
      signInWithSessionToken: async () => { calls.push("sign-in"); return user; },
    },
    canContinue: () => true,
    isExplicitSignInCurrent: () => intentCurrent,
    onExchangeStarting: () => calls.push("block-observer"),
    user,
    requiredAuthorizationGeneration: 7,
  }), AccountSessionGenerationStaleError);
  assert.deepEqual(calls, ["read-generation", "read-generation", "exchange"]);
});

test("a recovery sign-in returning another generation fails before ACK or /me", async () => {
  const calls: string[] = [];
  const runRecoveryRead = async () => {
    const restored = await ensureRecoveryIssueSignInSession({
      api: { exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "session-token" }; } },
      auth: {
        getAuthorizationGeneration: async () => {
          calls.push("read-generation");
          return calls.includes("sign-in-session-token") ? 8 : null;
        },
        getSnapshot: () => user,
        signInWithSessionToken: async () => { calls.push("sign-in-session-token"); return user; },
      },
      canContinue: () => true,
      isExplicitSignInCurrent: () => true,
      onExchangeStarting: () => calls.push("block-observer"),
      user,
      requiredAuthorizationGeneration: 7,
    });
    assert.equal(restored, 7);
    calls.push("acknowledge");
    calls.push("me");
  };

  await assert.rejects(runRecoveryRead(), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid");
  assert.deepEqual(calls, ["read-generation", "read-generation", "exchange", "block-observer", "sign-in-session-token", "read-generation"]);
});
