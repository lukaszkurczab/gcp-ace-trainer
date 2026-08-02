import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceAlgorithmsPracticeSession,
  completeAlgorithmsPracticeSession,
  getAlgorithmsPracticeProjection,
  getAlgorithmsPracticeSummaryProjection,
  recoverAlgorithmsPracticeCompletion,
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
} from "../src/application/algorithms";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import {
  advanceCertificationPracticeSession,
  completeCertificationPracticeSession,
  getCertificationPracticeProjection,
  openCertificationPracticeSession,
  recoverCertificationPracticeCompletion,
  submitCertificationPracticeResponse,
} from "../src/application/certification";
import type { PracticeCompletionCommandResult, PracticeFinalization } from "../src/application/trainingLifecycle";
import { validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../src/infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../src/storage/keys";
import {
  getActiveForegroundTimer,
  getActiveMutationJournal,
  getActiveTrainingSession,
  getTrainingAttempts,
  getTrainingSessionResult,
  getTrainingSessions,
} from "../src/storage/repositories";
import type { CertificationQuestion } from "../src/tracks/cloud-certification";
import { isAlgorithmChoiceQuestion, isAlgorithmComplexityQuestion, isAlgorithmOrderingQuestion } from "../src/tracks/algorithms/algorithmQuestionTypes";
import type { AlgorithmResponse } from "../src/tracks/algorithms/domain";

const NOW = "2026-08-02T10:00:00.000Z";

type CompletionBoundary =
  | "journal_write"
  | "result_write"
  | "session_write"
  | "active_clear"
  | "session_verification"
  | "result_verification"
  | "journal_clear";

const BOUNDARIES: readonly Readonly<{
  name: CompletionBoundary;
  durableState: "not_durable" | "journal_durable" | "materialized" | "verified_pending_clear";
  command: "retry_completion" | "recover_completion";
}>[] = [
  { name: "journal_write", durableState: "not_durable", command: "retry_completion" },
  { name: "result_write", durableState: "journal_durable", command: "recover_completion" },
  { name: "session_write", durableState: "journal_durable", command: "recover_completion" },
  { name: "active_clear", durableState: "journal_durable", command: "recover_completion" },
  { name: "session_verification", durableState: "materialized", command: "recover_completion" },
  { name: "result_verification", durableState: "materialized", command: "recover_completion" },
  { name: "journal_clear", durableState: "verified_pending_clear", command: "recover_completion" },
] as const;

type CanonicalEnvelope = Readonly<{ payload?: unknown }>;

function envelopePayload(raw: string | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const envelope = JSON.parse(raw) as CanonicalEnvelope;
    return typeof envelope.payload === "object" && envelope.payload !== null && !Array.isArray(envelope.payload)
      ? envelope.payload as Record<string, unknown>
      : null;
  } catch { return null; }
}

/** Test-only storage that fails one exact completion-journal boundary, not the timer checkpoint before it. */
class CompletionFaultStorage extends MemoryKeyValueStorage {
  private boundary: CompletionBoundary | null = null;
  private sessionId: string | null = null;
  private failed = false;
  private postClearResultReadSessionId: string | null = null;

  arm(boundary: CompletionBoundary, sessionId: string): void {
    this.boundary = boundary;
    this.sessionId = sessionId;
    this.failed = false;
  }

  armPostClearResultRead(sessionId: string): void {
    this.postClearResultReadSessionId = sessionId;
    this.failed = false;
  }

  clearFault(): void { this.boundary = null; this.postClearResultReadSessionId = null; }

  override getString(key: string): string | undefined {
    if (!this.failed && this.postClearResultReadSessionId &&
      key === STORAGE_KEYS.trainingSessionResult(this.postClearResultReadSessionId) &&
      !this.snapshot().has(STORAGE_KEYS.ACTIVE_JOURNAL) &&
      !this.snapshot().has(STORAGE_KEYS.ACTIVE_TRAINING_SESSION)) {
      this.failed = true;
      throw new Error("Injected first post-clear result read failure.");
    }
    if (!this.failed && this.isCompletionJournal("materialized") && (
      (this.boundary === "session_verification" && key === STORAGE_KEYS.trainingSession(this.sessionId!)) ||
      (this.boundary === "result_verification" && key === STORAGE_KEYS.trainingSessionResult(this.sessionId!))
    )) this.failBoundary();
    return super.getString(key);
  }

  override setString(key: string, value: string): void {
    const payload = envelopePayload(value);
    if (!this.failed && (
      (this.boundary === "journal_write" && key === STORAGE_KEYS.ACTIVE_JOURNAL && payload?.operation === "complete_training_session" && payload.status === "journal_durable") ||
      (this.boundary === "result_write" && key === STORAGE_KEYS.trainingSessionResult(this.sessionId!)) ||
      (this.boundary === "session_write" && key === STORAGE_KEYS.trainingSession(this.sessionId!) && payload?.status === "completed")
    )) this.failBoundary();
    super.setString(key, value);
  }

