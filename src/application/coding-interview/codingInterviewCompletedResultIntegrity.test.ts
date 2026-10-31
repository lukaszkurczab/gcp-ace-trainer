import assert from "node:assert/strict";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import {
  abandonAlgorithmsSession,
  advanceAlgorithmsPracticeSession,
  completeAlgorithmsPracticeSession,
  getAlgorithmsPracticeProjection,
  getAlgorithmsPracticeResultProjection,
  getAlgorithmsPracticeReviewProjection,
  getAlgorithmsPracticeSummaryProjection,
  recoverAlgorithmsPracticeCompletion,
  finalizeAlgorithmsSimulation,
  saveAlgorithmsSimulationResponseAndContinue,
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
  toCanonicalPracticeResponse,
} from "./codingInterviewSessionFacade";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { STORAGE_KEYS } from "../../storage/keys";
import type { ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import type { TrainingAttempt } from "../../domain";
import type { TrainingSession } from "../../domain";
import type { MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { getActiveTrainingSession, getTrainingSessionResult, getTrainingSessions, saveTrainingSession } from "../../storage/repositories";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { installForegroundSessionTimerFacade } from "../trainingLifecycle";
import type { ForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";

const dependencies = { premiumSessionAdmission: { authorize: async () => "allowed" as const } };
const sessionId = "completed-result-integrity-practice";

function correctResponse(item: ResolvedInteractionItem) {
  const review = item.interactions.presentReview(item.question.questionId, null);
  const model = review.model as { renderer: { kind: string; options?: readonly { id: string; selected: boolean }[]; elements?: readonly { id: string }[]; dimensions?: readonly { id: string; selectedValues: readonly string[] }[] } };
  if (model.renderer.kind === "choice") return { kind: "choice" as const, selectedOptionIds: model.renderer.options!.filter((option) => option.selected).map((option) => option.id) };
  if (model.renderer.kind === "ordering") return { kind: "ordering" as const, orderedSubgoalIds: model.renderer.elements!.map((element) => element.id) };
  if (model.renderer.kind === "complexity") return { kind: "complexity" as const, selectedValuesByDimension: Object.fromEntries(model.renderer.dimensions!.map((dimension) => [dimension.id, [...dimension.selectedValues]])) };
  throw new Error("The exact interaction has no review response fixture.");
}

function incorrectChoiceResponse(item: ResolvedInteractionItem) {
  for (const id of item.interactions.controlIds(item.question.questionId)) {
    const response = { type: "choice_single", optionId: id };
    const diagnostics = item.interactions.projectDiagnostics(item.question.questionId, response) as readonly { id: string; state: string }[];
    if (diagnostics.some((entry) => entry.id === id && entry.state === "incorrect")) return { kind: "choice" as const, selectedOptionIds: [id] };
  }
  throw new Error("The exact single-choice interaction has no incorrect option for this fixture.");
}

type CompletedPracticeOutput = Readonly<{
  storage: MemoryKeyValueStorage;
  session: TrainingSession;
  initialSession: TrainingSession;
  completion: Awaited<ReturnType<typeof completeAlgorithmsPracticeSession>>;
  result: NonNullable<Awaited<ReturnType<typeof getAlgorithmsPracticeResultProjection>>>;
}>;

async function completedPractice(reinsert?: boolean): Promise<CompletedPracticeOutput>;
async function completedPractice(reinsert: boolean, readFailure: Readonly<{ key: string; occurrence: number }>): Promise<Omit<CompletedPracticeOutput, "result"> & Readonly<{ result: null }>>;
async function completedPractice(reinsert = false, readFailure?: Readonly<{ key: string; occurrence: number }>): Promise<CompletedPracticeOutput | (Omit<CompletedPracticeOutput, "result"> & Readonly<{ result: null }>)> {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  composeTrainingLifecycleUseCases({ ...dependencies, sessionIds: { create: async () => sessionId } });
  const prepared = await startAlgorithmsSession({ modeId: reinsert ? "coding-interview-guided-practice" : "coding-interview-learn-approach", requestedLength: 10, source: "completed-result-integrity-test" });
  let finalSession = prepared.session;
  for (let index = 0; index < prepared.session.actualLength; index += 1) {
    const current = await getAlgorithmsPracticeProjection();
    const item = await contentPackageRuntimeOwner.resolveItem(current.item);
    let response = correctResponse(item);
    if (reinsert && index === 0) {
      if (item.question.interactionType !== "choice_single") throw new Error("Expected the authored first guided-practice question to be single choice.");
      response = incorrectChoiceResponse(item);
    }
    await submitAlgorithmsPracticeResponse(response);
    if (index < prepared.session.actualLength - 1) finalSession = await advanceAlgorithmsPracticeSession();
  }
  if (readFailure) {
    storage.resetCounters();
    storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", ...readFailure });
  }
  const completion = await completeAlgorithmsPracticeSession();
  storage.setFailurePlan(null);
  return { storage, session: finalSession, initialSession: prepared.session, completion, result: readFailure === undefined ? await getAlgorithmsPracticeResultProjection(sessionId) : null };
}

function restore(storage: MemoryKeyValueStorage, snapshot: ReadonlyMap<string, string>) {
  for (const [key, value] of snapshot) storage.setString(key, value);
  composeTrainingLifecycleUseCases(dependencies);
}

function readPayload(storage: MemoryKeyValueStorage, key: string): Record<string, any> {
  const raw = storage.getString(key);
  assert.ok(raw, `Expected stored value for ${key}`);
  return JSON.parse(raw).payload;
}

function updatePayload(storage: MemoryKeyValueStorage, key: string, update: (payload: any) => unknown) {
  const raw = storage.getString(key);
  assert.ok(raw, `Expected stored value for ${key}`);
  const envelope = JSON.parse(raw);
  storage.setString(key, JSON.stringify({ ...envelope, revision: envelope.revision + 1, payload: update(envelope.payload) }));
}

async function assertUnavailableWithoutWrites(storage: MemoryKeyValueStorage, targetSessionId = sessionId) {
  const before = storage.snapshot();
  await assert.rejects(getAlgorithmsPracticeResultProjection(targetSessionId), (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && error.code === "summary_unavailable");
  assert.deepEqual(storage.snapshot(), before);
  await assert.rejects(getAlgorithmsPracticeReviewProjection(targetSessionId, "not-a-real-occurrence"), (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && error.code === "summary_unavailable");
  assert.deepEqual(storage.snapshot(), before);
}

test("completed Coding practice is readable and review uses the same completed projection", async () => {
  const { result, session } = await completedPractice();
  assert.equal(result.completionKind, "completed");
  assert.equal(result.feedbackItems.length, 10);
  assert.deepEqual(result.answeredOccurrenceIds, session.itemOrder.map((item) => item.occurrenceId));
  assert.equal(result.feedbackItems.every((item) => item.correctness === "correct"), true);
  assert.equal(result.overallPointsEarned, result.score?.pointsEarned);
  const review = await getAlgorithmsPracticeReviewProjection(sessionId, result.feedbackItems[0]!.occurrenceId);
  assert.deepEqual(review, result);
});

test("by-ID completion recovery verifies the exact completed legacy session after the active pointer was cleared", async () => {
  const { storage, session, completion } = await completedPractice(false, { key: STORAGE_KEYS.trainingSessionResult(sessionId), occurrence: 10 });
  assert.equal(completion.kind, "recover_completion", "the actual result read failure is reported as recoverable completion");
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null, "materialization already cleared active ownership");
  assert.ok(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), "the exact completion journal remains available for recovery");
  const durableResult = await getTrainingSessionResult(session.id, productionTrackAdmissionContext);
  assert.ok(durableResult, "the exact result was materialized before later verification failed");

  const journalRaw = storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL)!;
  const preFixtureSnapshot = storage.snapshot();
  storage.remove(STORAGE_KEYS.ACTIVE_JOURNAL);
  const durableSession = (await getTrainingSessions(productionTrackAdmissionContext)).value.find(({ id }) => id === session.id)!;
  const foreignSessionId = "foreign-completed-recovery-session";
  const foreignSession = { ...durableSession, id: foreignSessionId };
  await saveTrainingSession(foreignSession, productionTrackAdmissionContext);
  const wrongTrackSessionId = "wrong-track-completed-recovery-session";
  const wrongTrackId = "google-cloud-associate-cloud-engineer";
  const wrongTrackSession = {
    ...durableSession,
    id: wrongTrackSessionId,
    trackId: wrongTrackId,
    itemOrder: durableSession.itemOrder.map((occurrence) => ({ ...occurrence, item: { ...occurrence.item, trackId: wrongTrackId } })),
  };
  await saveTrainingSession(wrongTrackSession, productionTrackAdmissionContext);
  storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, journalRaw);

  let timerReleaseCalls = 0;
  installForegroundSessionTimerFacade({ releaseAfterVerifiedPracticeCompletion() { timerReleaseCalls += 1; } } as unknown as ForegroundSessionTimerFacade);
  const pendingSnapshot = storage.snapshot();
  for (const [wrongId, expectedCode] of [["", "invalid_response"], ["different-completed-session-id", "resume_unavailable"], [foreignSessionId, "resume_unavailable"], [wrongTrackSessionId, "resume_unavailable"]] as const) {
    await assert.rejects(recoverAlgorithmsPracticeCompletion(wrongId), (error: unknown) =>
      typeof error === "object" && error !== null && "code" in error && error.code === expectedCode);
    assert.deepEqual(storage.snapshot(), pendingSnapshot, `invalid recovery ID ${JSON.stringify(wrongId)} must leave the foreign completion journal untouched`);
    assert.equal(timerReleaseCalls, 0, "rejected by-ID recovery cannot release a timer");
  }
  for (const key of storage.getAllKeys()) if (!preFixtureSnapshot.has(key)) storage.remove(key);
  for (const [key, value] of preFixtureSnapshot) storage.setString(key, value);
  const recovered = await recoverAlgorithmsPracticeCompletion(session.id);

  assert.deepEqual(recovered.result, durableResult, "by-ID recovery returns the same durable result, not a rebuilt substitute");
  assert.equal(recovered.session.id, session.id);
  assert.equal(recovered.session.status, "completed");
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), undefined, "the common lifecycle verified and cleared the exact completion journal");
  assert.equal(timerReleaseCalls, 1, "the timer is released only after exact lifecycle verification succeeds");
});

