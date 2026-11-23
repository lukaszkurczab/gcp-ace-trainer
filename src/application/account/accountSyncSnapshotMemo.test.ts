import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test, { afterEach, beforeEach } from "node:test";

import { bootstrapApplication } from "../bootstrap/applicationBootstrap";
import { loadAccountDataSession, retryAccountDataSync } from "./accountDataService";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { createTrainingAttempt, createTrainingSession, createTrainingSessionResult, createFamilyEnvelope } from "../../domain";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { PatternlyApiClient, ProgressMutationDto, ProgressRecordDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../../storage/keys";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { bindGuestInstallationToAccount, clearGuestAccountBinding, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { addTrainingAttempt } from "../../storage/repositories/trainingAttemptRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { saveTrainingSessionResult } from "../../storage/repositories/trainingSessionResultRepository";
import { saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import {
  buildAccountDataSnapshot,
  clearSyncSnapshotMemo,
  getAccountSyncState,
  readAccountSyncBaselineMatch,
  readAccountDataPerfCountersForTests,
  readSyncSnapshotPerfCountersForTests,
  resetAccountDataPerfCountersForTests,
  resetSyncSnapshotPerfCountersForTests,
  saveAccountSyncState,
  type AccountSyncState,
} from "../../storage/repositories/accountDataRepository";

/*
 * T2.6: sync cost scales linearly with history, the snapshot memo and the
 * unchanged-start baseline never change what a sync does.
 */

const ACCOUNT_ID = "acc-snapshot-memo";
const TRACK_ID = "coding-interview-dsa-problem-solving";
const MODE_ID = "coding-interview-guided-practice";
const ATTEMPTS_PER_SESSION = 10;
const context = productionLearningDataAdmissionContext;
const BASELINE_KEY = "patternly:derived:v1:account-sync-baseline";

/** Memory storage that counts reads, can run a hook on a read and can be killed after N mutations. */
class ObservedStorage extends MemoryKeyValueStorage {
  observedReads = 0;
  mutations: string[] = [];
  killAfter: number | null = null;
  onRead: ((key: string) => void) | null = null;
  private dead = false;
  override getString(key: string): string | undefined {
    this.observedReads += 1;
    const hook = this.onRead;
    if (hook) hook(key);
    return super.getString(key);
  }
  override setString(key: string, value: string): void { this.mutate(`set ${key}`); super.setString(key, value); }
  override remove(key: string): void { this.mutate(`remove ${key}`); super.remove(key); }
  restart(): void { this.dead = false; this.killAfter = null; }
  resetCounters(): void { this.observedReads = 0; this.mutations = []; }
  /** A copy as a new storage owner: every in-memory memo misses, as after a process restart. */
  clone(): ObservedStorage {
    const copy = new ObservedStorage();
    for (const key of this.getAllKeys()) copy.setString(key, super.getString(key)!);
    copy.resetCounters();
    return copy;
  }
  private mutate(operation: string): void {
    if (this.dead || (this.killAfter !== null && this.mutations.length >= this.killAfter)) {
      this.dead = true;
      throw new Error("simulated process kill");
    }
    this.mutations.push(operation);
  }
}

/** Fake account backend; every response is a fresh JSON copy, as from the network. */
class FakeAccountBackend {
  records: ProgressRecordDto[] = [];
  syncCalls = 0;
  getCalls = 0;
  beforeGet: (() => Promise<void>) | null = null;
  api(): PatternlyApiClient {
    const unused = async () => { throw new Error("unused"); };
    return new Proxy({
      availability: "available",
      syncProgress: async (input: { mutations: readonly ProgressMutationDto[]; expectedAccountRevision: number }) => {
        this.syncCalls += 1;
        const applied = input.mutations.map((mutation): ProgressRecordDto => ({
          kind: mutation.recordType === "training_attempt" || mutation.recordType === "review_queue_entry" ? "item" : "node",
          recordType: mutation.recordType, trackId: mutation.trackId, targetId: mutation.targetId,
          version: (mutation.expectedVersion ?? 0) + 1, fingerprint: mutation.fingerprint, state: mutation.state,
          lastMutationId: mutation.mutationId, updatedAt: "2026-10-08T10:00:00.000Z",
        }));
        const keys = new Set(applied.map((record) => `${record.recordType}|${record.trackId}|${record.targetId}`));
        this.records = [...this.records.filter((record) => !keys.has(`${record.recordType}|${record.trackId}|${record.targetId}`)), ...applied];
        return JSON.parse(JSON.stringify({ accountRevision: input.expectedAccountRevision + applied.length, applied, duplicates: [], conflicts: [] }));
      },
      getProgress: async () => {
        const read = await this.read(null);
        assert.equal(read.kind, "full");
        return read.progress;
      },
      getProgressSnapshot: (knownSnapshot: string | null) => this.read(knownSnapshot),
    } as Record<string, unknown>, { get: (target, key) => (key in target ? target[key as string] : unused) }) as unknown as PatternlyApiClient;
  }
  /** Another device's write: the account copy changes without this device. */
  revisionOffset = 0;
  /** T3.3a: server metadata rewrites at the same revision move the token too. */
  metadataEpoch = 0;
  /** Distinguishes accounts: the server token is bound to the account. */
  accountSalt = ACCOUNT_ID;
  fullReads = 0;
  unchangedReads = 0;
  knownSnapshots: (string | null)[] = [];
  token(): string {
    return createHash("sha256").update(JSON.stringify({ account: this.accountSalt, revision: this.records.length + this.revisionOffset, epoch: this.metadataEpoch })).digest("hex");
  }
  private async read(knownSnapshot: string | null) {
    this.getCalls += 1;
    this.knownSnapshots.push(knownSnapshot);
    const hook = this.beforeGet;
    this.beforeGet = null;
    if (hook) await hook();
    const accountRevision = this.records.length + this.revisionOffset;
    const snapshotToken = this.token();
    if (knownSnapshot === snapshotToken) {
      this.unchangedReads += 1;
      return { kind: "unchanged" as const, accountRevision, generation: 0, snapshotToken };
    }
    this.fullReads += 1;
    return { kind: "full" as const, progress: JSON.parse(JSON.stringify({ accountRevision, records: this.records })) as { accountRevision: number; records: ProgressRecordDto[] }, snapshotToken };
  }
}

let storage: ObservedStorage;
function install(next: ObservedStorage): void { storage = next; installKeyValueStorageForTests(next); }
/** Restart: same bytes, new storage owner, empty memos. */
function restart(): void { install(storage.clone()); }

beforeEach(() => { clearSyncSnapshotMemo(); install(new ObservedStorage()); });

async function prepareBoundAccount(): Promise<void> {
  initializeStorageMetadata();
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666611", localDatasetId: "77777777-7777-4777-8777-777777777711" }; } });
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(context), accountId: ACCOUNT_ID, status: "synced" }, context);
  await saveActiveTrackId(TRACK_ID);
}