  override remove(key: string): void {
    if (!this.failed && (
      (this.boundary === "active_clear" && key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION && this.isCompletionJournal()) ||
      (this.boundary === "journal_clear" && key === STORAGE_KEYS.ACTIVE_JOURNAL && this.isCompletionJournal("verified_pending_clear"))
    )) this.failBoundary();
    super.remove(key);
  }

  private isCompletionJournal(status?: string): boolean {
    const journal = envelopePayload(this.snapshot().get(STORAGE_KEYS.ACTIVE_JOURNAL));
    return journal?.operation === "complete_training_session" && (status === undefined || journal.status === status);
  }

  private failBoundary(): never {
    this.failed = true;
    throw new Error(`Injected completion fault at ${this.boundary}.`);
  }
}

type FinalFeedbackHarness = Readonly<{
  family: "algorithms" | "certification";
  storage: CompletionFaultStorage;
  sessionId: string;
  feedbackProjection: Readonly<{ operation: Readonly<{ kind: string }>; response: Readonly<{ source: string }> | null }>;
  attemptIds: readonly string[];
  complete(): Promise<PracticeCompletionCommandResult<PracticeFinalization>>;
  recover(expectedSessionId: string): Promise<PracticeFinalization>;
}>;

function correctAlgorithmResponse(item: ReturnType<ReturnType<typeof getAlgorithmContentCatalog>["getItems"]>[number]): AlgorithmResponse {
  if (isAlgorithmChoiceQuestion(item)) return { kind: "choice", selectedOptionIds: item.interaction.acceptedOptionIds };
  if (isAlgorithmOrderingQuestion(item)) return { kind: "ordering", orderedSubgoalIds: item.interaction.canonicalOrder };
  if (isAlgorithmComplexityQuestion(item)) return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(item.interaction.checkedDimensions.map((dimension) => [dimension, item.interaction.acceptedValuesByDimension[dimension]![0]!])) };
  throw new Error("Unsupported Algorithms interaction in completion handoff test.");
}

function correctCertificationResponse(question: CertificationQuestion) {
  return { kind: "option_selection" as const, selectedOptionIds: [...question.correctOptionIds] };
}

