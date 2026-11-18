import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { installKeyValueStorageForTests, setActiveProfileLeaseForTests, type KeyValueStorage, type MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { attempt, installMemoryStorage, session } from "../../testing/journalTestSupport";
import { productionTrackAdmissionContext as admission } from "../../application/tracks/trackAdmissionContext";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalNamespaceKeys, readCanonicalNamespaceKeysObserved } from "./canonicalRecordCodec";
import { assertContentIdentityRecordIntegrity } from "./contentIdentityUnavailableRepository";
import { saveTrainingSession } from "./trainingSessionRepository";
import { addTrainingAttempt } from "./trainingAttemptRepository";
import {
  assertTrainingEvidenceIntegrity, assertTrainingEvidenceIntegrityForCommand, clearTrainingEvidenceMemo, readTrainingAttemptsStrict, readTrainingEvidenceSnapshotStrict,
  readTrainingEvidenceMemoCountersForTests, resetTrainingEvidenceMemoCountersForTests,
} from "./trainingEvidenceIntegrityRepository";

// J1 (D5a, owner decision D17a): on a store that reports every write, command-path
// strict reads trust keys not written since their validated read and re-read only
// written keys; the full gate (opening storage, recovery, reset, export) reads every
// byte. A store that does not report writes keeps T2.1: every byte on every read.

let storage: MemoryKeyValueStorage;
beforeEach(async () => {
  storage = installMemoryStorage();
  clearTrainingEvidenceMemo();
  await saveTrainingSession(session("completed", "session-1"), admission);
  await addTrainingAttempt(attempt("attempt-1", "session-1"), admission);
  await addTrainingAttempt(attempt("attempt-2", "session-1"), admission);
  resetTrainingEvidenceMemoCountersForTests();
});

const counters = () => readTrainingEvidenceMemoCountersForTests();

test("a repeated strict read reuses identical bytes and returns the same frozen values", () => {
  const first = readTrainingEvidenceSnapshotStrict(admission);
  const misses = counters().misses;
  assert.ok(misses >= 3);
  const second = readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(counters().misses, misses, "no record was parsed again");
  assert.ok(counters().familyHits >= 3, "J1: every unchanged family is reused as a whole");
  assert.equal(second.attempts[0], first.attempts[0]);
  assert.ok(Object.isFrozen(second.attempts[0]) && Object.isFrozen(second.attempts[0]!.item));
  assert.throws(() => { (second.attempts[0] as { id: string }).id = "x"; }, TypeError);
});

test("corrupted record bytes behind a warm memo are detected by every strict read", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  const key = STORAGE_KEYS.trainingAttempt("attempt-2");
  storage.setString(key, `${storage.getString(key)!.slice(0, -5)}`);
  assert.throws(() => readTrainingEvidenceSnapshotStrict(admission), /attempt-2|Corrupt|corrupt/u);
  assert.throws(() => assertTrainingEvidenceIntegrityForCommand(admission));
  assert.throws(() => readTrainingAttemptsStrict(admission));
  assert.throws(() => assertTrainingEvidenceIntegrity(admission));
});

test("changed but well-formed bytes are re-parsed and re-guarded, never served from the memo", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  const key = STORAGE_KEYS.trainingAttempt("attempt-1");
  const envelope = JSON.parse(storage.getString(key)!);
  envelope.payload.result = { kind: "bogus" };
  storage.setString(key, JSON.stringify(envelope));
  assert.throws(() => readTrainingEvidenceSnapshotStrict(admission), /unsupported/u);
  envelope.payload.result = { kind: "correct", earnedPoints: 1, maxPoints: 1 };
  storage.setString(key, JSON.stringify(envelope));
  const reread = readTrainingEvidenceSnapshotStrict(admission).attempts.find((value) => value.id === "attempt-1");
  assert.equal(reread?.result.kind, "correct");
});

test("index and key rules run on every read even when every record is a memo hit", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  // An orphan physical record without an index entry, with bytes the memo already accepted.
  const raw = storage.getString(STORAGE_KEYS.trainingAttempt("attempt-2"))!;
  storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 9, payload: ["attempt-1"] }));
  assert.equal(storage.getString(STORAGE_KEYS.trainingAttempt("attempt-2")), raw);
  assert.throws(() => readTrainingEvidenceSnapshotStrict(admission), (error: Error) => error.name === "CanonicalEvidenceIntegrityError");
});

test("the full integrity gate (opening-storage, recovery) reads every byte and rebuilds the index", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  resetTrainingEvidenceMemoCountersForTests();
  assertTrainingEvidenceIntegrity(admission);
  assert.equal(counters().hits, 0, "no validated byte is trusted by the full gate");
  assert.equal(counters().clears, 1);
  assert.ok(counters().reads >= 3);
  resetTrainingEvidenceMemoCountersForTests();
  readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(counters().reads, 0, "the next command read trusts the bytes the full gate just validated");
});

test("J1: unwritten keys are not read again; a reported write re-reads only that key", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  storage.resetCounters();
  resetTrainingEvidenceMemoCountersForTests();
  readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(storage.operations.filter((operation) => operation.kind === "read").length, 0);
  assert.ok(counters().familyHits >= 3);
  const key = STORAGE_KEYS.trainingAttempt("attempt-1");
  storage.setString(key, storage.getString(key)!);
  storage.resetCounters();
  readTrainingEvidenceSnapshotStrict(admission);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "read").map((operation) => operation.key), [key]);
});

