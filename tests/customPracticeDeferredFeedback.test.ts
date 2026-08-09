import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceAlgorithmsPracticeSession,
  completeAlgorithmsPracticeSession,
  getAlgorithmsPracticeProjection,
  getAlgorithmsPracticeResultProjection,
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
} from "../src/application/coding-interview";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { getCodingPackageTestCatalog } from "./contentPackageRuntimeTestSupport";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";
import { isAlgorithmChoiceQuestion, isAlgorithmComplexityQuestion, isAlgorithmOrderingQuestion } from "../src/tracks/coding-interview/algorithmQuestionTypes";
import type { AlgorithmResponse } from "../src/tracks/coding-interview/domain";
import { installMemoryStorage } from "./journalTestSupport";

const NOW = "2026-01-08T00:00:00.000Z";

function responseFor(item: ReturnType<ReturnType<typeof getCodingPackageTestCatalog>["getItems"]>[number]): AlgorithmResponse {
  if (isAlgorithmChoiceQuestion(item)) {
    const wrong = item.interaction.options.find((option) => !item.interaction.acceptedOptionIds.includes(option.id));
    return { kind: "choice", selectedOptionIds: wrong ? [wrong.id] : item.interaction.acceptedOptionIds };
  }
  if (isAlgorithmOrderingQuestion(item)) return { kind: "ordering", orderedSubgoalIds: item.interaction.canonicalOrder };
  if (isAlgorithmComplexityQuestion(item)) return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(item.interaction.checkedDimensions.map((dimension) => [dimension, item.interaction.acceptedValuesByDimension[dimension]![0]!])) };
  throw new Error("Unsupported test item interaction.");
}

test("Custom Practice atSessionEnd withholds correctness, Reason, Details, and distractor explanations after every submit", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
  const catalog = getCodingPackageTestCatalog();
  const prepared = await startAlgorithmsSession({
    feedbackMode: "atSessionEnd",
    modeId: "coding-interview-custom-practice",
    requestedLength: 10,
    scope: { roadmapNodeId: catalog.getItems()[0]!.taxonomy.roadmapNodeId },
  });

  for (let index = 0; index < prepared.session.actualLength; index += 1) {
    const before = await getAlgorithmsPracticeProjection();
    await submitAlgorithmsPracticeResponse(responseFor(catalog.getItemById(before.item.itemId)));

    const submitted = await getAlgorithmsPracticeProjection();
    assert.equal(submitted.response?.source, "materialized");
    assert.equal(submitted.feedback, null);
    assert.doesNotMatch(
      JSON.stringify(submitted),
      /"correctness"|"reason"|"details"|"wrongOptionExplanations"|"omittedCorrectOptionExplanations"/,
    );

    if (index < prepared.session.actualLength - 1) await advanceAlgorithmsPracticeSession();
  }
});

test("Custom Practice atSessionEnd reloads its complete feedback from the canonical result after relaunch", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
  const catalog = getCodingPackageTestCatalog();
  const prepared = await startAlgorithmsSession({
    feedbackMode: "atSessionEnd",
    modeId: "coding-interview-custom-practice",
    requestedLength: 10,
    scope: { roadmapNodeId: catalog.getItems()[0]!.taxonomy.roadmapNodeId },
  });

  for (let index = 0; index < prepared.session.actualLength; index += 1) {
    const projection = await getAlgorithmsPracticeProjection();
    await submitAlgorithmsPracticeResponse(responseFor(catalog.getItemById(projection.item.itemId)));
    if (index < prepared.session.actualLength - 1) await advanceAlgorithmsPracticeSession();
  }
  await completeAlgorithmsPracticeSession();

  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });
  const reloaded = await getAlgorithmsPracticeResultProjection(prepared.session.id);
  assert.deepEqual(reloaded.configuration, { actualLength: 10, feedbackTiming: "atSessionEnd", requestedLength: 10 });
  assert.equal(reloaded.answeredOccurrenceIds.length, 10);
  assert.equal(reloaded.unansweredOccurrenceIds.length, 0);
  assert.equal(reloaded.feedbackItems.length, 10);
  assert.ok(reloaded.feedbackItems.every((item) => item.reason.length > 0 && item.details.blocks.length > 0));
});
