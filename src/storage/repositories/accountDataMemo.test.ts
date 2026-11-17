import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { MemoryKeyValueStorage, getKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../infrastructure/storage/mmkvClient";
import type { PatternlyApiClient, ProgressMutationDto, ProgressRecordDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { retryAccountDataSync } from "../../application/account/accountDataService";
import { productionLearningDataAdmissionContext } from "../../application/tracks/trackAdmissionContext";
import { productionTrackAdmissionContext } from "../../application/tracks/trackAdmissionContext";
import { createResolvedContentRef, type ReviewQueueEntry } from "../../domain";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "./guestInstallationRepository";
import { saveActiveTrackId } from "./activeTrackRepository";
import { addReviewQueueItems } from "./reviewQueueRepository";
import { STORAGE_KEYS } from "../keys";
import {
  ensureAccountOutboxFromLocalDataset,
  getAccountSyncState,
  readAccountDataPerfCountersForTests,
  resetAccountDataPerfCountersForTests,
  saveAccountSyncState,
  invalidateAccountSyncStateMemo,
} from "./accountDataRepository";
import { AccountDataFailure } from "../errors";

const ACCOUNT_ID = "55555555-5555-4555-8555-555555555555";
const INSTALLATION_ID = "66666666-6666-4666-8666-666666666666";
const TRACK_ID = "coding-interview-dsa-problem-solving" as const;
const context = productionLearningDataAdmissionContext;

beforeEach(async () => {
  invalidateAccountSyncStateMemo();
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await provisionGuestInstallation({ async create() { return { installationId: INSTALLATION_ID, localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(context), accountId: ACCOUNT_ID, status: "synced" }, context);
});

function reviews(count: number): ReviewQueueEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `review-memo-${index}`,
    trackId: TRACK_ID,
    sourceAttemptId: `attempt-memo-${index}`,
    sourceSessionId: "memo-session",
    sourceItem: createResolvedContentRef({ trackId: TRACK_ID, questionId: `memo-item-${index}`, contentVersion: "memo-fixture-v1", artifactSha256: "a".repeat(64) }),
    taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: "memo-unit", role: "primary" }],
    createdAt: "2026-10-01T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    reasons: ["incorrect"],
    persistent: true,
    dueAt: "2026-10-08T12:00:00.000Z",
    policyVersion: "bizq04-v1",
    stage: "repair24",
    status: "active",
  }) as ReviewQueueEntry);
}

function applied(mutations: readonly ProgressMutationDto[]): ProgressRecordDto[] {
  return mutations.map((mutation) => ({
    kind: mutation.recordType === "training_attempt" || mutation.recordType === "review_queue_entry" ? "item" : "node",
    recordType: mutation.recordType,
    trackId: mutation.trackId,
    targetId: mutation.targetId,
    version: (mutation.expectedVersion ?? 0) + 1,
    fingerprint: mutation.fingerprint,
    state: mutation.state,
    lastMutationId: mutation.mutationId,
    updatedAt: "2026-10-08T10:00:00.000Z",
  }));
}

/** Minimal sync-only client: every upload is applied and read back by GET. */
function syncApi(): PatternlyApiClient {
  let records: ProgressRecordDto[] = [];
  const unused = async () => { throw new Error("unused"); };
  return new Proxy({
    availability: "available",
    syncProgress: async (input: { mutations: readonly ProgressMutationDto[]; expectedAccountRevision: number }) => {
      const batch = applied(input.mutations);
      records = [...records.filter((record) => !batch.some((next) => next.recordType === record.recordType && next.targetId === record.targetId && next.trackId === record.trackId)), ...batch];
      return { accountRevision: input.expectedAccountRevision + batch.length, applied: batch, duplicates: [], conflicts: [] };
    },
    getProgress: async () => ({ accountRevision: records.length, records }),
    getProgressSnapshot: async () => ({ kind: "full", progress: { accountRevision: records.length, records }, snapshotToken: null }),
  } as Record<string, unknown>, { get: (target, key) => (key in target ? target[key as string] : unused) }) as unknown as PatternlyApiClient;
}

async function seedLocalDataset(reviewCount: number): Promise<void> {
  await saveActiveTrackId(TRACK_ID);
  await addReviewQueueItems(reviews(reviewCount), productionTrackAdmissionContext);
}

async function fingerprintsForOneSync(reviewCount: number): Promise<Readonly<{ fingerprints: number; validations: number; status: string }>> {
  await seedLocalDataset(reviewCount);
  resetAccountDataPerfCountersForTests();
  const session = await retryAccountDataSync(syncApi(), ACCOUNT_ID);
  const counters = readAccountDataPerfCountersForTests();
  return { fingerprints: counters.fingerprintComputations, validations: counters.fullStateValidations, status: session.status };
}

/** One full sync of the 31-record fixture before the memo existed (recorded from the removed path). */
const PRE_MEMO_FINGERPRINTS_PER_SYNC = 7006;