test("completed conditional-reinsert practice projects the final replaced occurrence order", async () => {
  const { session, initialSession, result } = await completedPractice(true);
  assert.equal(result.completionKind, "completed");
  assert.equal(result.feedbackItems.length, session.actualLength);
  assert.deepEqual(result.feedbackItems.map((item) => item.occurrenceId), session.itemOrder.map((item) => item.occurrenceId));
  assert.equal(session.itemOrder[4]?.item.questionId, initialSession.itemOrder[0]?.item.questionId);
  assert.notEqual(session.itemOrder[4]?.occurrenceId, initialSession.itemOrder[4]?.occurrenceId);
  assert.equal(result.feedbackItems.filter((item) => item.questionId === initialSession.itemOrder[0]?.item.questionId).length, 2);
  assert.equal(result.overallPointsEarned, result.score?.pointsEarned);
});

test("completed Coding practice carries canonical diagnostics for the committed wrong choice", async () => {
  const { result } = await completedPractice(true);
  const item = result.feedbackItems[0]!;
  assert.equal(item.correctness, "incorrect");
  const exactItem = await contentPackageRuntimeOwner.resolveItem(item.item);
  const response = incorrectChoiceResponse(exactItem);
  const projected = exactItem.interactions.projectFeedback(exactItem.question.questionId, toCanonicalPracticeResponse(exactItem.question.interactionType, response));
  const selectedIncorrectIds = item.controls.filter((control) => control.state === "incorrect").map((control) => control.id);
  const expected = projected?.messages?.filter((message) => message.kind === "wrong_option" && selectedIncorrectIds.includes(message.targetId));
  assert.ok(expected?.length, "the deterministic Coding fixture should include an authored wrong-option message");
  assert.deepEqual(item.messages, expected);
});

