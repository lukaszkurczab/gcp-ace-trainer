import assert from "node:assert/strict";
import test from "node:test";

import { FirebaseAuthClientError, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { LocalLogoutControlSnapshot, PendingRevoke } from "../../infrastructure/storage/localLogoutControl";
import { createPendingSessionRevocationDrain, drainPendingSessionRevocations, resumePendingSessionRevocation } from "./pendingSessionRevocation";
import { AccountSessionGenerationStaleError } from "./profileStartupCoordination";

const user: FirebaseAuthUserSnapshot = { email: "learner@example.com", emailVerified: true, providers: ["password"], uid: "uid-A" };
const pending = { uid: user.uid, operationId: "00000000-0000-4000-8000-000000000001" };
const completed: LocalLogoutControlSnapshot = { blocked: null, completed: [], pending: [], version: 2 };

function controlSnapshot(...pendingRows: readonly PendingRevoke[]): LocalLogoutControlSnapshot {
  return { blocked: pendingRows[0] ?? null, completed: [], pending: [...pendingRows], version: 2 };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function owner(uid: string, generation: number, current: () => { uid: string; generation: number }) {
  return { generation, uid, isCurrent: () => {
    const latest = current();
    return latest.uid === uid && latest.generation === generation;
  } };
}

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

test("same UID and generation join one pending-revocation batch", async () => {
  const executor = createPendingSessionRevocationDrain();
  let current = { uid: user.uid, generation: 3 };
  let snapshot = controlSnapshot(pending);
  let reads = 0;
  let revokeCalls = 0;
  let completionCalls = 0;
  let authGeneration: number | null = 7;
  const control = {
    read: async () => { reads += 1; return snapshot; },
    completePendingRevoke: async (uid: string, operationId: string) => {
      completionCalls += 1;
      snapshot = { blocked: null, completed: [{ uid, operationId }], pending: [], version: 2 };
      return snapshot;
    },
  };
  const input = {
    api: {
      exchangeAccountSession: async () => ({ customToken: "exchange" }),
      revokeSessions: async (operationId: string) => {
        revokeCalls += 1;
        return { status: "revoked" as const, operationId, customToken: "replacement" };
      },
    },
    auth: {
      getAuthorizationGeneration: async () => authGeneration,
      getSnapshot: () => user,
      signInWithSessionToken: async () => { authGeneration = 7; return user; },
    },
    canContinue: owner(user.uid, 3, () => current).isCurrent,
    control,
    executor,
    generation: 3,
    onSnapshot: () => undefined,
    onSessionTokenSignIn: () => undefined,
    user,
  };

  const first = drainPendingSessionRevocations(input);
  const second = drainPendingSessionRevocations(input);
  assert.deepEqual(await Promise.all([first, second]), [snapshot, snapshot]);
  assert.equal(reads, 1);
  assert.equal(revokeCalls, 1);
  assert.equal(completionCalls, 1);
  current = { uid: user.uid, generation: 4 };
});

test("a new generation waits, re-reads the marker, and retries only after the stale owner settles", async () => {
  const executor = createPendingSessionRevocationDrain();
  let current = { uid: user.uid, generation: 1 };
  let snapshot = controlSnapshot(pending);
  let reads = 0;
  let revokeCalls = 0;
  let completionCalls = 0;
  let authGeneration: number | null = 7;
  let activeRevokes = 0;
  let maximumConcurrentRevokes = 0;
  const publishedByGeneration: number[] = [];
  const entered = deferred<void>();
  const release = deferred<void>();
  const control = {
    read: async () => { reads += 1; return snapshot; },
    completePendingRevoke: async (uid: string, operationId: string) => {
      completionCalls += 1;
      snapshot = { blocked: null, completed: [{ uid, operationId }], pending: [], version: 2 };
      return snapshot;
    },
  };
  const shared = {
    api: {
      exchangeAccountSession: async () => ({ customToken: "exchange" }),
      revokeSessions: async (operationId: string) => {
        revokeCalls += 1;
        activeRevokes += 1;
        maximumConcurrentRevokes = Math.max(maximumConcurrentRevokes, activeRevokes);
        if (revokeCalls === 1) {
          entered.resolve();
          await release.promise;
        }
        activeRevokes -= 1;
        return { status: "revoked" as const, operationId, customToken: `replacement-${revokeCalls}` };
      },
    },
    auth: {
      getAuthorizationGeneration: async () => authGeneration,
      getSnapshot: () => user,
      signInWithSessionToken: async () => { authGeneration = 7; return user; },
    },
    control,
    executor,
    onSnapshot: () => {
      if (current.generation === 1) publishedByGeneration.push(1);
      if (current.generation === 2) publishedByGeneration.push(2);
    },
    onSessionTokenSignIn: () => undefined,
    user,
  };
  const stale = drainPendingSessionRevocations({ ...shared, canContinue: owner(user.uid, 1, () => current).isCurrent, generation: 1 });
  await entered.promise;
  current = { uid: user.uid, generation: 2 };
  const fresh = drainPendingSessionRevocations({ ...shared, canContinue: owner(user.uid, 2, () => current).isCurrent, generation: 2 });
  const freshWaiter = drainPendingSessionRevocations({ ...shared, canContinue: owner(user.uid, 2, () => current).isCurrent, generation: 2 });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(reads, 1, "the new owner must wait instead of reading through the active Auth mutation");
  release.resolve();

  await assert.rejects(stale, AccountSessionGenerationStaleError);
  assert.deepEqual(await Promise.all([fresh, freshWaiter]), [snapshot, snapshot]);
  assert.equal(reads, 2, "the new owner performs a fresh durable read after the old owner settles");
  assert.equal(revokeCalls, 2, "the same durable operation may be replayed after the stale request settles");
  assert.equal(completionCalls, 1, "only the current owner completes the exact durable marker");
  assert.equal(maximumConcurrentRevokes, 1);
  assert.deepEqual(publishedByGeneration, [1, 2, 2], "the stale owner publishes no result after generation B takes ownership");
});

test("a different UID never consumes or completes the stale owner's marker", async () => {
  const executor = createPendingSessionRevocationDrain();
  const otherUser: FirebaseAuthUserSnapshot = { ...user, uid: "uid-B" };
  const otherPending = { uid: otherUser.uid, operationId: "00000000-0000-4000-8000-000000000002" };
  let current = { uid: user.uid, generation: 1 };
  let authUser = user;
  let snapshot = controlSnapshot(pending, otherPending);
  let completionRows: PendingRevoke[] = [];
  const entered = deferred<void>();
  const release = deferred<void>();
  const control = {
    read: async () => snapshot,
    completePendingRevoke: async (uid: string, operationId: string) => {
      completionRows = [...completionRows, { uid, operationId }];
      snapshot = { ...snapshot, blocked: null, completed: [...snapshot.completed, { uid, operationId }], pending: snapshot.pending.filter((row) => row.uid !== uid || row.operationId !== operationId) };
      return snapshot;
    },
  };
  let firstRevoke = true;
  const api = {
    exchangeAccountSession: async () => ({ customToken: "exchange" }),
    revokeSessions: async (operationId: string) => {
      if (firstRevoke) {
        firstRevoke = false;
        entered.resolve();
        await release.promise;
      }
      return { status: "revoked" as const, operationId, customToken: "replacement" };
    },
  };
  const auth = {
    getAuthorizationGeneration: async () => 7,
    getSnapshot: () => authUser,
    signInWithSessionToken: async () => authUser,
  };
  const stale = drainPendingSessionRevocations({
    api, auth, canContinue: owner(user.uid, 1, () => current).isCurrent, control, executor, generation: 1,
    onSnapshot: () => undefined, onSessionTokenSignIn: () => undefined, user,
  });
  await entered.promise;
  current = { uid: otherUser.uid, generation: 2 };
  authUser = otherUser;
  const fresh = drainPendingSessionRevocations({
    api, auth, canContinue: owner(otherUser.uid, 2, () => current).isCurrent, control, executor, generation: 2,
    onSnapshot: () => undefined, onSessionTokenSignIn: () => undefined, user: otherUser,
  });
  release.resolve();
  await assert.rejects(stale, AccountSessionGenerationStaleError);
  await fresh;
  assert.deepEqual(completionRows, [otherPending]);
  assert.deepEqual(snapshot.pending, [pending]);
});

test("a failed exact-operation replay retains its pending marker", async () => {
  const executor = createPendingSessionRevocationDrain();
  let snapshot = controlSnapshot(pending);
  let completionCalls = 0;
  await assert.rejects(drainPendingSessionRevocations({
    api: {
      exchangeAccountSession: async () => ({ customToken: "exchange" }),
      revokeSessions: async () => { throw new Error("session_revocation_operation_conflict"); },
    },
    auth: {
      getAuthorizationGeneration: async () => 7,
      getSnapshot: () => user,
      signInWithSessionToken: async () => user,
    },
    canContinue: () => true,
    control: {
      read: async () => snapshot,
      completePendingRevoke: async () => { completionCalls += 1; return completed; },
    },
    executor,
    generation: 9,
    onSnapshot: () => undefined,
    onSessionTokenSignIn: () => undefined,
    user,
  }));
  assert.deepEqual(snapshot.pending, [pending]);
  assert.equal(completionCalls, 0);
});
