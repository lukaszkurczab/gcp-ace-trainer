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
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
} from "./codingInterviewSessionFacade";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { STORAGE_KEYS } from "../../storage/keys";
import type { Question } from "../../content/canonical/questionTypes";
import type { TrainingAttempt } from "../../domain";
import type { MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";

const dependencies = { premiumSessionAdmission: { authorize: async () => "allowed" as const } };
const sessionId = "completed-result-integrity-practice";

function correctResponse(question: Question) {
  switch (question.answer.type) {
    case "choice_single": return { kind: "choice" as const, selectedOptionIds: [question.answer.optionId] };
    case "choice_multiple": return { kind: "choice" as const, selectedOptionIds: question.answer.optionIds };
    case "ordering": return { kind: "ordering" as const, orderedSubgoalIds: question.answer.orderedElementIds };
    case "complexity":
    case "decision_matrix": return {
      kind: "complexity" as const,
      selectedValuesByDimension: Object.fromEntries(Object.entries(question.answer.selectedValueIdsByDimension).map(([id, values]) => [id, values[0]!])),
    };
  }
}

async function completedPractice(reinsert = false) {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  composeTrainingLifecycleUseCases({ ...dependencies, sessionIds: { create: async () => sessionId } });
  const prepared = await startAlgorithmsSession({ modeId: reinsert ? "coding-interview-guided-practice" : "coding-interview-learn-approach", requestedLength: 10, source: "completed-result-integrity-test" });
  let finalSession = prepared.session;
  for (let index = 0; index < prepared.session.actualLength; index += 1) {
    const current = await getAlgorithmsPracticeProjection();
    const question = await contentPackageRuntimeOwner.resolveItem(current.item);
    let response = correctResponse(question);
    if (reinsert && index === 0) {
      if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Expected the authored first guided-practice question to be single choice.");
      const correctOptionId = question.answer.optionId;
      const wrong = question.interaction.options.find((option) => option.optionId !== correctOptionId);
      if (!wrong) throw new Error("Expected an authored incorrect option.");
      response = { kind: "choice", selectedOptionIds: [wrong.optionId] };
    }
    await submitAlgorithmsPracticeResponse(response);
    if (index < prepared.session.actualLength - 1) finalSession = await advanceAlgorithmsPracticeSession();
  }
  await completeAlgorithmsPracticeSession();
  return { storage, session: finalSession, initialSession: prepared.session, result: await getAlgorithmsPracticeResultProjection(sessionId) };
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
  const review = await getAlgorithmsPracticeReviewProjection(sessionId, result.feedbackItems[0]!.occurrenceId);
  assert.deepEqual(review, result);
});

test("completed conditional-reinsert practice projects the final replaced occurrence order", async () => {
  const { session, initialSession, result } = await completedPractice(true);
  assert.equal(result.completionKind, "completed");
  assert.equal(result.feedbackItems.length, session.actualLength);
  assert.deepEqual(result.feedbackItems.map((item) => item.occurrenceId), session.itemOrder.map((item) => item.occurrenceId));
  assert.equal(session.itemOrder[4]?.item.questionId, initialSession.itemOrder[0]?.item.questionId);
  assert.notEqual(session.itemOrder[4]?.occurrenceId, initialSession.itemOrder[4]?.occurrenceId);
  assert.equal(result.feedbackItems.filter((item) => item.questionId === initialSession.itemOrder[0]?.item.questionId).length, 2);
});

test("abandoned Coding summary keeps its separate existing projection and performs no read writes", async () => {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  composeTrainingLifecycleUseCases({ ...dependencies, sessionIds: { create: async () => "abandoned-summary-integrity" } });
  const prepared = await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10, source: "abandoned-summary-integrity-test" });
  const before = await getAlgorithmsPracticeProjection();
  const question = await contentPackageRuntimeOwner.resolveItem(before.item);
  await submitAlgorithmsPracticeResponse(correctResponse(question));
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
  assert.deepEqual(storage.snapshot(), stableSnapshot);
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