test("abandoned Coding summary keeps its separate existing projection and performs no read writes", async () => {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  composeTrainingLifecycleUseCases({ ...dependencies, sessionIds: { create: async () => "abandoned-summary-integrity" } });
  const prepared = await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10, source: "abandoned-summary-integrity-test" });
  const before = await getAlgorithmsPracticeProjection();
  const exactItem = await contentPackageRuntimeOwner.resolveItem(before.item);
  await submitAlgorithmsPracticeResponse(correctResponse(exactItem));
  const abandoned = await abandonAlgorithmsSession();
  assert.equal(abandoned.status, "abandoned");
  const stableSnapshot = storage.snapshot();

  const summary = await getAlgorithmsPracticeSummaryProjection(prepared.session.id);
  assert.equal(summary.completionKind, "abandoned");
  assert.equal(summary.sessionId, prepared.session.id);
  assert.equal(summary.totalOccurrences, prepared.session.actualLength);
  assert.deepEqual(summary.answeredOccurrenceIds, [prepared.session.itemOrder[0]!.occurrenceId]);
  assert.deepEqual(summary.unansweredOccurrenceIds, prepared.session.itemOrder.slice(1).map((item) => item.occurrenceId));
  assert.deepEqual(summary.feedbackItems, []);
  assert.equal(summary.score, null);
  assert.equal(summary.overallPointsEarned, null);
  assert.deepEqual(storage.snapshot(), stableSnapshot);
});