function installCompletionFixture(storage: CompletionFaultStorage, suffix: number): void {
  installKeyValueStorageForTests(storage);
  composeTrainingLifecycleUseCases({
    wallClock: { now: () => NOW },
    sessionIds: {
      async create({ trackId, modeId }) {
        return `${trackId}:${modeId}:00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
      },
    },
  });
}

async function algorithmsAtFinalFeedback(storage: CompletionFaultStorage, suffix: number): Promise<FinalFeedbackHarness> {
  installCompletionFixture(storage, suffix);
  const catalog = getAlgorithmContentCatalog();
  const prepared = await startAlgorithmsSession({
    feedbackMode: "afterEachAnswer",
    modeId: "algorithms-custom-practice",
    requestedLength: 10,
    scope: { roadmapNodeId: catalog.getItems()[0]!.taxonomy.roadmapNodeId },
  });
  for (let index = 0; index < prepared.session.actualLength; index += 1) {
    const projection = await getAlgorithmsPracticeProjection();
    await submitAlgorithmsPracticeResponse(correctAlgorithmResponse(catalog.getItemById(projection.item.itemId)));
    if (index < prepared.session.actualLength - 1) await advanceAlgorithmsPracticeSession();
  }
  const feedbackProjection = await getAlgorithmsPracticeProjection();
  assert.equal(feedbackProjection.operation.kind, "feedback");
  assert.equal(feedbackProjection.response?.source, "materialized");
  const attemptIds = (await getTrainingAttempts()).value.map((attempt) => attempt.id);
  return Object.freeze({
    family: "algorithms",
    storage,
    sessionId: prepared.session.id,
    feedbackProjection,
    attemptIds,
    complete: completeAlgorithmsPracticeSession,
    recover: recoverAlgorithmsPracticeCompletion,
  });
}

async function certificationAtFinalFeedback(storage: CompletionFaultStorage, suffix: number): Promise<FinalFeedbackHarness> {
  installCompletionFixture(storage, suffix);
  const opened = await openCertificationPracticeSession({ modeId: "certification-focus-practice", requestedLength: 10, domain: "setup_environment" });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") throw new Error("Certification completion fixture did not open.");
  let projection = await getCertificationPracticeProjection();
  while (true) {
    await submitCertificationPracticeResponse(correctCertificationResponse(projection.question));
    if (projection.ordinal === projection.total) break;
    await advanceCertificationPracticeSession();
    projection = await getCertificationPracticeProjection();
  }
  const feedbackProjection = await getCertificationPracticeProjection();
  assert.equal(feedbackProjection.operation.kind, "feedback");
  assert.equal(feedbackProjection.response?.source, "materialized");
  const attemptIds = (await getTrainingAttempts()).value.map((attempt) => attempt.id);
  return Object.freeze({
    family: "certification",
    storage,
    sessionId: opened.projection.session.id,
    feedbackProjection,
    attemptIds,
    complete: completeCertificationPracticeSession,
    recover: recoverCertificationPracticeCompletion,
  });
}

async function assertCompletionFaultMatrix(
  prepare: (storage: CompletionFaultStorage, suffix: number) => Promise<FinalFeedbackHarness>,
  suffixOffset: number,
): Promise<void> {
  for (const [index, boundary] of BOUNDARIES.entries()) {
    const storage = new CompletionFaultStorage();
    const harness = await prepare(storage, suffixOffset + index);
    const context = `${harness.family}:${boundary.name}`;
    assert.equal(Object.isFrozen(harness.feedbackProjection), true, context);
    assert.equal(harness.feedbackProjection.operation.kind, "feedback", context);
    assert.equal(harness.feedbackProjection.response?.source, "materialized", context);
    storage.resetCounters();
    storage.arm(boundary.name, harness.sessionId);

    const failed = await harness.complete();

    assert.equal(failed.kind, boundary.command, context);
    if (failed.kind !== "retry_completion" && failed.kind !== "recover_completion") throw new Error(`${context} returned early route success.`);
    assert.equal(failed.expectedSessionId, harness.sessionId, context);
    assert.equal(failed.operation.kind, "completion_failed", context);
    assert.equal(failed.operation.error.durableState, boundary.durableState, context);
    assert.equal(failed.operation.error.allowedAction, boundary.command === "retry_completion" ? "retry_same_command" : "recover", context);
    assert.deepEqual((await getTrainingAttempts()).value.map((attempt) => attempt.id), harness.attemptIds, context);
    assert.equal(harness.feedbackProjection.operation.kind, "feedback", context);
    assert.equal(harness.feedbackProjection.response?.source, "materialized", context);
    const journal = await getActiveMutationJournal();
    assert.equal(journal?.operation ?? null, boundary.command === "retry_completion" ? null : "complete_training_session", context);
    assert.equal(journal?.sessionId ?? null, boundary.command === "retry_completion" ? null : harness.sessionId, context);
    assert.equal(journal?.status ?? null, boundary.command === "retry_completion" ? null : boundary.durableState, context);
    const journalResultId = journal?.writes.find((write) => write.kind === "put_session_result")?.record.id ?? null;
    assert.equal(Boolean(journalResultId), boundary.command === "recover_completion", context);
    if (boundary.command === "retry_completion") {
      assert.equal((await getActiveTrainingSession())?.id, harness.sessionId, context);
      const retained = await (harness.family === "algorithms" ? getAlgorithmsPracticeProjection() : getCertificationPracticeProjection());
      assert.equal(retained.operation.kind, "completion_failed", context);
      assert.equal(retained.response?.source, "materialized", context);
      assert.ok(retained.feedback, context);
    }

    storage.clearFault();
    const verified = boundary.command === "retry_completion"
      ? await harness.complete()
      : Object.freeze({ kind: "verified" as const, value: await harness.recover(harness.sessionId) });
    assert.equal(verified.kind, "verified", context);
    assert.equal(verified.value.session.id, harness.sessionId, context);
    assert.equal(verified.value.result.sessionId, harness.sessionId, context);
    if (journalResultId) assert.equal(verified.value.result.id, journalResultId, context);
    assert.equal(await getActiveTrainingSession(), null, context);
    assert.equal(await getActiveMutationJournal(), null, context);
    assert.equal(await getActiveForegroundTimer(), null, context);
    assert.deepEqual((await getTrainingAttempts()).value.map((attempt) => attempt.id), harness.attemptIds, context);
    assert.equal((await getTrainingSessions()).value.find((session) => session.id === harness.sessionId)?.status, "completed", context);
    assert.equal((await getTrainingSessionResult(harness.sessionId))?.id, verified.value.result.id, context);
    assert.equal([...storage.snapshot().keys()].filter((key) => key.startsWith(STORAGE_KEYS.trainingSessionResult(""))).length, 1, context);
  }
}

test("Algorithms completion handoff classifies and recovers every real storage boundary", async () => {
  await validateBundledContent();
  await assertCompletionFaultMatrix(algorithmsAtFinalFeedback, 100);
});

test("Certification completion handoff classifies and recovers every real storage boundary", async () => {
  await validateBundledContent();
  await assertCompletionFaultMatrix(certificationAtFinalFeedback, 200);
});

test("Algorithms verified handoff survives the first summary projection read failure without a cache or completion fallback", async () => {
  await validateBundledContent();
  const storage = new CompletionFaultStorage();
  const harness = await algorithmsAtFinalFeedback(storage, 300);
  storage.armPostClearResultRead(harness.sessionId);

  const completed = await harness.complete();

  assert.equal(completed.kind, "verified");
  if (completed.kind !== "verified") throw new Error("Algorithms completion was not verified.");
  const routeSessionId = completed.value.session.id;
  assert.equal(routeSessionId, harness.sessionId);
  await assert.rejects(() => getAlgorithmsPracticeSummaryProjection(routeSessionId));
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(await getActiveMutationJournal(), null);
  storage.clearFault();
  assert.equal((await getAlgorithmsPracticeSummaryProjection(routeSessionId)).sessionId, routeSessionId);
});