type FixtureQuestion = Readonly<{ questionId: string; nodeId: string; mentalUnitId: string; optionIds: readonly string[]; correctOptionId: string }>;
let fixtureCatalog: Promise<Readonly<{ questions: readonly FixtureQuestion[]; contentVersion: string; artifactSha256: string }>> | null = null;
function catalog() {
  fixtureCatalog ??= (async () => {
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
    const identity = track.trainingIdentity ?? { contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
    const questions = track.questions
      .filter((question) => question.interaction?.type === "choice_single" && question.answer?.type === "choice_single")
      .map((question) => ({
        questionId: question.questionId, nodeId: question.nodeId, mentalUnitId: question.mentalUnitId,
        optionIds: (question.interaction as { options: readonly { optionId: string }[] }).options.map((option) => option.optionId),
        correctOptionId: (question.answer as { optionId: string }).optionId,
      }));
    return { questions, contentVersion: identity.contentVersion, artifactSha256: identity.artifactSha256 };
  })();
  return fixtureCatalog;
}

/** Terminal sessions with attempts and a result, written through the repositories (no pending mark). */
async function addHistory(prefix: string, sessions: number, offset = 0): Promise<void> {
  const { questions, contentVersion, artifactSha256 } = await catalog();
  const ref = (questionId: string) => ({ trackId: TRACK_ID, questionId, contentVersion, artifactSha256 });
  let cursor = offset * ATTEMPTS_PER_SESSION;
  for (let index = 0; index < sessions; index += 1) {
    const id = `${prefix}-session-${offset + index}`;
    const startedMs = Date.parse("2026-10-01T00:00:00.000Z") + (offset + index) * 3_600_000;
    const occurrences = Array.from({ length: ATTEMPTS_PER_SESSION }, (_, item) => {
      const question = questions[cursor++ % questions.length]!;
      const correct = item % 3 !== 0;
      const optionId = correct ? question.correctOptionId : question.optionIds.find((option) => option !== question.correctOptionId) ?? question.correctOptionId;
      return { occurrenceId: `occurrence-${item + 1}`, question, optionId, answeredAt: new Date(startedMs + (item + 1) * 20_000).toISOString() };
    });
    const completedAt = new Date(startedMs + (ATTEMPTS_PER_SESSION + 1) * 20_000).toISOString();
    const activeForegroundMs = (ATTEMPTS_PER_SESSION + 1) * 20_000;
    await saveTrainingSession(createTrainingSession({
      id, trackId: TRACK_ID, modeId: MODE_ID, configurationSnapshot: { kind: "practice" } as never,
      requestedLength: ATTEMPTS_PER_SESSION, actualLength: ATTEMPTS_PER_SESSION, currentItemIndex: ATTEMPTS_PER_SESSION - 1,
      itemOrder: occurrences.map((occurrence) => ({ occurrenceId: occurrence.occurrenceId, item: ref(occurrence.question.questionId) })),
      optionOrderByOccurrence: Object.fromEntries(occurrences.map((occurrence) => [occurrence.occurrenceId, [...occurrence.question.optionIds]])),
      activeForegroundMs, contentVersion, artifactSha256, status: "completed", startedAt: new Date(startedMs).toISOString(), completedAt,
    }), productionTrackAdmissionContext);
    for (const occurrence of occurrences) {
      const correct = occurrence.optionId === occurrence.question.correctOptionId;
      await addTrainingAttempt(createTrainingAttempt({
        id: `${id}:${occurrence.occurrenceId}`, sessionId: id, trackId: TRACK_ID, modeId: MODE_ID, occurrenceId: occurrence.occurrenceId,
        item: ref(occurrence.question.questionId), response: { type: "choice_single", optionId: occurrence.optionId },
        result: correct ? { kind: "correct", earnedPoints: 1, maxPoints: 1 } : { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
        reviewEvidence: { sourceItem: ref(occurrence.question.questionId), taxonomyOrSkillRefs: [{ axisId: "node", nodeId: occurrence.question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: occurrence.question.mentalUnitId, role: "primary" }] },
        answeredAt: occurrence.answeredAt, committedAt: occurrence.answeredAt,
      }), productionTrackAdmissionContext);
    }
    const correctCount = occurrences.filter((occurrence) => occurrence.optionId === occurrence.question.correctOptionId).length;
    await saveTrainingSessionResult(createTrainingSessionResult({
      id: `${id}:result`, sessionId: id, trackId: TRACK_ID, totalOccurrences: ATTEMPTS_PER_SESSION,
      answeredOccurrenceIds: occurrences.map((occurrence) => occurrence.occurrenceId), unansweredOccurrenceIds: [], completedAt,
      evidence: createFamilyEnvelope({ familyId: "coding_interview", details: { activeForegroundMs, correctCount, partialCount: 0, incorrectCount: ATTEMPTS_PER_SESSION - correctCount, pointsEarned: correctCount, maxPoints: ATTEMPTS_PER_SESSION } }),
    }), productionTrackAdmissionContext);
  }
}

async function localRecordKeys(): Promise<readonly string[]> {
  return (await buildAccountDataSnapshot(context)).records.map((record) => `${record.recordType}|${record.recordId}|${record.fingerprint}`).sort();
}
function remoteRecordKeys(backend: FakeAccountBackend): readonly string[] {
  return backend.records.map((record) => `${record.recordType}|${record.targetId}|${record.fingerprint}`).sort();
}
function resetCounters(): void {
  storage.resetCounters();
  resetAccountDataPerfCountersForTests();
  resetSyncSnapshotPerfCountersForTests();
}
function cost(): Readonly<{ reads: number; fingerprints: number }> {
  return { reads: storage.observedReads, fingerprints: readAccountDataPerfCountersForTests().fingerprintComputations };
}

type SyncCosts = Readonly<{ records: number; coldFull: ReturnType<typeof cost>; quiz: ReturnType<typeof cost>; coldUnchanged: ReturnType<typeof cost>; coldUnchangedGets: number }>;

async function syncCosts(sessions: number): Promise<SyncCosts> {
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("local", sessions);
  const backend = new FakeAccountBackend();
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  // Cold start without a baseline: the full path, one projection per local record.
  storage.remove(BASELINE_KEY);
  restart();
  resetCounters();
  assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced");
  const coldFull = cost();
  // S4: a finished session in this process, then the in-app sync.
  await addHistory("quiz", 1, sessions);
  resetCounters();
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  const quiz = cost();
  // Next cold start: nothing changed anywhere.
  restart();
  resetCounters();
  const gets = backend.getCalls;
  assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced");
  return { records: backend.records.length, coldFull, quiz, coldUnchanged: cost(), coldUnchangedGets: backend.getCalls - gets };
}

test("account sync work is linear in history: 4x the history costs < 5x the reads and fingerprints", async () => {
  const small = await syncCosts(6);
  const large = await syncCosts(24);
  for (const phase of ["coldFull", "quiz", "coldUnchanged"] as const) {
    const readRatio = large[phase].reads / small[phase].reads;
    assert.ok(readRatio < 5, `${phase}: storage reads grew ${readRatio.toFixed(2)}x for 4x history (${small[phase].reads} -> ${large[phase].reads})`);
    if (small[phase].fingerprints > 0) {
      const ratio = large[phase].fingerprints / small[phase].fingerprints;
      assert.ok(ratio < 5, `${phase}: fingerprints grew ${ratio.toFixed(2)}x for 4x history (${small[phase].fingerprints} -> ${large[phase].fingerprints})`);
    }
  }
  for (const costs of [small, large]) {
    // One local projection per record plus one check per remote record (was 4 snapshots + 3 remote passes).
    assert.ok(costs.coldFull.fingerprints <= 2 * costs.records + 2, `cold full sync hashed ${costs.coldFull.fingerprints} for ${costs.records} records`);
    // After a quiz only the new local records are projected; remote records are hashed once.
    assert.ok(costs.quiz.fingerprints <= costs.records + 2 * (ATTEMPTS_PER_SESSION + 2), `quiz sync hashed ${costs.quiz.fingerprints} for ${costs.records} records`);
    // An unchanged start reads bytes once and hashes no record.
    assert.equal(costs.coldUnchanged.fingerprints, 0);
    assert.equal(costs.coldUnchangedGets, 1);
  }
});

function comparableState(state: AccountSyncState): unknown {
  // The dataset fingerprint format and its version counter are path-specific; the rest is the sync contract.
  const { lastSuccessfulSyncAt: _at, localDatasetFingerprint: _fingerprint, localDatasetVersion: _version, ...rest } = state;
  return rest;
}

async function scenario(): Promise<Readonly<{ states: unknown[]; local: (readonly string[])[]; remote: ProgressRecordDto[][] }>> {
  install(new ObservedStorage());
  const backend = new FakeAccountBackend();
  const states: unknown[] = [];
  const local: (readonly string[])[] = [];
  const remote: ProgressRecordDto[][] = [];
  const step = async (run: () => Promise<unknown>) => {
    const session = await run() as { status: string };
    states.push([session.status, comparableState(await getAccountSyncState(context))]);
    local.push(await localRecordKeys());
    remote.push(JSON.parse(JSON.stringify(backend.records)) as ProgressRecordDto[]);
  };
  await prepareBoundAccount();
  await addHistory("local", 5);
  await step(() => retryAccountDataSync(backend.api(), ACCOUNT_ID));
  restart();
  await step(() => loadAccountDataSession(backend.api(), ACCOUNT_ID));
  restart();
  await step(() => loadAccountDataSession(backend.api(), ACCOUNT_ID));
  await addHistory("quiz", 1, 5);
  await step(() => retryAccountDataSync(backend.api(), ACCOUNT_ID));
  // Another device adds history to the account.
  const other = new ObservedStorage();
  const current = storage;
  install(other);
  await prepareBoundAccount();
  await addHistory("other", 2, 20);
  await retryAccountDataSync(backend.api(), ACCOUNT_ID);
  install(current);
  restart();
  await step(() => loadAccountDataSession(backend.api(), ACCOUNT_ID));
  restart();
  await step(() => loadAccountDataSession(backend.api(), ACCOUNT_ID));
  return { states, local, remote };
}

/**
 * Expected end of every step, recorded from the pre-memo snapshot path before
 * it was removed: 5 local sessions, a quiz, then 2 sessions from another device.
 */
const EXPECTED_STEPS = [
  { revision: 61, records: 61, outboxSequence: 61, highWatermark: 61 },
  { revision: 61, records: 61, outboxSequence: 61, highWatermark: 61 },
  { revision: 61, records: 61, outboxSequence: 61, highWatermark: 61 },
  { revision: 73, records: 73, outboxSequence: 73, highWatermark: 73 },
  { revision: 97, records: 97, outboxSequence: 73, highWatermark: 73 },
  { revision: 97, records: 97, outboxSequence: 73, highWatermark: 73 },
] as const;

test("the snapshot memo and the baseline end every sync with the recorded sync contract", async () => {
  const { states, local, remote } = await scenario();
  assert.equal(states.length, EXPECTED_STEPS.length);
  EXPECTED_STEPS.forEach((expected, index) => {
    const [status, state] = states[index] as [string, Record<string, unknown> & { acknowledged: Record<string, { fingerprint: string; remoteVersion: number }>; outbox: unknown[] }];
    const { acknowledged, ...rest } = state;
    assert.equal(status, "synced", `step ${index}`);
    assert.deepEqual(rest, {
      accountId: ACCOUNT_ID, guestAdoptionChoice: "transfer", status: "synced", remoteAccountRevision: expected.revision,
      pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, syncConflict: null, outbox: [],
      materialization: null, pendingConfirmation: null, syncPlan: null, outboxSequence: expected.outboxSequence,
      highWatermark: expected.highWatermark, resetGuard: null, learningPlanRecovery: null,
    }, `step ${index}`);
    assert.equal(local[index]!.length, expected.records, `step ${index}: local records`);
    assert.equal(remote[index]!.length, expected.records, `step ${index}: remote records`);
    // Local and remote hold the same records with the same fingerprints, all acknowledged at version 1.
    assert.deepEqual(local[index], remote[index]!.map((record) => `${record.recordType}|${record.targetId}|${record.fingerprint}`).sort(), `step ${index}`);
    assert.equal(Object.keys(acknowledged).length, expected.records, `step ${index}: acknowledged`);
    for (const record of remote[index]!) {
      assert.equal(record.version, 1);
      const key = JSON.stringify({ recordId: record.targetId, recordType: record.recordType, trackId: record.trackId });
      assert.deepEqual([acknowledged[key]?.fingerprint, acknowledged[key]?.remoteVersion], [record.fingerprint, 1], `step ${index}: ${key}`);
    }
  });
  const byType: Record<string, number> = {};
  for (const record of remote.at(-1)!) byType[record.recordType] = (byType[record.recordType] ?? 0) + 1;
  assert.deepEqual(byType, { training_attempt: 80, training_session_result: 8, training_session_summary: 8, active_track: 1 });
});

async function steadyAccount(sessions = 4): Promise<FakeAccountBackend> {
  await prepareBoundAccount();
  await addHistory("local", sessions);
  const backend = new FakeAccountBackend();
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  restart();
  assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced");
  assert.ok(storage.getString(BASELINE_KEY), "an unchanged full sync records the baseline");
  return backend;
}

async function unchangedStartTakesBaseline(backend: FakeAccountBackend): Promise<boolean> {
  restart();
  resetCounters();
  const session = await loadAccountDataSession(backend.api(), ACCOUNT_ID);
  assert.equal(session.status, "synced", String(session.lastFailureCode));
  return readSyncSnapshotPerfCountersForTests().recordProjections === 0 && readAccountDataPerfCountersForTests().fingerprintComputations === 0;
}

test("an unchanged cold start ends on the baseline and only moves lastSuccessfulSyncAt", async () => {
  const backend = await steadyAccount();
  const before = await getAccountSyncState(context);
  assert.equal(await unchangedStartTakesBaseline(backend), true);
  const after = await getAccountSyncState(context);
  assert.deepEqual({ ...after, lastSuccessfulSyncAt: null }, { ...before, lastSuccessfulSyncAt: null });
  assert.notEqual(after.lastSuccessfulSyncAt, null);
  assert.equal(backend.syncCalls > 0, true);
});

test("a local record written without a pending mark is still uploaded: the baseline never hides local bytes", async () => {
  const backend = await steadyAccount();
  await addHistory("unmarked", 1, 10);
  assert.equal((await getAccountSyncState(context)).status, "synced", "the repositories alone do not mark the account pending");
  assert.equal(await unchangedStartTakesBaseline(backend), false);
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
  assert.equal(await unchangedStartTakesBaseline(backend), true);
});

test("a change on another device is applied: the baseline never hides remote changes", async () => {
  const backend = await steadyAccount();
  const current = storage;
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("other", 1, 30);
  await retryAccountDataSync(backend.api(), ACCOUNT_ID);
  install(current);
  assert.equal(await unchangedStartTakesBaseline(backend), false);
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
  // A baseline is recorded only by a full sync that found nothing to apply.
  assert.equal(storage.getString(BASELINE_KEY), undefined);
  assert.equal(await unchangedStartTakesBaseline(backend), false);
  assert.equal(await unchangedStartTakesBaseline(backend), true);
});

test("a changed sync state or a damaged baseline runs the full path", async () => {
  const backend = await steadyAccount();
  const state = await getAccountSyncState(context);
  const [firstKey] = Object.keys(state.acknowledged);
  const { [firstKey!]: _dropped, ...acknowledged } = state.acknowledged;
  saveAccountSyncState({ ...state, acknowledged }, context);
  assert.equal(await unchangedStartTakesBaseline(backend), false, "an acknowledgement change invalidates the baseline");
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
  storage.setString(BASELINE_KEY, "{not json");
  assert.equal(await unchangedStartTakesBaseline(backend), false);
  assert.equal(await unchangedStartTakesBaseline(backend), true);
});

test("a local commit while the unchanged check waits for the account copy is never lost", async () => {
  const backend = await steadyAccount();
  restart();
  backend.beforeGet = async () => { await addHistory("concurrent", 1, 40); };
  const first = await loadAccountDataSession(backend.api(), ACCOUNT_ID);
  assert.ok(["synced", "offlinePending"].includes(first.status), first.status);
  await retryAccountDataSync(backend.api(), ACCOUNT_ID);
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
  assert.ok(remoteRecordKeys(backend).some((key) => key.includes("concurrent-session-40")));
});

test("a write that lands during a snapshot read discards the torn read", async () => {
  await prepareBoundAccount();
  await addHistory("local", 3);
  let injected = false;
  storage.onRead = (key) => {
    if (injected || !key.startsWith(`${STORAGE_NAMESPACE}training-attempt:`)) return;
    injected = true;
    storage.onRead = null;
    // Same bytes, but a write: the read cannot know whether anything changed.
    storage.setString(STORAGE_KEYS.ACTIVE_TRACK, storage.getString(STORAGE_KEYS.ACTIVE_TRACK)!);
  };
  resetCounters();
  const snapshot = await buildAccountDataSnapshot(context);
  assert.equal(injected, true);
  assert.ok(readSyncSnapshotPerfCountersForTests().tornReads >= 1);
  restart();
  const fresh = await buildAccountDataSnapshot(context);
  assert.deepEqual(snapshot.records.map((record) => [record.recordType, record.recordId, record.fingerprint]), fresh.records.map((record) => [record.recordType, record.recordId, record.fingerprint]));
});

test("a kill at any write of a quiz sync or of an unchanged start never breaks the next start", async () => {
  const backend = await steadyAccount(3);
  await addHistory("quiz", 1, 3);
  const before = storage.clone();
  const backendBefore = JSON.parse(JSON.stringify(backend.records)) as ProgressRecordDto[];
  storage.resetCounters();
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  const writes = storage.mutations.length;
  assert.ok(writes > 0);
  for (let killAfter = 0; killAfter < writes; killAfter += 1) {
    backend.records = JSON.parse(JSON.stringify(backendBefore)) as ProgressRecordDto[];
    const device = before.clone();
    install(device);
    device.killAfter = killAfter;
    await retryAccountDataSync(backend.api(), ACCOUNT_ID).catch(() => undefined);
    device.restart();
    restart();
    const boot = await bootstrapApplication(async () => undefined, async () => undefined);
    assert.equal(boot.kind, "ready", `kill after write ${killAfter}/${writes}: ${boot.kind === "blocking" ? boot.reason : boot.kind}`);
    const loaded = await loadAccountDataSession(backend.api(), ACCOUNT_ID);
    assert.equal(loaded.status, "synced", `kill after write ${killAfter}: ${loaded.lastFailureCode}`);
    assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend), `kill after write ${killAfter}`);
    assert.equal(await unchangedStartTakesBaseline(backend), true, `kill after write ${killAfter}: the following start is unchanged`);
  }
});

