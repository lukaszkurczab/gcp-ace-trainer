import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { bootstrapApplication } from "./applicationBootstrap";
import { composeTrainingLifecycleUseCases } from "./trainingLifecycleComposition";
import { isLocalFirstAccountStartEligible } from "./accountBootstrap";
import { loadAccountDataSession, readLocalAccountDataSession, retryAccountDataSync } from "../account/accountDataService";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { createFamilyEnvelope, createTrainingAttempt, createTrainingSession, createTrainingSessionResult } from "../../domain";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { PatternlyApiClient, ProgressMutationDto, ProgressRecordDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_NAMESPACE } from "../../storage/keys";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { addTrainingAttempt } from "../../storage/repositories/trainingAttemptRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { saveTrainingSessionResult } from "../../storage/repositories/trainingSessionResultRepository";
import { saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { assertTrainingEvidenceIntegrity } from "../../storage/repositories/trainingEvidenceIntegrityRepository";
import { buildAccountDataSnapshot, getAccountSyncState, saveAccountSyncState } from "../../storage/repositories/accountDataRepository";

/**
 * T2.3: a parallel (local-first) start over a large history, and a background
 * sync interrupted inside the apply. Helpers follow the T2.0 large-history test.
 */
const ACCOUNT_ID = "acc-large-history-t23";
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


async function localRecordKeys(): Promise<readonly string[]> {
  return (await buildAccountDataSnapshot(context)).records.map((record) => `${record.recordType}|${record.recordId}|${record.fingerprint}`).sort();
}

function remoteRecordKeys(backend: FakeAccountBackend): readonly string[] {
  return backend.records.map((record) => `${record.recordType}|${record.targetId}|${record.fingerprint}`).sort();
}


async function syncedHistory(sessions: number): Promise<FakeAccountBackend> {
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("local", sessions);
  const backend = new FakeAccountBackend();
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  return backend;
}

async function startReads(sessions: number, wroteNothing: boolean): Promise<number> {
  await syncedHistory(sessions);
  storage.resetCounters();
  const boot = await bootstrapApplication(async () => undefined, async () => undefined, async () => { composeTrainingLifecycleUseCases(); }, { lifecyclePreparationWroteNoLearningData: () => wroteNothing });
  assert.equal(boot.kind, "ready", boot.kind === "blocking" ? boot.reason : boot.kind);
  return storage.observedReads;
}

test("large history: a local-first start reads the local copy without network or writes, and skips the repeated integrity pass", async () => {
  await syncedHistory(32);
  assert.equal(await isLocalFirstAccountStartEligible(ACCOUNT_ID), true);
  storage.resetCounters();
  const local = await readLocalAccountDataSession(ACCOUNT_ID);
  assert.ok(local, "the local account copy is available without the API");
  assert.equal(storage.mutations.length, 0, "the local completion writes nothing");

  const repeated = await startReads(32, false);
  const skipped = await startReads(32, true);
  assert.ok(skipped < repeated, `skipping the repeated integrity pass saves reads (${repeated} -> ${skipped})`);
  const small = await startReads(8, true);
  assert.ok(skipped / small < 5, `bootstrap reads stay linear (${small} -> ${skipped} for 4x history)`);
});

test("the repeated integrity pass still runs when the lifecycle preparation may have written learning data", async () => {
  await syncedHistory(8);
  const boot = await bootstrapApplication(async () => undefined, async () => undefined, async () => {
    composeTrainingLifecycleUseCases();
    // A preparation that writes (e.g. an online sync apply) and corrupts evidence must still be caught.
    const attemptKey = storage.getAllKeys().find((key) => key.startsWith(`${STORAGE_NAMESPACE}training-attempt:`))!;
    storage.remove(attemptKey);
  }, { lifecyclePreparationWroteNoLearningData: () => false });
  assert.equal(boot.kind, "blocking");
});

test("a background sync interrupted inside the apply keeps the T2.0 guarantees: the next start is online and recovers", async () => {
  // A device whose sync must replace local evidence (history from another device).
  const backend = new FakeAccountBackend();
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("other-device", 4);
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  install(new ObservedStorage());
  await prepareBoundAccount();
  await addHistory("this-device", 12);
  assert.equal(await isLocalFirstAccountStartEligible(ACCOUNT_ID), true, "before the sync the device starts local-first");
  const before = storage.clone();
  storage.resetCounters();
  assert.equal((await retryAccountDataSync(backend.api(), ACCOUNT_ID)).status, "synced");
  const mutations = [...storage.mutations];
  const marker = mutations.findIndex((operation) => operation.endsWith("[remote-apply marker]"));
  assert.ok(marker > 0);

  // The deferred startup sync is killed halfway through the apply.
  const device = before.clone();
  install(device);
  device.killAfter = marker + Math.floor((mutations.length - marker) / 2);
  await loadAccountDataSession(backend.api(), ACCOUNT_ID).catch(() => undefined);
  device.restart();

  assert.equal(await isLocalFirstAccountStartEligible(ACCOUNT_ID), false, "an interrupted apply never reopens the partial local copy on Today");
  const boot = await bootstrapApplication(async () => undefined, async () => undefined);
  assert.equal(boot.kind, "ready", boot.kind === "blocking" ? boot.reason : boot.kind);
  assert.equal((await loadAccountDataSession(backend.api(), ACCOUNT_ID)).status, "synced");
  assert.equal((await getAccountSyncState(productionLearningDataAdmissionContext)).materialization, null);
  assert.deepEqual(await localRecordKeys(), remoteRecordKeys(backend), "the local copy equals the account copy");
  assert.equal(await isLocalFirstAccountStartEligible(ACCOUNT_ID), true, "after recovery the next start is local-first again");
  assert.doesNotThrow(() => assertTrainingEvidenceIntegrity(productionTrackAdmissionContext));
});
