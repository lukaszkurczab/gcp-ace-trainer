import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanupDeletionProofs,
  deleteAccountRemotely,
  type AccountDeletionPort,
  type DeletionProofCleanupPort,
} from "../server/src/deletion.js";
import { FirebaseAccountDeletionAdapter, type DeletionProof } from "../server/src/firebaseAdapters.js";
import { authenticateSchedulerRequest, type SchedulerClaims } from "../server/src/schedulerAuthentication.js";

const completedAt = new Date("2026-08-01T12:00:00.000Z");

test("deletes in revoke-data-identity-proof order and emits exactly the five canonical proof fields", async () => {
  const calls: string[] = [];
  let recorded: unknown;
  const port: AccountDeletionPort = {
    assertWritable: async () => undefined,
    writeDeletionIntent: async () => { calls.push("intent"); },
    revokeSessions: async () => { calls.push("revoke"); },
    deleteRemoteData: async () => { calls.push("data"); },
    deleteIdentity: async () => { calls.push("identity"); },
    readDeletionProof: async () => undefined,
    recordDeletionProof: async (proof) => { calls.push("proof"); recorded = proof; },
  };
  const proof = await deleteAccountRemotely({
    now: () => completedAt,
    port,
    requestId: "request_123456789",
    requestedAt: "2026-08-01T11:59:00.000Z",
    uid: "user-1",
  });

  assert.deepEqual(calls, ["intent", "revoke", "data", "identity", "proof"]);
  assert.deepEqual(Object.keys(proof).sort(), [
    "completedAt",
    "irreversibleAccountIdHash",
    "requestId",
    "requestedAt",
    "resultCode",
  ]);
  assert.equal(recorded, proof);
  assert.equal(proof.irreversibleAccountIdHash.length, 64);
});

test("never records a success proof when revocation, data deletion, or identity deletion fails", async () => {
  for (const failedStep of ["revoke", "data", "identity"] as const) {
    let proofs = 0;
    const step = async (name: typeof failedStep): Promise<void> => {
      if (name === failedStep) throw new Error(`failed:${name}`);
    };
    await assert.rejects(deleteAccountRemotely({
      now: () => completedAt,
      requestId: "request_123456789",
      requestedAt: "2026-08-01T11:59:00.000Z",
      uid: "user-1",
      port: {
        assertWritable: async () => undefined,
        writeDeletionIntent: async () => undefined,
        revokeSessions: () => step("revoke"),
        deleteRemoteData: () => step("data"),
        deleteIdentity: () => step("identity"),
        readDeletionProof: async () => undefined,
        recordDeletionProof: async () => { proofs += 1; },
      },
    }), new RegExp(`failed:${failedStep}`, "u"));
    assert.equal(proofs, 0, failedStep);
  }
});

test("cleanup uses pages of 100, max 20/2000, stable cursors and a final limit-one probe", async () => {
  const limits: number[] = [];
  const cursors: unknown[] = [];
  let page = 0;
  let probes = 0;
  const port: DeletionProofCleanupPort = {
    cleanupExpiredProofs: async (_expiry, cursor, limit) => {
      limits.push(limit);
      cursors.push(cursor);
      page += 1;
      return {
        deleted: 100,
        cursor: { completedAt: `2026-07-${String(page).padStart(2, "0")}T00:00:00.000Z`, documentId: `proof-${page}` },
      };
    },
    hasExpiredProof: async () => { probes += 1; return true; },
  };
  const result = await cleanupDeletionProofs({ clockMilliseconds: () => 0, now: completedAt, port });
  assert.deepEqual(result, { attempts: 20, deleted: 2_000, outcome: "cleanup_incomplete_retryable" });
  assert.ok(limits.every((limit) => limit === 100));
  assert.equal(cursors[0], undefined);
  assert.deepEqual(cursors[1], { completedAt: "2026-07-01T00:00:00.000Z", documentId: "proof-1" });
  assert.equal(probes, 1);
});

