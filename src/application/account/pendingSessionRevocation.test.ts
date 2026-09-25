import assert from "node:assert/strict";
import test from "node:test";

import { FirebaseAuthClientError, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";
import { resumePendingSessionRevocation } from "./pendingSessionRevocation";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";

const user: FirebaseAuthUserSnapshot = { email: "learner@example.com", emailVerified: true, providers: ["password"], uid: "uid-A" };
const pending = { uid: user.uid, operationId: "00000000-0000-4000-8000-000000000001" };
const completed: LocalLogoutControlSnapshot = { blocked: null, completed: [], pending: [], version: 2 };

test("resumes a pending revoke, validates the replacement session, then clears the exact durable marker", async () => {
  const calls: string[] = [];
  let generation: number | null = null;
  const result = await resumePendingSessionRevocation({
    api: {
      exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "initial-token" }; },
      revokeSessions: async (operationId) => { calls.push(`revoke:${operationId}`); return { status: "revoked", operationId, customToken: "replacement-token" }; },
    },
    auth: {
      getAuthorizationGeneration: async () => { calls.push("generation"); return generation; },
      getSnapshot: () => user,
      signInWithSessionToken: async (token) => { calls.push(`sign-in:${token}`); generation = 7; return user; },
    },
    canContinue: () => true,
    control: {
      completePendingRevoke: async (uid, operationId) => { calls.push(`complete:${uid}:${operationId}`); return completed; },
    },
    onSessionTokenSignIn: () => calls.push("block-observer"),
    pending,
    user,
  });

  assert.equal(result, completed);
  assert.deepEqual(calls, [
    "generation", "exchange", "block-observer", "sign-in:initial-token", "generation",
    `revoke:${pending.operationId}`, "block-observer", "sign-in:replacement-token", "generation",
    `complete:${user.uid}:${pending.operationId}`,
  ]);
});

test("keeps the durable marker when the replacement token changes authorization generation", async () => {
  let generation = 4;
  let completedCalled = false;
  await assert.rejects(resumePendingSessionRevocation({
    api: {
      exchangeAccountSession: async () => ({ customToken: "unused" }),
      revokeSessions: async (operationId) => ({ status: "revoked", operationId, customToken: "replacement-token" }),
    },
    auth: {
      getAuthorizationGeneration: async () => generation,
      getSnapshot: () => user,
      signInWithSessionToken: async () => { generation = 5; return user; },
    },
    canContinue: () => true,
    control: { completePendingRevoke: async () => { completedCalled = true; return completed; } },
    onSessionTokenSignIn: () => undefined,
    pending,
    user,
  }), (error: unknown) => error instanceof FirebaseAuthClientError && error.code === "auth/authorization-generation-invalid");
  assert.equal(completedCalled, false);
});

test("never clears the durable marker after the session command becomes stale", async () => {
  let current = true;
  let completedCalled = false;
  await assert.rejects(resumePendingSessionRevocation({
    api: {
      exchangeAccountSession: async () => ({ customToken: "unused" }),
      revokeSessions: async (operationId) => { current = false; return { status: "revoked", operationId, customToken: "replacement-token" }; },
    },
    auth: {
      getAuthorizationGeneration: async () => 2,
      getSnapshot: () => user,
      signInWithSessionToken: async () => user,
    },
    canContinue: () => current,
    control: { completePendingRevoke: async () => { completedCalled = true; return completed; } },
    onSessionTokenSignIn: () => undefined,
    pending,
    user,
  }));
  assert.equal(completedCalled, false);
});

test("rejects a command that becomes stale while local completion is persisted", async () => {
  let current = true;
  await assert.rejects(resumePendingSessionRevocation({
    api: {
      exchangeAccountSession: async () => ({ customToken: "exchange-token" }),
      revokeSessions: async () => ({ customToken: "replacement-token", operationId: pending.operationId, status: "revoked" }),
    },
    auth: {
      getAuthorizationGeneration: async () => 7,
      getSnapshot: () => user,
      signInWithSessionToken: async () => user,
    },
    canContinue: () => current,
    control: {
      completePendingRevoke: async () => {
        current = false;
        return completed;
      },
    },
    onSessionTokenSignIn: () => undefined,
    pending,
    user,
  }), AccountSessionGenerationStaleError);
});