test("J1: a new record key is found through the written key alone, and an orphan still fails", async () => {
  readTrainingEvidenceSnapshotStrict(admission);
  await addTrainingAttempt(attempt("attempt-3", "session-1"), admission);
  storage.resetCounters();
  assert.equal(readTrainingEvidenceSnapshotStrict(admission).attempts.length, 3);
  assert.equal(storage.operations.filter((operation) => operation.kind === "read" && !operation.key.includes("attempt")).length, 0);
  const orphan = STORAGE_KEYS.trainingAttempt("attempt-orphan");
  const envelope = JSON.parse(storage.getString(STORAGE_KEYS.trainingAttempt("attempt-3"))!);
  storage.setString(orphan, JSON.stringify({ ...envelope, payload: { ...envelope.payload, id: "attempt-orphan" } }));
  assert.throws(() => readTrainingEvidenceSnapshotStrict(admission), (error: Error) => error.name === "CanonicalEvidenceIntegrityError");
});

test("J1 trust model: bytes changed by an unreported writer are caught by the full gate, not by command reads", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  const key = STORAGE_KEYS.trainingAttempt("attempt-2");
  const values = Reflect.get(storage, "values") as Map<string, string>;
  values.set(key, `${values.get(key)!.slice(0, -5)}`);
  assert.doesNotThrow(() => readTrainingEvidenceSnapshotStrict(admission), "command reads trust the store epoch (D5a)");
  assert.throws(() => assertTrainingEvidenceIntegrity(admission));
});

test("a store that does not report its writes reads every byte on every strict read (T2.1 fallback)", () => {
  const values = new Map<string, string>(storage.snapshot());
  let reads = 0;
  const unreported: KeyValueStorage = {
    getString: (key) => { reads += 1; return values.get(key); }, setString: (key, value) => { values.set(key, value); }, remove: (key) => { values.delete(key); },
    contains: (key) => values.has(key), getAllKeys: () => [...values.keys()],
  };
  installKeyValueStorageForTests(unreported);
  clearTrainingEvidenceMemo();
  readTrainingEvidenceSnapshotStrict(admission);
  const firstReads = reads;
  assert.ok(firstReads >= 4);
  readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(reads, firstReads * 2, "no key is trusted without a read");
  const key = STORAGE_KEYS.trainingAttempt("attempt-2");
  values.set(key, `${values.get(key)!.slice(0, -5)}`);
  assert.throws(() => readTrainingEvidenceSnapshotStrict(admission));
  clearTrainingEvidenceMemo();
});

test("a profile, actor or lease change drops the memo", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  setActiveProfileLeaseForTests({ id: "guest-test-profile", kind: "guest", accountId: null }); // new generation
  resetTrainingEvidenceMemoCountersForTests();
  readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(counters().hits, 0);
  setActiveProfileLeaseForTests({ id: "guest-test-profile", kind: "account", accountId: "acc-1" });
  resetTrainingEvidenceMemoCountersForTests();
  readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(counters().hits, 0);
  clearTrainingEvidenceMemo();
});

test("revoked track admission is enforced on a memo hit", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  let admitted = true;
  const toggled = { isAdmittedTrackId: (id: string) => admitted && admission.isAdmittedTrackId(id) };
  readTrainingEvidenceSnapshotStrict(toggled);
  readTrainingEvidenceSnapshotStrict(toggled);
  admitted = false;
  assert.throws(() => readTrainingEvidenceSnapshotStrict(toggled));
});


test("J1b: a family that only gained new indexed records is extended and equals a full read", async () => {
  readTrainingEvidenceSnapshotStrict(admission);
  await addTrainingAttempt(attempt("attempt-3", "session-1"), admission);
  await addTrainingAttempt(attempt("attempt-4", "session-1"), admission);
  resetTrainingEvidenceMemoCountersForTests();
  storage.resetCounters();
  const extended = readTrainingEvidenceSnapshotStrict(admission).attempts.map((value) => value.id);
  assert.equal(counters().familyExtensions, 1);
  // addTrainingAttempt reads the family before it writes, so attempt-3 was already folded in; only attempt-4 is read here.
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "read" && operation.key.startsWith(STORAGE_KEYS.trainingAttempt(""))).map((operation) => operation.key), [STORAGE_KEYS.trainingAttempt("attempt-4")]);
  clearTrainingEvidenceMemo();
  assert.deepEqual(extended, readTrainingEvidenceSnapshotStrict(admission).attempts.map((value) => value.id));
});

test("J1b: a rewritten existing record or a removed index id takes the full read", async () => {
  readTrainingEvidenceSnapshotStrict(admission);
  const key = STORAGE_KEYS.trainingAttempt("attempt-1");
  const envelope = JSON.parse(storage.getString(key)!);
  storage.setString(key, JSON.stringify({ ...envelope, revision: envelope.revision + 1 }));
  resetTrainingEvidenceMemoCountersForTests();
  readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(counters().familyExtensions, 0);
  storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 99, payload: ["attempt-1"] }));
  assert.throws(() => readTrainingEvidenceSnapshotStrict(admission), (error: Error) => error.name === "CanonicalEvidenceIntegrityError", "attempt-2 is now an unindexed record");
});

test("J1b: the observed namespace key list follows reported writes and matches a full listing", () => {
  const before = readCanonicalNamespaceKeysObserved();
  assert.deepEqual(before, readCanonicalNamespaceKeys());
  storage.setString(STORAGE_KEYS.unavailableActive("orphan"), "{}");
  storage.resetCounters();
  const after = readCanonicalNamespaceKeysObserved();
  assert.ok(after.includes(STORAGE_KEYS.unavailableActive("orphan")));
  assert.deepEqual(after, readCanonicalNamespaceKeys());
  assert.throws(() => assertContentIdentityRecordIntegrity({ observedKeys: true }), (error: Error) => error.name === "CanonicalEvidenceIntegrityError");
  storage.remove(STORAGE_KEYS.unavailableActive("orphan"));
  assert.deepEqual(readCanonicalNamespaceKeysObserved(), readCanonicalNamespaceKeys());
});
