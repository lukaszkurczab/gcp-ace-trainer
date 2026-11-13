import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { createTrainingSession } from "../../domain";
import { canonicalFingerprintPayload, CANONICAL_SERIALIZER_VERSION, referenceCanonicalJsonV1, referenceCanonicalSerialize } from "../../domain/identity/canonicalSerialization";
import { referenceRecordFingerprintPayload, type RecordFingerprintInput } from "../../domain/identity/recordFingerprint";
import { referenceSha256Utf8 } from "../../domain/identity/sha256";
import { installNativeCore, resetNativeCoreForTests, type NativeCore } from "../../infrastructure/identity/installNativeCore";
import { getTrainingAttempts, saveTrainingSession } from "../../storage";
import { STORAGE_KEYS } from "../../storage/keys";
import {
  assertValidMutationJournal, createMutationPlanFingerprint, getActiveMutationJournal, persistMutationJournal, readMutationJournalCacheCountersForTests,
  resetMutationJournalCacheCountersForTests, setMutationJournalCacheEnabledForTests, updateMutationJournalPhase, type MutationJournalPlan, type MutationJournalRecord,
} from "../../storage/repositories/mutationJournalRepository";
import { productionLearningDataAdmissionContext as context, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import type { LearningDataAdmissionContext } from "../../domain/tracks/trackAdmissionContext";
import { buildMutationJournal, recoverPendingMutation } from "./";
import { commitMutation } from "./commitMutation";

// T2.1: the journal is validated once per exact stored bytes and owner; any
// other bytes, owner or admission take the full validator again (D5).

let storage: MemoryKeyValueStorage;
beforeEach(() => { storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setMutationJournalCacheEnabledForTests(true); resetMutationJournalCacheCountersForTests(); });
afterEach(() => { setMutationJournalCacheEnabledForTests(null); resetNativeCoreForTests(); });

const trackId = "coding-interview-dsa-problem-solving";
const artifactSha256 = "a".repeat(64);
const session = createTrainingSession({ id: "s", trackId, modeId: "m", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId, questionId: "i", contentVersion: "v", artifactSha256 } }], optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v", artifactSha256, status: "active" as const, startedAt: "2026-01-01T00:00:00.000Z" });
const attempt = { id: "a", sessionId: "s", trackId, modeId: "m", occurrenceId: "occurrence-1", item: session.itemOrder[0]!.item, response: { ids: ["x"] }, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: session.itemOrder[0]!.item, taxonomyOrSkillRefs: [] }, answeredAt: session.startedAt, committedAt: session.startedAt };
const build = () => buildMutationJournal({ operation: "submit_training_outcome", sessionId: "s", trackId, identity: attempt.response, writes: [{ kind: "put_attempt", record: attempt }, { kind: "put_session", record: session }], createdAt: session.startedAt });

test("a commit validates its journal a fixed number of times and reuses the frozen proof for every later phase", async () => {
  await saveTrainingSession(session, productionTrackAdmissionContext);
  const record = await build();
  resetMutationJournalCacheCountersForTests();
  await commitMutation(record);
  const counters = readMutationJournalCacheCountersForTests();
  // caller object before the write + the exact stored bytes once; phases, verification and clear reuse it.
  assert.ok(counters.fullValidations <= 2, `full validations ${counters.fullValidations}`);
  assert.ok(counters.memoHits >= 6, `memo hits ${counters.memoHits}`);
  assert.equal(getActiveMutationJournal(context), null);
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);
});

test("persist returns the frozen copy of the exact verified bytes and later reads hit only for those bytes", async () => {
  const record = await build();
  const persisted = await persistMutationJournal(record, context);
  assert.notEqual(persisted, record);
  assert.ok(Object.isFrozen(persisted) && Object.isFrozen(persisted.writes[0]));
  assert.deepEqual(JSON.parse(JSON.stringify(persisted)), JSON.parse(JSON.stringify(record)));
  resetMutationJournalCacheCountersForTests();
  assert.equal(getActiveMutationJournal(context), persisted);
  assert.equal(readMutationJournalCacheCountersForTests().activeReadHits, 1);

  // Same logical record re-written by another owner (new bytes, same content) is a miss and is fully validated.
  const raw = storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL)!;
  const reordered = JSON.stringify({ ...JSON.parse(raw) });
  storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, `${reordered} `);
  const reread = getActiveMutationJournal(context);
  assert.notEqual(reread, persisted);
  assert.equal(readMutationJournalCacheCountersForTests().activeReadMisses, 1);
});