test("cleanup requires ten seconds before every page and final probe", async () => {
  for (const [elapsed, expectedCalls, expectedOutcome] of [
    [230_001, 0, "cleanup_incomplete_retryable"],
    [230_000, 1, "complete"],
    [229_999, 1, "complete"],
  ] as const) {
    let clockReads = 0;
    let calls = 0;
    let probes = 0;
    const result = await cleanupDeletionProofs({
      now: completedAt,
      clockMilliseconds: () => clockReads++ === 0 ? 0 : elapsed,
      port: {
        cleanupExpiredProofs: async () => { calls += 1; return { deleted: 0 }; },
        hasExpiredProof: async () => { probes += 1; return false; },
      },
    });
    assert.equal(calls, expectedCalls, String(elapsed));
    assert.equal(probes, expectedCalls, String(elapsed));
    assert.equal(result.outcome, expectedOutcome, String(elapsed));
  }
});

test("cleanup never probes after page work consumes the deadline margin", async () => {
  let clock = 0;
  let calls = 0;
  let probes = 0;
  const result = await cleanupDeletionProofs({
    now: completedAt,
    clockMilliseconds: () => clock,
    port: {
      cleanupExpiredProofs: async () => {
        calls += 1;
        clock = 230_001;
        return { deleted: 1, cursor: { completedAt: completedAt.toISOString(), documentId: "proof-1" } };
      },
      hasExpiredProof: async () => { probes += 1; return false; },
    },
  });
  assert.equal(calls, 1);
  assert.equal(probes, 0);
  assert.deepEqual(result, { attempts: 1, deleted: 1, outcome: "cleanup_incomplete_retryable" });
});

test("cleanup maps page/probe errors and malformed pages to retryable without false completion", async () => {
  const ports: readonly DeletionProofCleanupPort[] = [
    { cleanupExpiredProofs: async () => { throw new Error("page failed"); }, hasExpiredProof: async () => false },
    { cleanupExpiredProofs: async () => ({ deleted: 101 }), hasExpiredProof: async () => false },
    { cleanupExpiredProofs: async () => ({ deleted: 1 }), hasExpiredProof: async () => false },
    { cleanupExpiredProofs: async () => ({ deleted: 0 }), hasExpiredProof: async () => { throw new Error("probe failed"); } },
  ];
  for (const port of ports) {
    assert.equal((await cleanupDeletionProofs({ clockMilliseconds: () => 0, now: completedAt, port })).outcome, "cleanup_incomplete_retryable");
  }
});

test("cleanup uses exact 30-day expiry and duplicate delivery remains safe", async () => {
  const expiries: string[] = [];
  const port: DeletionProofCleanupPort = {
    cleanupExpiredProofs: async (expiry) => { expiries.push(expiry); return { deleted: 0 }; },
    hasExpiredProof: async () => false,
  };
  assert.equal((await cleanupDeletionProofs({ clockMilliseconds: () => 0, now: completedAt, port })).outcome, "complete");
  assert.equal((await cleanupDeletionProofs({ clockMilliseconds: () => 0, now: completedAt, port })).outcome, "complete");
  assert.deepEqual(expiries, ["2026-07-02T12:00:00.000Z", "2026-07-02T12:00:00.000Z"]);
});

test("scheduler authentication binds signature verification to exact audience, issuer, email and immutable numeric subject", async () => {
  const audience = "https://patternly-api.example.run.app";
  const claims: SchedulerClaims = {
    aud: audience,
    email: "patternly-scheduler@patternly-app-sandbox.iam.gserviceaccount.com",
    email_verified: true,
    exp: 2_000,
    iss: "https://accounts.google.com",
    sub: "123456789012345678901",
  };
  const base = {
    authorization: "Bearer google-signed-token",
    expectedAudience: audience,
    expectedEmail: claims.email!,
    expectedSubject: claims.sub!,
    nowSeconds: () => 1_000,
  };
  await authenticateSchedulerRequest({ ...base, verifier: { verify: async () => claims } });

  for (const invalid of [
    { ...claims, aud: "https://other.example" },
    { ...claims, iss: "https://issuer.invalid" },
    { ...claims, iss: "accounts.google.com" },
    { ...claims, email_verified: false },
    { ...claims, email: "patternly-runtime@patternly-app-sandbox.iam.gserviceaccount.com" },
    { ...claims, sub: "not-numeric" },
    { ...claims, exp: 1_000 },
  ]) {
    await assert.rejects(authenticateSchedulerRequest({
      ...base,
      verifier: { verify: async () => invalid },
    }));
  }
});