/*
 * T3.3a: the baseline keeps the server's progress snapshot token, so a cold
 * start with nothing changed is one conditional request with no download.
 */

function storedBaseline(): Record<string, unknown> { return JSON.parse(storage.getString(BASELINE_KEY)!) as Record<string, unknown>; }

async function tokenStart(backend: FakeAccountBackend): Promise<Readonly<{ unchanged: number; full: number; sent: string | null | undefined }>> {
  restart();
  const unchanged = backend.unchangedReads;
  const full = backend.fullReads;
  const sentBefore = backend.knownSnapshots.length;
  const session = await loadAccountDataSession(backend.api(), ACCOUNT_ID);
  assert.equal(session.status, "synced", String(session.lastFailureCode));
  return { unchanged: backend.unchangedReads - unchanged, full: backend.fullReads - full, sent: backend.knownSnapshots[sentBefore] };
}

test("T3.3a: an unchanged cold start sends the persisted token and downloads nothing", async () => {
  const backend = await steadyAccount();
  assert.equal(storedBaseline().remoteSnapshotToken, backend.token());
  const before = await getAccountSyncState(context);
  resetCounters();
  assert.deepEqual(await tokenStart(backend), { unchanged: 1, full: 0, sent: backend.token() });
  assert.equal(readSyncSnapshotPerfCountersForTests().recordProjections, 0);
  const after = await getAccountSyncState(context);
  assert.deepEqual({ ...after, lastSuccessfulSyncAt: null }, { ...before, lastSuccessfulSyncAt: null });
  assert.notEqual(after.lastSuccessfulSyncAt, before.lastSuccessfulSyncAt);
});

