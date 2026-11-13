import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import { setActiveProfileLeaseForTests, type MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { attempt, installMemoryStorage, session } from "../../testing/journalTestSupport";
import { productionTrackAdmissionContext as admission } from "../../application/tracks/trackAdmissionContext";
import { STORAGE_KEYS } from "../keys";
import { saveTrainingSession } from "./trainingSessionRepository";
import { addTrainingAttempt } from "./trainingAttemptRepository";
import {
  assertTrainingEvidenceIntegrity, assertTrainingEvidenceIntegrityForCommand, clearTrainingEvidenceMemo, readTrainingAttemptsStrict, readTrainingEvidenceSnapshotStrict,
  readTrainingEvidenceMemoCountersForTests, resetTrainingEvidenceMemoCountersForTests, setTrainingEvidenceMemoEnabledForTests,
} from "./trainingEvidenceIntegrityRepository";

// T2.1 (D5, owner-approved): command-path strict reads reuse the parse of identical
// stored bytes only; every byte is still read and every index/key rule still runs.

let storage: MemoryKeyValueStorage;
beforeEach(async () => {
  storage = installMemoryStorage();
  setTrainingEvidenceMemoEnabledForTests(true);
  await saveTrainingSession(session("completed", "session-1"), admission);
  await addTrainingAttempt(attempt("attempt-1", "session-1"), admission);
  await addTrainingAttempt(attempt("attempt-2", "session-1"), admission);
  resetTrainingEvidenceMemoCountersForTests();
});
afterEach(() => setTrainingEvidenceMemoEnabledForTests(null));

const counters = () => readTrainingEvidenceMemoCountersForTests();

test("a repeated strict read reuses identical bytes and returns the same frozen values", () => {
  const first = readTrainingEvidenceSnapshotStrict(admission);
  const misses = counters().misses;
  assert.ok(misses >= 3);
  const second = readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(counters().misses, misses, "no record was parsed again");
  assert.ok(counters().hits >= misses);
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

test("the full integrity gate (opening-storage, recovery) never uses the memo and clears it", () => {
  readTrainingEvidenceSnapshotStrict(admission);
  resetTrainingEvidenceMemoCountersForTests();
  assertTrainingEvidenceIntegrity(admission);
  assert.equal(counters().hits, 0);
  assert.equal(counters().clears, 1);
  readTrainingEvidenceSnapshotStrict(admission);
  assert.equal(counters().hits, 0, "the next command read starts from bytes alone");
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

test("the kill-switch keeps the reference read path", () => {
  setTrainingEvidenceMemoEnabledForTests(false);
  resetTrainingEvidenceMemoCountersForTests();
  readTrainingEvidenceSnapshotStrict(admission);
  readTrainingEvidenceSnapshotStrict(admission);
  assert.deepEqual(counters(), { hits: 0, misses: 0, clears: 0 });
  const value = readTrainingAttemptsStrict(admission).value[0]!;
  assert.equal(Object.isFrozen(value), false);
});