test("requires canonical non-future requestedAt and bounded identifiers", async () => {
  const port: AccountDeletionPort = {
    assertWritable: async () => undefined,
    writeDeletionIntent: async () => undefined,
    deleteIdentity: async () => undefined,
    deleteRemoteData: async () => undefined,
    readDeletionProof: async () => undefined,
    recordDeletionProof: async () => undefined,
    revokeSessions: async () => undefined,
  };
  for (const input of [
    { requestId: "short", requestedAt: "2026-08-01T11:59:00.000Z", uid: "uid" },
    { requestId: "request_123456789", requestedAt: "2026-08-01T11:59:00Z", uid: "uid" },
    { requestId: "request_123456789", requestedAt: "2026-08-01T12:00:00.001Z", uid: "uid" },
    { requestId: "request_123456789", requestedAt: "2026-08-01T11:59:00.000Z", uid: "" },
  ]) {
    await assert.rejects(deleteAccountRemotely({ ...input, now: () => completedAt, port }));
  }
});

test("returns an identical existing proof without destructive replay and rejects a mismatched proof", async () => {
  const existing: DeletionProof = {
    completedAt: completedAt.toISOString(),
    irreversibleAccountIdHash: "c6c289e49e9c05b2145860387b73bcb18df43fb09a1e4a4a9713c76c88bb541b",
    requestId: "request_123456789",
    requestedAt: "2026-08-01T11:59:00.000Z",
    resultCode: "account_deleted",
  };
  let destructiveCalls = 0;
  const port: AccountDeletionPort = {
    assertWritable: async () => undefined,
    writeDeletionIntent: async () => undefined,
    readDeletionProof: async () => existing,
    revokeSessions: async () => { destructiveCalls += 1; },
    deleteRemoteData: async () => { destructiveCalls += 1; },
    deleteIdentity: async () => { destructiveCalls += 1; },
    recordDeletionProof: async () => { destructiveCalls += 1; },
  };
  assert.equal(await deleteAccountRemotely({
    now: () => completedAt,
    port,
    requestId: existing.requestId,
    requestedAt: existing.requestedAt,
    uid: "user-1",
  }), existing);
  assert.equal(destructiveCalls, 0);
  await assert.rejects(deleteAccountRemotely({
    now: () => completedAt,
    port: { ...port, readDeletionProof: async () => ({ ...existing, irreversibleAccountIdHash: "different" }) },
    requestId: existing.requestId,
    requestedAt: existing.requestedAt,
    uid: "user-1",
  }), /deletion_proof_collision/u);
});

test("Firebase deletion adapter tolerates an already-absent identity for revocation and deletion", async () => {
  const missing = Object.assign(new Error("missing"), { code: "auth/user-not-found" });
  const auth = {
    revokeRefreshTokens: async () => { throw missing; },
    deleteUser: async () => { throw missing; },
  };
  const adapter = new FirebaseAccountDeletionAdapter({} as never, auth as never);
  await adapter.revokeSessions("absent-user");
  await adapter.deleteIdentity("absent-user");
});