test("tampered bytes behind a cached journal are rejected exactly as on a cold read", async () => {
  const persisted = await persistMutationJournal(await build(), context);
  assert.equal(getActiveMutationJournal(context), persisted);
  const envelope = JSON.parse(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL)!);
  envelope.payload.writes[0].record.result.earnedPoints = 0;
  storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, JSON.stringify(envelope));
  assert.throws(() => getActiveMutationJournal(context), /unsupported/u);
  setMutationJournalCacheEnabledForTests(false);
  assert.throws(() => getActiveMutationJournal(context), /unsupported/u);
});

test("identical bytes in another storage owner are not served from the memo", async () => {
  const persisted = await persistMutationJournal(await build(), context);
  const raw = storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL)!;
  const other = new MemoryKeyValueStorage();
  other.setString(STORAGE_KEYS.ACTIVE_JOURNAL, raw);
  installKeyValueStorageForTests(other);
  resetMutationJournalCacheCountersForTests();
  const read = getActiveMutationJournal(context);
  assert.notEqual(read, persisted);
  assert.equal(readMutationJournalCacheCountersForTests().activeReadMisses, 1);
});

test("a proof never outlives track admission and never covers a caller's mutable object", async () => {
  const persisted = await persistMutationJournal(await build(), context);
  let admitted = true;
  const toggled: LearningDataAdmissionContext = { trackAdmission: { isAdmittedTrackId: (id) => admitted && context.trackAdmission.isAdmittedTrackId(id) }, goalPolicyResolver: context.goalPolicyResolver };
  assertValidMutationJournal(persisted, toggled);
  admitted = false;
  assert.throws(() => assertValidMutationJournal(persisted, toggled), /unsupported/u);

  const mutable = await build();
  assertValidMutationJournal(mutable, context);
  resetMutationJournalCacheCountersForTests();
  assertValidMutationJournal(mutable, context);
  assert.equal(readMutationJournalCacheCountersForTests().memoHits, 0, "unfrozen caller objects are always revalidated");
  (mutable as { planFingerprint: string }).planFingerprint = "0".repeat(64);
  assert.throws(() => assertValidMutationJournal(mutable, context), /unsupported/u);
});

test("phase updates carry the proof and recovery from a cold memo revalidates the stored bytes", async () => {
  await saveTrainingSession(session, productionTrackAdmissionContext);
  const persisted = await persistMutationJournal(await build(), context);
  const materialized = await updateMutationJournalPhase(persisted, "materialized", context);
  assert.equal(getActiveMutationJournal(context), materialized);
  // A new launch: same bytes, empty memo (cache disabled then re-enabled clears it).
  setMutationJournalCacheEnabledForTests(true);
  resetMutationJournalCacheCountersForTests();
  const cold = getActiveMutationJournal(context);
  assert.ok(cold && cold !== materialized && cold.status === "materialized");
  assert.ok(readMutationJournalCacheCountersForTests().fullValidations >= 1);
});

test("interrupted commits recover to the same durable state with the cache on and off", async () => {
  const snapshots: string[] = [];
  for (const enabled of [true, false]) {
    for (const stopAfter of ["journal_durable", "materialized", "verified_pending_clear"] as const) {
      storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setMutationJournalCacheEnabledForTests(enabled);
      await saveTrainingSession(session, productionTrackAdmissionContext);
      const persisted = await persistMutationJournal(await build(), context);
      if (stopAfter !== "journal_durable") {
        const { materializeMutation } = await import("./mutationMaterializer");
        await materializeMutation(persisted);
        let current: MutationJournalRecord = await updateMutationJournalPhase(persisted, "materialized", context);
        if (stopAfter === "verified_pending_clear") current = await updateMutationJournalPhase(current, "verified_pending_clear", context);
      }
      // Process death: the memo is gone; the next launch recovers from bytes alone.
      setMutationJournalCacheEnabledForTests(enabled);
      await recoverPendingMutation();
      assert.equal(getActiveMutationJournal(context), null);
      const keys = storage.getAllKeys().filter((key) => !key.includes("account")).sort();
      snapshots.push(JSON.stringify(keys.map((key) => [key, storage.getString(key)])));
    }
  }
  assert.equal(new Set(snapshots).size, 1, "every interruption point and cache setting ends in identical storage");
});