test("completed Mock result stays pending until exact saved content validation finishes", async () => {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const mockSessionId = "completed-mock-integrity-pending";
  composeTrainingLifecycleUseCases({ ...dependencies, sessionIds: { create: async () => mockSessionId } });
  const prepared = await startAlgorithmsSession({
    modeId: "coding-interview-simulation",
    requestedLength: 40,
    scope: { simulationProfileId: "algorithms-interview-simulation-v1" },
    source: "completed-result-integrity-pending-test",
  });
  const first = prepared.session.itemOrder[0]!;
  const exactItem = await contentPackageRuntimeOwner.resolveItem(first.item);
  await saveAlgorithmsSimulationResponseAndContinue({ occurrenceId: first.occurrenceId, response: correctResponse(exactItem) });
  await finalizeAlgorithmsSimulation();
  const stableSnapshot = storage.snapshot();

  let markEntered!: () => void;
  const entered = new Promise<void>((resolve) => { markEntered = resolve; });
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const originalResolver = contentPackageRuntimeOwner.resolveExactArtifact;
  contentPackageRuntimeOwner.resolveExactArtifact = async function (input) {
    markEntered();
    await barrier;
    return originalResolver.call(contentPackageRuntimeOwner, input);
  };
  try {
    let settled = false;
    const pendingProjection = getAlgorithmsPracticeResultProjection(mockSessionId).then((projection) => {
      settled = true;
      return projection;
    });
    await entered;
    await Promise.resolve();
    assert.equal(settled, false);
    assert.deepEqual(storage.snapshot(), stableSnapshot);

    release();
    const projection = await pendingProjection;
    assert.equal(projection.completionKind, "completed");
    assert.equal(projection.totalOccurrences, 40);
    assert.equal(projection.feedbackItems.length, 40);
    assert.deepEqual(projection.answeredOccurrenceIds, [first.occurrenceId]);
    assert.deepEqual(projection.unansweredOccurrenceIds, prepared.session.itemOrder.slice(1).map((item) => item.occurrenceId));
    assert.deepEqual(storage.snapshot(), stableSnapshot);
  } finally {
    release();
    contentPackageRuntimeOwner.resolveExactArtifact = originalResolver;
  }
});

test("completed result rejects a source-session attempt outside the saved occurrence plan", async () => {
  const { storage } = await completedPractice();
  const snapshot = storage.snapshot();
  const ids = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!).payload as string[];
  const sourceAttempt = readPayload(storage, STORAGE_KEYS.trainingAttempt(ids[0]!)) as TrainingAttempt<unknown>;
  restore(storage, snapshot);
  const orphan = {
    ...sourceAttempt,
    id: `${sourceAttempt.id}:orphan`,
    occurrenceId: "outside-the-completed-plan",
  };
  storage.setString(STORAGE_KEYS.trainingAttempt(orphan.id), JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: orphan }));
  // The attempt index is a canonical string array, so append the orphan directly.
  const rawIndex = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!);
  storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ ...rawIndex, revision: rawIndex.revision + 1, payload: [...rawIndex.payload, orphan.id] }));
  await assertUnavailableWithoutWrites(storage);
});

test("completed result rejects a removed attempt and a scorer/result mismatch", async () => {
  const { storage } = await completedPractice();
  const snapshot = storage.snapshot();
  const ids = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!).payload as string[];
  restore(storage, snapshot);
  updatePayload(storage, STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, () => ids.slice(1));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  const attempt = readPayload(storage, STORAGE_KEYS.trainingAttempt(ids[0]!));
  updatePayload(storage, STORAGE_KEYS.trainingAttempt(ids[0]!), (payload) => ({ ...payload, result: { ...attempt.result, kind: "incorrect", earnedPoints: 0 } }));
  await assertUnavailableWithoutWrites(storage);
});