test("one full sync computes record fingerprints at least 4x less often than before the memo", async () => {
  const after = await fingerprintsForOneSync(30);
  assert.equal(after.status, "synced");
  console.log(`[T1.2] fingerprints per sync (31 records): ${after.fingerprints} (before the memo: ${PRE_MEMO_FINGERPRINTS_PER_SYNC}); full validations ${after.validations}`);
  assert.ok(after.fingerprints * 4 <= PRE_MEMO_FINGERPRINTS_PER_SYNC, `expected >=4x fewer fingerprints than ${PRE_MEMO_FINGERPRINTS_PER_SYNC}, got ${after.fingerprints}`);
});

test("the memo returns the same sync state as a fresh validated read", async () => {
  await seedLocalDataset(5);
  const pending = await ensureAccountOutboxFromLocalDataset(context);
  const memoized = await getAccountSyncState(context);
  invalidateAccountSyncStateMemo();
  const fresh = await getAccountSyncState(context);
  assert.deepEqual(memoized, fresh);
  assert.deepEqual(memoized.outbox, pending.outbox);
  assert.ok(Object.isFrozen(memoized.outbox[0]!.state));
});

test("repeated reads of unchanged bytes are memo hits without revalidation", async () => {
  await seedLocalDataset(3);
  await ensureAccountOutboxFromLocalDataset(context);
  resetAccountDataPerfCountersForTests();
  const first = await getAccountSyncState(context);
  const second = await getAccountSyncState(context);
  const counters = readAccountDataPerfCountersForTests();
  assert.equal(first, second);
  assert.equal(counters.fullStateValidations, 0);
  assert.equal(counters.fingerprintComputations, 0);
  assert.equal(counters.stateMemoHits, 2);
});

function corruptOutboxFingerprint(raw: string): string {
  const envelope = JSON.parse(raw) as { payload: { outbox: { fingerprint: string }[] } };
  envelope.payload.outbox[0]!.fingerprint = "0".repeat(64);
  return JSON.stringify(envelope);
}

test("a corrupt stored record is detected on cold start (empty memo)", async () => {
  await seedLocalDataset(2);
  await ensureAccountOutboxFromLocalDataset(context);
  const storage = getKeyValueStorage();
  storage.setString(STORAGE_KEYS.ACCOUNT_SYNC, corruptOutboxFingerprint(storage.getString(STORAGE_KEYS.ACCOUNT_SYNC)!));
  invalidateAccountSyncStateMemo(); // cold start: the in-memory memo is gone
  await assert.rejects(getAccountSyncState(context), (error: unknown) => error instanceof AccountDataFailure && error.message.includes("account_sync_state_invalid"));
});

test("bytes changed behind the memo (same revision) force full revalidation", async () => {
  await seedLocalDataset(2);
  await ensureAccountOutboxFromLocalDataset(context);
  await getAccountSyncState(context);
  const storage = getKeyValueStorage();
  storage.setString(STORAGE_KEYS.ACCOUNT_SYNC, corruptOutboxFingerprint(storage.getString(STORAGE_KEYS.ACCOUNT_SYNC)!));
  await assert.rejects(getAccountSyncState(context), (error: unknown) => error instanceof AccountDataFailure);
});

test("a profile lease change invalidates the memo", async () => {
  await seedLocalDataset(2);
  await ensureAccountOutboxFromLocalDataset(context);
  setActiveProfileLeaseForTests({ id: "profile-a", kind: "account", accountId: ACCOUNT_ID });
  await getAccountSyncState(context);
  resetAccountDataPerfCountersForTests();
  await getAccountSyncState(context);
  assert.equal(readAccountDataPerfCountersForTests().fullStateValidations, 0);

  setActiveProfileLeaseForTests({ id: "profile-b", kind: "account", accountId: ACCOUNT_ID });
  await getAccountSyncState(context);
  assert.equal(readAccountDataPerfCountersForTests().fullStateValidations, 1);
  setActiveProfileLeaseForTests(null);
});

test("another storage owner or admission context never reuses the memo", async () => {
  await seedLocalDataset(1);
  await ensureAccountOutboxFromLocalDataset(context);
  const raw = getKeyValueStorage().getString(STORAGE_KEYS.ACCOUNT_SYNC)!;
  await getAccountSyncState(context);

  resetAccountDataPerfCountersForTests();
  const otherContext = { ...context, trackAdmission: { isAdmittedTrackId: () => false } };
  await assert.rejects(getAccountSyncState(otherContext), (error: unknown) => error instanceof AccountDataFailure);
  assert.equal(readAccountDataPerfCountersForTests().fullStateValidations, 1);

  const other = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(other);
  other.setString(STORAGE_KEYS.ACCOUNT_SYNC, raw);
  resetAccountDataPerfCountersForTests();
  await getAccountSyncState(context);
  assert.equal(readAccountDataPerfCountersForTests().fullStateValidations, 1);
});