test("T3.3a: a change from another device moves the token: full read, applied, then the new token", async () => {
  const backend = await steadyAccount();
  const oldToken = backend.token();
  const current = storage;
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("other", 1, 30);
  await retryAccountDataSync(backend.api(), ACCOUNT_ID);
  install(current);
  const first = await tokenStart(backend);
  assert.equal(first.sent, oldToken);
  assert.equal(first.unchanged, 0);
  assert.ok(first.full >= 1);
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
  // The apply clears the baseline; the next full unchanged sync records the current token.
  await tokenStart(backend);
  assert.equal(storedBaseline().remoteSnapshotToken, backend.token());
  assert.deepEqual(await tokenStart(backend), { unchanged: 1, full: 0, sent: backend.token() });
});

test("T3.3a: a token moved by a same-revision server rewrite is refreshed without a full sync", async () => {
  const backend = await steadyAccount();
  backend.metadataEpoch += 1;
  const moved = await tokenStart(backend);
  assert.deepEqual({ unchanged: moved.unchanged, full: moved.full }, { unchanged: 0, full: 1 });
  assert.equal(storedBaseline().remoteSnapshotToken, backend.token(), "the digest-equal copy keeps the newer token");
  assert.deepEqual(await tokenStart(backend), { unchanged: 1, full: 0, sent: backend.token() });
});

