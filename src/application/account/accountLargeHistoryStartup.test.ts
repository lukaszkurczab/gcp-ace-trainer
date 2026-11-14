import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { bootstrapApplication } from "../bootstrap/applicationBootstrap";
import { loadAccountDataSession, retryAccountDataSync } from "./accountDataService";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { createFamilyEnvelope, createTrainingAttempt, createTrainingSession, createTrainingSessionResult } from "../../domain";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { PatternlyApiClient, ProgressMutationDto, ProgressRecordDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../../storage/keys";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { addTrainingAttempt } from "../../storage/repositories/trainingAttemptRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { saveTrainingSessionResult } from "../../storage/repositories/trainingSessionResultRepository";
import { saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { assertTrainingEvidenceIntegrity } from "../../storage/repositories/trainingEvidenceIntegrityRepository";
import { buildAccountDataSnapshot, getAccountSyncState, saveAccountSyncState } from "../../storage/repositories/accountDataRepository";

const ACCOUNT_ID = "acc-large-history";
const TRACK_ID = "coding-interview-dsa-problem-solving";
const ATTEMPTS_PER_SESSION = 10;
const MODE_ID = "coding-interview-guided-practice";
const context = productionLearningDataAdmissionContext;
const LEARNING_RECORD_PREFIXES = ["training-session:", "training-session-result:", "training-attempt:", "review-entry:"].map((prefix) => `${STORAGE_NAMESPACE}${prefix}`);

/** Memory storage that counts operations and can simulate a process kill after N mutations. */
class ObservedStorage extends MemoryKeyValueStorage {
  observedReads = 0;
  mutations: string[] = [];
  killAfter: number | null = null;
  private dead = false;
  override getString(key: string): string | undefined { this.observedReads += 1; return super.getString(key); }
  override setString(key: string, value: string): void { this.mutate(`set ${key}`, value); super.setString(key, value); }
  override remove(key: string): void { this.mutate(`remove ${key}`); super.remove(key); }
  restart(): void { this.dead = false; this.killAfter = null; }
  resetCounters(): void { this.observedReads = 0; this.mutations = []; }
  clone(): ObservedStorage {
    const copy = new ObservedStorage();
    for (const key of this.getAllKeys()) copy.setString(key, super.getString(key)!);
    copy.resetCounters();
    return copy;
  }
  private mutate(operation: string, value?: string): void {
    if (this.dead || (this.killAfter !== null && this.mutations.length >= this.killAfter)) {
      this.dead = true;
      throw new Error("simulated process kill");
    }
    this.mutations.push(value?.includes("remote-apply:") ? `${operation} [remote-apply marker]` : operation);
  }
}

/** Fake account backend: applies every upload and returns all records on read. */
class FakeAccountBackend {
  records: ProgressRecordDto[] = [];
  api(): PatternlyApiClient {
    const unused = async () => { throw new Error("unused"); };
    return new Proxy({
      availability: "available",
      syncProgress: async (input: { mutations: readonly ProgressMutationDto[]; expectedAccountRevision: number }) => {
        const applied = input.mutations.map((mutation): ProgressRecordDto => ({
          kind: mutation.recordType === "training_attempt" || mutation.recordType === "review_queue_entry" ? "item" : "node",
          recordType: mutation.recordType, trackId: mutation.trackId, targetId: mutation.targetId,
          version: (mutation.expectedVersion ?? 0) + 1, fingerprint: mutation.fingerprint, state: mutation.state,
          lastMutationId: mutation.mutationId, updatedAt: "2026-10-08T10:00:00.000Z",
        }));
        const keys = new Set(applied.map((record) => `${record.recordType}|${record.trackId}|${record.targetId}`));
        this.records = [...this.records.filter((record) => !keys.has(`${record.recordType}|${record.trackId}|${record.targetId}`)), ...applied];
        return { accountRevision: input.expectedAccountRevision + applied.length, applied, duplicates: [], conflicts: [] };
      },
      getProgress: async () => ({ accountRevision: this.records.length, records: this.records }),
      getProgressSnapshot: async () => ({ kind: "full", progress: { accountRevision: this.records.length, records: this.records }, snapshotToken: null }),
    } as Record<string, unknown>, { get: (target, key) => (key in target ? target[key as string] : unused) }) as unknown as PatternlyApiClient;
  }
}

let storage: ObservedStorage;
function install(next: ObservedStorage): void { storage = next; installKeyValueStorageForTests(next); }

beforeEach(() => { install(new ObservedStorage()); });

async function prepareBoundAccount(): Promise<void> {
  initializeStorageMetadata();
  await provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666601", localDatasetId: "77777777-7777-4777-8777-777777777701" }; } });
  await bindGuestInstallationToAccount(ACCOUNT_ID);
  saveAccountSyncState({ ...await getAccountSyncState(context), accountId: ACCOUNT_ID, status: "synced" }, context);
  await saveActiveTrackId(TRACK_ID);
}

type FixtureQuestion = Readonly<{ questionId: string; nodeId: string; mentalUnitId: string; optionIds: readonly string[]; correctOptionId: string }>;
let fixtureCatalog: Promise<Readonly<{ questions: readonly FixtureQuestion[]; contentVersion: string; artifactSha256: string }>> | null = null;
/** Real runtime content, so the history is accepted exactly like the seed-100 fixture. */
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

/** Terminal sessions, each with attempts and a result (the seed-history record mix). */
async function addHistory(prefix: string, sessions: number): Promise<void> {
  const { questions, contentVersion, artifactSha256 } = await catalog();
  const ref = (questionId: string) => ({ trackId: TRACK_ID, questionId, contentVersion, artifactSha256 });
  let cursor = 0;
  for (let index = 0; index < sessions; index += 1) {
    const id = `${prefix}-session-${index}`;
    const startedMs = Date.parse("2026-10-01T00:00:00.000Z") + index * 3_600_000;
    const occurrences = Array.from({ length: ATTEMPTS_PER_SESSION }, (_, item) => {
      const question = questions[cursor++ % questions.length]!;
      const correct = item % 3 !== 0;
      const optionId = correct ? question.correctOptionId : question.optionIds.find((option) => option !== question.correctOptionId) ?? question.correctOptionId;
      return { occurrenceId: `occurrence-${item + 1}`, question, optionId, correct: optionId === question.correctOptionId, answeredAt: new Date(startedMs + (item + 1) * 20_000).toISOString() };
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
      await addTrainingAttempt(createTrainingAttempt({
        id: `${id}:${occurrence.occurrenceId}`, sessionId: id, trackId: TRACK_ID, modeId: MODE_ID, occurrenceId: occurrence.occurrenceId,
        item: ref(occurrence.question.questionId), response: { type: "choice_single", optionId: occurrence.optionId },
        result: occurrence.correct ? { kind: "correct", earnedPoints: 1, maxPoints: 1 } : { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
        reviewEvidence: { sourceItem: ref(occurrence.question.questionId), taxonomyOrSkillRefs: [{ axisId: "node", nodeId: occurrence.question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: occurrence.question.mentalUnitId, role: "primary" }] },
        answeredAt: occurrence.answeredAt, committedAt: occurrence.answeredAt,
      }), productionTrackAdmissionContext);
    }
    const correctCount = occurrences.filter((occurrence) => occurrence.correct).length;
    await saveTrainingSessionResult(createTrainingSessionResult({
      id: `${id}:result`, sessionId: id, trackId: TRACK_ID, totalOccurrences: ATTEMPTS_PER_SESSION,
      answeredOccurrenceIds: occurrences.map((occurrence) => occurrence.occurrenceId), unansweredOccurrenceIds: [], completedAt,
      evidence: createFamilyEnvelope({ familyId: "coding_interview", details: { activeForegroundMs, correctCount, partialCount: 0, incorrectCount: ATTEMPTS_PER_SESSION - correctCount, pointsEarned: correctCount, maxPoints: ATTEMPTS_PER_SESSION } }),
    }), productionTrackAdmissionContext);
  }
}

function learningRecordWrites(mutations: readonly string[]): readonly string[] {
  return mutations.filter((operation) => LEARNING_RECORD_PREFIXES.some((prefix) => operation.includes(` ${prefix}`)));
}

async function localRecordKeys(): Promise<readonly string[]> {
  return (await buildAccountDataSnapshot(context)).records.map((record) => `${record.recordType}|${record.recordId}|${record.fingerprint}`).sort();
}

function remoteRecordKeys(backend: FakeAccountBackend): readonly string[] {
  return backend.records.map((record) => `${record.recordType}|${record.targetId}|${record.fingerprint}`).sort();
}

async function steadyStateStartCost(sessions: number): Promise<Readonly<{ reads: number; learningWrites: number; status: string }>> {
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("local", sessions);
  const backend = new FakeAccountBackend();
  const first = await retryAccountDataSync(backend.api(), ACCOUNT_ID);
  assert.equal(first.status, "synced", String(first.lastFailureCode));
  storage.resetCounters();
  const next = await loadAccountDataSession(backend.api(), ACCOUNT_ID);
  return { reads: storage.observedReads, learningWrites: learningRecordWrites(storage.mutations).length, status: next.status };
}

test("a start with an unchanged large history does not rewrite local records and costs linear storage work", async () => {
  const small = await steadyStateStartCost(8);
  const large = await steadyStateStartCost(32);
  assert.equal(small.status, "synced");
  assert.equal(large.status, "synced");
  // Nothing is re-materialized once local evidence equals the account copy.
  assert.equal(small.learningWrites, 0);
  assert.equal(large.learningWrites, 0);
  // 4x the history must cost about 4x the reads (a quadratic path would be ~16x).
  const ratio = large.reads / small.reads;
  assert.ok(ratio < 5, `storage reads grew ${ratio.toFixed(2)}x for 4x history (${small.reads} -> ${large.reads})`);
});

test("materializing a large account copy writes each record once and each family index once", async () => {
  await prepareBoundAccount();
  const backend = new FakeAccountBackend();
  await addHistory("remote", 30);
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  const recordCount = backend.records.length;
  // Fresh device, same account: everything comes from the account copy.
  install(new ObservedStorage());
  await prepareBoundAccount();
  storage.resetCounters();
  assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced");
  const writes = learningRecordWrites(storage.mutations).filter((operation) => operation.startsWith("set "));
  assert.equal(writes.length, recordCount - 1, "one write per session, attempt and result (active track is not a family record)");
  for (const index of [STORAGE_KEYS.TRAINING_SESSION_INDEX, STORAGE_KEYS.TRAINING_ATTEMPT_INDEX]) {
    assert.equal(storage.mutations.filter((operation) => operation === `set ${index}`).length, 1, index);
  }
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
});

/** A device whose next sync must replace local evidence: the account also holds history from another device. */
async function prepareDivergedDevice(): Promise<Readonly<{ backend: FakeAccountBackend; before: ObservedStorage; mutations: readonly string[] }>> {
  const backend = new FakeAccountBackend();
  await prepareBoundAccount();
  await addHistory("other-device", 4);
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("this-device", 12);
  const before = storage.clone();
  // Reference run: record every mutation so kill points can be chosen inside the apply.
  storage.resetCounters();
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
  return { backend, before, mutations: [...storage.mutations] };
}

function evidenceIsConsistent(): boolean {
  try { assertTrainingEvidenceIntegrity(productionTrackAdmissionContext); return true; } catch { return false; }
}

/** Replays the diverged sync on a copy of the device, killed after `killAfter` mutations. */
async function killedDevice(before: ObservedStorage, backend: FakeAccountBackend, killAfter: number): Promise<ObservedStorage> {
  const device = before.clone();
  install(device);
  device.killAfter = killAfter;
  await retryAccountDataSync(backend.api(), ACCOUNT_ID).catch(() => undefined);
  device.restart();
  return device;
}

/** First kill point inside the apply that leaves evidence the bootstrap would reject. */
async function inconsistentKillPoint(before: ObservedStorage, backend: FakeAccountBackend, mutations: readonly string[]): Promise<number> {
  const marker = mutations.findIndex((operation) => operation.endsWith("[remote-apply marker]"));
  for (let killAfter = marker + 1; killAfter < mutations.length; killAfter += 1) {
    await killedDevice(before, backend, killAfter);
    if (!evidenceIsConsistent()) return killAfter;
  }
  throw new Error("no kill point leaves inconsistent evidence");
}

test("a kill at any point of the account apply never leaves a store that cannot start; the next start restores the account copy", async () => {
  const { backend, before, mutations } = await prepareDivergedDevice();
  const marker = mutations.findIndex((operation) => operation.endsWith("[remote-apply marker]"));
  assert.ok(marker > 0, "the apply is preceded by a durable remote-apply marker");
  const applyLength = mutations.length - marker;
  const killPoints = [marker, marker + 1, marker + 3, ...[0.1, 0.25, 0.5, 0.75, 0.9, 0.99].map((share) => marker + Math.floor(applyLength * share)), mutations.length - 1];
  let inconsistent = 0;
  for (const killAfter of [...new Set(killPoints)]) {
    await killedDevice(before, backend, killAfter);
    if (!evidenceIsConsistent()) inconsistent += 1;
    const boot = await bootstrapApplication(async () => undefined, async () => undefined);
    assert.equal(boot.kind, "ready", `kill after mutation ${killAfter}/${mutations.length}: ${boot.kind === "blocking" ? boot.reason : boot.kind}`);
    const loaded = await loadAccountDataSession(backend.api(), ACCOUNT_ID);
    assert.equal(loaded.status, "synced", `kill after mutation ${killAfter}: ${loaded.lastFailureCode}`);
    assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend), `kill after mutation ${killAfter}`);
    assert.equal((await getAccountSyncState(context)).materialization, null);
    const again = await bootstrapApplication(async () => undefined, async () => undefined);
    assert.equal(again.kind, "ready");
  }
  // Without recovery these stores fail `opening-storage` (the seed-100 LOCAL_OPERATION_FAILED).
  assert.ok(inconsistent > 0, "the kill points include stores left inconsistent by the interrupted apply");
});

test("a store left inconsistent by an interrupted sync from before the marker existed is restored from the account copy", async () => {
  const { backend, before, mutations } = await prepareDivergedDevice();
  const device = await killedDevice(before, backend, await inconsistentKillPoint(before, backend, mutations));
  assert.equal(evidenceIsConsistent(), false);
  // Older builds wrote no marker: the stored sync state is only "syncing" with nothing to upload.
  const interrupted = await getAccountSyncState(context);
  saveAccountSyncState({ ...interrupted, materialization: null, status: "syncing" }, context);
  const boot = await bootstrapApplication(async () => undefined, async () => undefined);
  assert.equal(boot.kind, "ready", boot.kind === "blocking" ? boot.reason : boot.kind);
  assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced");
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend));
});

test("an inconsistent store with local work not yet uploaded is not cleared and reports its cause code", async () => {
  const { backend, before, mutations } = await prepareDivergedDevice();
  const device = await killedDevice(before, backend, await inconsistentKillPoint(before, backend, mutations));
  assert.equal(evidenceIsConsistent(), false);
  const interrupted = await getAccountSyncState(context);
  saveAccountSyncState({ ...interrupted, materialization: null, status: "offlinePending" }, context);
  const keysBefore = [...device.getAllKeys()].sort();
  const boot = await bootstrapApplication(async () => undefined, async () => undefined);
  assert.equal(boot.kind, "blocking");
  assert.match(boot.kind === "blocking" ? boot.reason : "", /\[EVIDENCE_INTEGRITY_FAILED\]$/u);
  assert.deepEqual([...device.getAllKeys()].sort(), keysBefore, "no local evidence is removed without a complete account copy");
});