function referenceCore(overrides: Partial<NativeCore> = {}): NativeCore {
  const serialize = (profile: number, json: string): string | undefined => {
    const value = JSON.parse(json) as unknown;
    try {
      if (profile === 0) return referenceCanonicalSerialize(value);
      if (profile === 1) return referenceCanonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value });
      if (profile === 2) return referenceRecordFingerprintPayload(value as RecordFingerprintInput);
      return referenceCanonicalJsonV1(value);
    } catch { return undefined; }
  };
  return { sha256: referenceSha256Utf8, serialize, fingerprint: (profile, json) => { const payload = serialize(profile, json); return payload === undefined ? undefined : referenceSha256Utf8(payload); }, validateEnvelope: () => "ok", lastError: () => "", setNfcEnabled: () => undefined, ...overrides };
}

test("the plan fingerprint from B0 on the plan's own JSON equals the reference clone path", async () => {
  const record = await build();
  const { journalId: _id, planFingerprint, ...plan } = record;
  const withUndefined = { ...plan, ignored: undefined } as unknown as MutationJournalPlan;
  const reference = referenceSha256Utf8(canonicalFingerprintPayload(JSON.parse(JSON.stringify(plan))));
  assert.equal(planFingerprint, reference);
  let nativeCalls = 0;
  installNativeCore(() => referenceCore({ fingerprint: (profile, json) => { nativeCalls += 1; return referenceCore().fingerprint(profile, json); } }));
  nativeCalls = 0; // install probes
  assert.equal(createMutationPlanFingerprint(plan as MutationJournalPlan), reference);
  assert.equal(createMutationPlanFingerprint(withUndefined), reference);
  assert.equal(nativeCalls, 2);
  resetNativeCoreForTests();
  installNativeCore(() => referenceCore({ fingerprint: () => undefined }));
  assert.equal(createMutationPlanFingerprint(plan as MutationJournalPlan), reference, "a native refusal keeps the reference result");
  setMutationJournalCacheEnabledForTests(false);
  nativeCalls = 0;
  assert.equal(createMutationPlanFingerprint(plan as MutationJournalPlan), reference);
});

test("a crash at every storage write of a commit recovers to the uninterrupted state, warm or cold, cache on or off", async () => {
  const run = async (enabled: boolean, failAt: number | null, coldRestart: boolean): Promise<string> => {
    storage = new MemoryKeyValueStorage(); installKeyValueStorageForTests(storage); setMutationJournalCacheEnabledForTests(enabled);
    await saveTrainingSession(session, productionTrackAdmissionContext);
    const record = await build();
    storage.resetCounters();
    if (failAt !== null) storage.setFailurePlan({ kind: "fail_on_write_number", writeNumber: failAt });
    let failed = false;
    try { await commitMutation(record); } catch { failed = true; }
    storage.setFailurePlan(null);
    if (coldRestart) {
      // A new process: same bytes, a new storage owner, so no memo survives.
      const next = new MemoryKeyValueStorage();
      for (const key of storage.getAllKeys()) next.setString(key, storage.getString(key)!);
      storage = next; installKeyValueStorageForTests(next); setMutationJournalCacheEnabledForTests(enabled);
    }
    if (failed) {
      await recoverPendingMutation();
      if ((await getTrainingAttempts(productionTrackAdmissionContext)).value.length === 0) await commitMutation(await build());
    }
    assert.equal(getActiveMutationJournal(context), null);
    const keys = storage.getAllKeys().filter((key) => !key.includes("account")).sort();
    return JSON.stringify(keys.map((key) => [key, storage.getString(key)]));
  };
  const reference = await run(false, null, false);
  storage.resetCounters();
  await run(true, null, false);
  const writes = storage.writes;
  assert.ok(writes >= 5, `writes ${writes}`);
  for (const enabled of [true, false]) {
    for (const coldRestart of [true, false]) {
      for (let failAt = 1; failAt <= writes; failAt += 1) {
        assert.equal(await run(enabled, failAt, coldRestart), reference, `cache=${enabled} cold=${coldRestart} failAt=${failAt}`);
      }
    }
  }
});