test("T3.3a: a damaged or foreign token never skips the download", async () => {
  const backend = await steadyAccount();
  // A well-formed token the server does not confirm: full read, compared by digest.
  storage.setString(BASELINE_KEY, JSON.stringify({ ...storedBaseline(), remoteSnapshotToken: "f".repeat(64) }));
  const wrong = await tokenStart(backend);
  assert.deepEqual({ unchanged: wrong.unchanged, full: wrong.full, sent: wrong.sent }, { unchanged: 0, full: 1, sent: "f".repeat(64) });
  assert.equal(storedBaseline().remoteSnapshotToken, backend.token());
  // A malformed token invalidates the whole baseline: no conditional read at all.
  storage.setString(BASELINE_KEY, JSON.stringify({ ...storedBaseline(), remoteSnapshotToken: "not-a-token" }));
  const malformed = await tokenStart(backend);
  assert.deepEqual({ unchanged: malformed.unchanged, sent: malformed.sent }, { unchanged: 0, sent: null });
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
  // A token the server confirms at another revision than the baseline is not trusted.
  const baseline = storedBaseline();
  storage.setString(BASELINE_KEY, JSON.stringify({ ...baseline, remoteSnapshotToken: backend.token() }));
  backend.revisionOffset += 1;
  const stale = await tokenStart(backend);
  assert.equal(stale.unchanged, 0);
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
});

