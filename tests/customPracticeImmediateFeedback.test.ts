import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceAlgorithmsPracticeSession,
  completeAlgorithmsPracticeSession,
  getAlgorithmsPracticeProjection,
  getAlgorithmsPracticeResultProjection,
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
} from "../src/application/algorithms";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { validateBundledContent } from "../src/content/application";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getActiveMutationJournal, getActiveTrainingSession } from "../src/storage/repositories";
import { isAlgorithmChoiceQuestion, isAlgorithmComplexityQuestion, isAlgorithmOrderingQuestion } from "../src/tracks/algorithms/algorithmQuestionTypes";
import type { AlgorithmResponse } from "../src/tracks/algorithms/domain";
import { installMemoryStorage } from "./journalTestSupport";

const NOW = "2026-01-08T00:00:00.000Z";

function correctResponse(item: ReturnType<ReturnType<typeof getAlgorithmContentCatalog>["getItems"]>[number]): AlgorithmResponse {
  if (isAlgorithmChoiceQuestion(item)) return { kind: "choice", selectedOptionIds: item.interaction.acceptedOptionIds };
  if (isAlgorithmOrderingQuestion(item)) return { kind: "ordering", orderedSubgoalIds: item.interaction.canonicalOrder };
  if (isAlgorithmComplexityQuestion(item)) return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(item.interaction.checkedDimensions.map((dimension) => [dimension, item.interaction.acceptedValuesByDimension[dimension]![0]!])) };
  throw new Error("Unsupported test item interaction.");
}

test("Custom Practice afterEachAnswer journals each submitted response, exposes immediate feedback, advances, and finalizes one summary", async () => {
  await validateBundledContent();
  const storage = installMemoryStorage();
  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
  const catalog = getAlgorithmContentCatalog();
  const prepared = await startAlgorithmsSession({
    feedbackMode: "afterEachAnswer",
    modeId: "algorithms-custom-practice",
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

  const result = await completeAlgorithmsPracticeSession();
  assert.equal(result.sessionId, prepared.session.id);
  assert.equal(result.totalOccurrences, 10);
  assert.equal(result.answeredOccurrenceIds.length, 10);
  assert.equal(result.unansweredOccurrenceIds.length, 0);
  assert.deepEqual(result.feedbackItems, []);
  assert.equal(await getActiveTrainingSession(), null);

  const reloaded = await getAlgorithmsPracticeResultProjection(prepared.session.id);
  assert.deepEqual(reloaded, result);
});