test("Firebase deletion adapter persists a UID tombstone outside recursive account data", async () => {
  let lifecycle: unknown;
  let creates = 0;
  const lifecycleReference = {
    get: async () => ({ exists: lifecycle !== undefined, data: () => lifecycle }),
  };
  const firestore = {
    collection: (name: string) => {
      assert.equal(name, "accountLifecycles");
      return { doc: () => lifecycleReference };
    },
    runTransaction: async (operation: (transaction: unknown) => Promise<void>) => operation({
      get: async () => ({ exists: lifecycle !== undefined, data: () => lifecycle }),
      create: (_reference: unknown, value: unknown) => { creates += 1; lifecycle = value; },
    }),
  };
  const adapter = new FirebaseAccountDeletionAdapter(firestore as never, {} as never);
  await adapter.assertWritable("user-1");
  await adapter.writeDeletionIntent("user-1", "request_123456789", "2026-08-01T11:59:00.000Z");
  assert.equal(creates, 1);
  await assert.rejects(adapter.assertWritable("user-1"), /account_tombstoned/u);
  await adapter.writeDeletionIntent("user-1", "request_123456789", "2026-08-01T11:59:00.000Z");
  assert.equal(creates, 1);
  await assert.rejects(
    adapter.writeDeletionIntent("user-1", "request_987654321", "2026-08-01T11:59:00.000Z"),
    /account_lifecycle_conflict/u,
  );
});

test("Firebase deletion adapter recursively deletes and verifies the sole account tree", async () => {
  const accountPath = "accounts/user-1";
  const accountTree = new Set([
    accountPath,
    `${accountPath}/generations/${"a".repeat(64)}/records/${"b".repeat(64)}`,
    `${accountPath}/adoptionOperations/current`,
    `${accountPath}/adoptionOperations/current/localRecords/0000000000000000`,
    `${accountPath}/adoptionOperations/current/conflicts/0000000000000000`,
  ]);
  const accountReference = {
    path: accountPath,
    get: async () => ({ exists: accountTree.has(accountPath) }),
    listCollections: async () => [...accountTree].some((path) => path.startsWith(`${accountPath}/`)) ? [{}] : [],
  };
  let recursiveTarget: unknown;
  const firestore = {
    collection: (name: string) => {
      assert.equal(name, "accounts");
      return { doc: (uid: string) => { assert.equal(uid, "user-1"); return accountReference; } };
    },
    recursiveDelete: async (target: unknown) => {
      recursiveTarget = target;
      for (const path of accountTree) {
        if (path === accountPath || path.startsWith(`${accountPath}/`)) accountTree.delete(path);
      }
    },
  };
  const adapter = new FirebaseAccountDeletionAdapter(firestore as never, {} as never);
  await adapter.deleteRemoteData("user-1");
  assert.equal(recursiveTarget, accountReference);
  assert.deepEqual([...accountTree], []);

  const orphaned = new FirebaseAccountDeletionAdapter({
    ...firestore,
    collection: () => ({ doc: () => ({ get: async () => ({ exists: false }), listCollections: async () => [{}] }) }),
  } as never, {} as never);
  await assert.rejects(orphaned.deleteRemoteData("user-1"), /remote_account_deletion_not_verified/u);
});

test("Firebase deletion adapter leaves an identical proof unchanged and rejects a proof collision", async () => {
  const proof: DeletionProof = {
    completedAt: completedAt.toISOString(),
    irreversibleAccountIdHash: "c6c289e49e9c05b2145860387b73bcb18df43fb09a1e4a4a9713c76c88bb541b",
    requestId: "request_123456789",
    requestedAt: "2026-08-01T11:59:00.000Z",
    resultCode: "account_deleted",
  };
  let existing: DeletionProof = proof;
  let creates = 0;
  const firestore = {
    collection: () => ({ doc: () => ({}) }),
    runTransaction: async (operation: (transaction: unknown) => Promise<void>) => operation({
      create: () => { creates += 1; },
      get: async () => ({ data: () => existing, exists: true }),
    }),
  };
  const adapter = new FirebaseAccountDeletionAdapter(firestore as never, {} as never);
  await adapter.recordDeletionProof(proof);
  assert.equal(creates, 0);
  existing = { ...proof, completedAt: "2026-08-01T12:00:00.001Z" };
  await assert.rejects(adapter.recordDeletionProof(proof), /deletion_proof_collision/u);
  assert.equal(creates, 0);
});
