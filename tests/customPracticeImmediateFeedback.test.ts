import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceAlgorithmsPracticeSession,
  completeAlgorithmsPracticeSession,
  getAlgorithmsPracticeProjection,
  getAlgorithmsPracticeSummaryProjection,
  retryAlgorithmsPracticeCompletionCheckpoint,
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
} from "../src/application/coding-interview";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { getCodingPackageTestCatalog } from "./contentPackageRuntimeTestSupport";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getActiveMutationJournal, getActiveTrainingSession, getTrainingAttempts, getTrainingSessionResult } from "../src/storage/repositories";
import { isAlgorithmChoiceQuestion, isAlgorithmComplexityQuestion, isAlgorithmOrderingQuestion } from "../src/tracks/coding-interview/algorithmQuestionTypes";
import type { AlgorithmResponse } from "../src/tracks/coding-interview/domain";
import { installMemoryStorage } from "./journalTestSupport";

const NOW = "2026-01-08T00:00:00.000Z";

function correctResponse(item: ReturnType<ReturnType<typeof getCodingPackageTestCatalog>["getItems"]>[number]): AlgorithmResponse {
  if (isAlgorithmChoiceQuestion(item)) return { kind: "choice", selectedOptionIds: item.interaction.acceptedOptionIds };
  if (isAlgorithmOrderingQuestion(item)) return { kind: "ordering", orderedSubgoalIds: item.interaction.canonicalOrder };
  if (isAlgorithmComplexityQuestion(item)) return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(item.interaction.checkedDimensions.map((dimension) => [dimension, item.interaction.acceptedValuesByDimension[dimension]![0]!])) };
  throw new Error("Unsupported test item interaction.");
}

test("Custom Practice afterEachAnswer journals each submitted response, exposes immediate feedback, advances, and finalizes one summary", async () => {
  await prepareBundledTestPackages();
  const storage = installMemoryStorage();
  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
  const catalog = getCodingPackageTestCatalog();
  const prepared = await startAlgorithmsSession({
    feedbackMode: "afterEachAnswer",
    modeId: "coding-interview-custom-practice",
    requestedLength: 10,
    scope: { roadmapNodeId: catalog.getItems()[0]!.taxonomy.roadmapNodeId },
  });

  storage.resetCounters();
  for (let index = 0; index < prepared.session.actualLength; index += 1) {
    const before = await getAlgorithmsPracticeProjection();
    assert.equal(before.position.current, index + 1);
    assert.equal(before.feedback, null);

    await submitAlgorithmsPracticeResponse(correctResponse(catalog.getItemById(before.item.itemId)));

    const feedback = await getAlgorithmsPracticeProjection();
    assert.equal(feedback.operation.kind, "feedback");
    assert.equal(feedback.response?.source, "materialized");
    assert.ok(feedback.feedback);
    assert.equal(await getActiveMutationJournal(), null);
    assert.ok(storage.operations.some((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL));
    assert.ok(storage.operations.some((operation) => operation.kind === "remove" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL));

    if (index < prepared.session.actualLength - 1) {
      const next = await advanceAlgorithmsPracticeSession();
      assert.equal(next.currentItemIndex, index + 1);
      storage.resetCounters();
    }
  }

  const finalFeedback = await getAlgorithmsPracticeProjection();
  assert.equal(finalFeedback.operation.kind, "feedback");
  assert.equal(finalFeedback.position.current, finalFeedback.position.total);
  assert.equal((await getActiveTrainingSession())?.id, prepared.session.id);
  assert.equal(await getTrainingSessionResult(prepared.session.id), null);
  assert.equal((await getTrainingAttempts()).value.length, 10);

  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL });
  const checkpointFailure = await completeAlgorithmsPracticeSession();
  assert.deepEqual(checkpointFailure, { expectedSessionId: prepared.session.id, kind: "retry_final_checkpoint" });
  assert.equal((await getActiveTrainingSession())?.id, prepared.session.id);
  assert.equal(await getTrainingSessionResult(prepared.session.id), null);
  storage.setFailurePlan(null);
  const restoredFeedback = await retryAlgorithmsPracticeCompletionCheckpoint(prepared.session.id);
  assert.equal(restoredFeedback.operation.kind, "feedback");
  assert.equal(restoredFeedback.response?.source, "materialized");

  storage.resetCounters();
  const [first, second] = await Promise.all([completeAlgorithmsPracticeSession(), completeAlgorithmsPracticeSession()]);
  assert.equal(first.kind, "verified");
  assert.equal(second.kind, "verified");
  if (first.kind !== "verified" || second.kind !== "verified") throw new Error("Expected both concurrent Finish taps to share verified completion.");
  assert.deepEqual(second.value, first.value);
  assert.equal(first.value.session.id, prepared.session.id);
  assert.equal(first.value.session.status, "completed");
  assert.equal(first.value.result.sessionId, prepared.session.id);
  assert.equal(first.value.result.totalOccurrences, 10);
  assert.equal(first.value.result.answeredOccurrenceIds.length, 10);
  assert.equal(first.value.result.unansweredOccurrenceIds.length, 0);
  assert.equal(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.trainingSessionResult(prepared.session.id)).length, 1);
  assert.equal((await getTrainingAttempts()).value.length, 10);
  assert.equal(await getActiveTrainingSession(), null);

  const reloaded = await getAlgorithmsPracticeSummaryProjection(prepared.session.id);
  assert.equal(reloaded.sessionId, first.value.session.id);
  assert.equal(reloaded.totalOccurrences, first.value.result.totalOccurrences);
  assert.deepEqual(reloaded.feedbackItems, []);
});