test("completed result rejects a mismatched family, completion time, or answer coverage", async () => {
  const { storage } = await completedPractice();
  const snapshot = storage.snapshot();
  const resultKey = STORAGE_KEYS.trainingSessionResult(sessionId);
  restore(storage, snapshot);
  updatePayload(storage, resultKey, (payload) => ({ ...payload, evidence: { ...payload.evidence, familyId: "certification" } }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  updatePayload(storage, resultKey, (payload) => ({ ...payload, completedAt: "2000-01-01T00:00:00.000Z" }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  updatePayload(storage, resultKey, (payload) => ({ ...payload, answeredOccurrenceIds: payload.answeredOccurrenceIds.slice(1) }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  updatePayload(storage, resultKey, (payload) => ({ ...payload, sessionId: "another-session" }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  updatePayload(storage, resultKey, (payload) => ({ ...payload, totalOccurrences: payload.totalOccurrences - 1 }));
  await assertUnavailableWithoutWrites(storage);
});

test("completed result rejects attempts with a different mode or resolved item", async () => {
  const { storage } = await completedPractice();
  const snapshot = storage.snapshot();
  const ids = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!).payload as string[];
  const key = STORAGE_KEYS.trainingAttempt(ids[0]!);
  const attempt = readPayload(storage, key);
  restore(storage, snapshot);
  updatePayload(storage, key, (payload) => ({ ...payload, modeId: "coding-interview-review" }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  const foreignTrack = "google-cloud-associate-cloud-engineer";
  const foreignRef = { ...attempt.item, trackId: foreignTrack };
  updatePayload(storage, key, (payload) => ({ ...payload, trackId: foreignTrack, item: foreignRef, reviewEvidence: { ...payload.reviewEvidence, sourceItem: foreignRef } }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  const mismatchedItem = { ...attempt.item, questionId: `${attempt.item.questionId}:other` };
  updatePayload(storage, key, (payload) => ({ ...payload, item: mismatchedItem, reviewEvidence: { ...payload.reviewEvidence, sourceItem: mismatchedItem } }));
  await assertUnavailableWithoutWrites(storage);
});

test("completed result rejects duplicate attempts, invalid responses, and stale artifact references", async () => {
  const { storage } = await completedPractice();
  const snapshot = storage.snapshot();
  const ids = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!).payload as string[];
  const key = STORAGE_KEYS.trainingAttempt(ids[0]!);
  const attempt = readPayload(storage, key);
  restore(storage, snapshot);
  const duplicate = { ...attempt, id: `${attempt.id}:duplicate` };
  storage.setString(STORAGE_KEYS.trainingAttempt(duplicate.id), JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: duplicate }));
  const index = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!);
  storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ ...index, revision: index.revision + 1, payload: [...index.payload, duplicate.id] }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  updatePayload(storage, key, (payload) => ({ ...payload, response: { type: "choice_single" } }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  const staleRef = { ...attempt.item, artifactSha256: "b".repeat(64) };
  updatePayload(storage, key, (payload) => ({ ...payload, item: staleRef, reviewEvidence: { ...payload.reviewEvidence, sourceItem: staleRef } }));
  await assertUnavailableWithoutWrites(storage);
});

test("completed result rejects persisted counts and points that disagree with committed attempts", async () => {
  const { storage } = await completedPractice();
  const snapshot = storage.snapshot();
  const resultKey = STORAGE_KEYS.trainingSessionResult(sessionId);
  restore(storage, snapshot);
  updatePayload(storage, resultKey, (payload) => ({ ...payload, evidence: { ...payload.evidence, details: { ...payload.evidence.details, correctCount: 9 } } }));
  await assertUnavailableWithoutWrites(storage);

  restore(storage, snapshot);
  updatePayload(storage, resultKey, (payload) => ({ ...payload, evidence: { ...payload.evidence, details: { ...payload.evidence.details, pointsEarned: payload.evidence.details.pointsEarned + 1 } } }));
  await assertUnavailableWithoutWrites(storage);
});

test("completed result ignores valid attempts belonging to an unrelated session", async () => {
  const { storage, result } = await completedPractice();
  const snapshot = storage.snapshot();
  const ids = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!).payload as string[];
  const source = readPayload(storage, STORAGE_KEYS.trainingAttempt(ids[0]!)) as TrainingAttempt<unknown>;
  restore(storage, snapshot);
  const unrelated = { ...source, id: `${source.id}:unrelated`, sessionId: "another-session" };
  storage.setString(STORAGE_KEYS.trainingAttempt(unrelated.id), JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: unrelated }));
  const rawIndex = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!);
  storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ ...rawIndex, revision: rawIndex.revision + 1, payload: [...rawIndex.payload, unrelated.id] }));
  assert.deepEqual(await getAlgorithmsPracticeResultProjection(sessionId), result);
});