test("T3.3a: sign-out or another account never sends this account's token", async () => {
  const backend = await steadyAccount();
  const token = backend.token();
  restart();
  await clearGuestAccountBinding();
  const sent = backend.knownSnapshots.length;
  const unchanged = backend.unchangedReads;
  await loadAccountDataSession(backend.api(), ACCOUNT_ID).catch(() => null);
  assert.equal(backend.unchangedReads, unchanged, "an unbound install never ends on the token");
  assert.ok(!backend.knownSnapshots.slice(sent).includes(token));
  const other = new FakeAccountBackend();
  other.accountSalt = "another-account";
  other.records = JSON.parse(JSON.stringify(backend.records)) as ProgressRecordDto[];
  await bindGuestInstallationToAccount("acc-another-account").catch(() => undefined);
  await loadAccountDataSession(other.api(), "acc-another-account").catch(() => null);
  assert.equal(other.unchangedReads, 0);
  assert.ok(!other.knownSnapshots.includes(token), "another account's start never carries this account's token");
});

test("T3.3a: a kill at any write of a token start never breaks the next start", async () => {
  const backend = await steadyAccount(3);
  restart();
  const before = storage.clone();
  storage.resetCounters();
  assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced");
  const writes = storage.mutations.length;
  assert.ok(writes > 0);
  for (let killAfter = 0; killAfter < writes; killAfter += 1) {
    const device = before.clone();
    install(device);
    device.killAfter = killAfter;
    await loadAccountDataSession(backend.api(), ACCOUNT_ID).catch(() => undefined);
    device.restart();
    restart();
    const boot = await bootstrapApplication(async () => undefined, async () => undefined);
    assert.equal(boot.kind, "ready", `kill after write ${killAfter}/${writes}`);
    assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced", `kill after write ${killAfter}`);
    assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend), `kill after write ${killAfter}`);
    assert.deepEqual(await tokenStart(backend), { unchanged: 1, full: 0, sent: backend.token() }, `kill after write ${killAfter}: the following start uses the token`);
  }
});

test("T4.2: after new local keys the baseline misses on the key count, without reading every input key", async () => {
  await steadyAccount();
  restart();
  assert.notEqual(await readAccountSyncBaselineMatch(ACCOUNT_ID, context), null, "the steady account matches");
  await addHistory("quiz-count", 1, 50);
  saveAccountSyncState({ ...await getAccountSyncState(context), status: "offlinePending" }, context);
  restart();
  storage.resetCounters();
  assert.equal(await readAccountSyncBaselineMatch(ACCOUNT_ID, context), null);
  assert.ok(storage.observedReads < 10, `the key count decides: ${storage.observedReads} reads`);
});

test("T4.2: the same key count with different bytes still misses through the digest", async () => {
  await steadyAccount();
  restart();
  const key = storage.getAllKeys().find((candidate) => candidate.startsWith(`${STORAGE_NAMESPACE}training-attempt:`))!;
  const raw = storage.getString(key)!;
  storage.setString(key, raw.replace('"revision":1', '"revision":2'));
  assert.notEqual(storage.getString(key), raw);
  restart();
  assert.equal(await readAccountSyncBaselineMatch(ACCOUNT_ID, context), null);
});
