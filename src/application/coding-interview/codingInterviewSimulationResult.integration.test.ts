import assert from "node:assert/strict";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getAlgorithmsPracticeResultProjection, getAlgorithmsPracticeReviewProjection, getAlgorithmsSimulationProjection, startAlgorithmsSession, saveAlgorithmsSimulationResponseAndContinue, finalizeAlgorithmsSimulation } from "./codingInterviewSessionFacade";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import type { Question } from "../../content/canonical/questionTypes";
import type { AlgorithmResponse } from "../../tracks/coding-interview/domain";

const PROFILE_ID = "algorithms-interview-simulation-v1";

function correctResponse(question: Question): AlgorithmResponse {
  switch (question.answer.type) {
    case "choice_single": return { kind: "choice", selectedOptionIds: [question.answer.optionId] };
    case "choice_multiple": return { kind: "choice", selectedOptionIds: question.answer.optionIds };
    case "ordering": return { kind: "ordering", orderedSubgoalIds: question.answer.orderedElementIds };
    case "complexity":
    case "decision_matrix":
      return {
        kind: "complexity",
        selectedValuesByDimension: Object.fromEntries(Object.entries(question.answer.selectedValueIdsByDimension).map(([dimensionId, values]) => [dimensionId, values[0]!])),
      };
  }
}

test("Coding Mock persists a response, finalizes, and reads all 40 completed review rows", async () => {
  installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  let authorizationCount = 0;
  let exactResolutionCount = 0;
  composeTrainingLifecycleUseCases({
    sessionIds: { create: async () => "coding-mock-result-integration" },
    packages: {
      resolveForPreparation: (input) => contentPackageRuntimeOwner.resolveForPreparation(input),
      resolveExactArtifact: (input) => { exactResolutionCount += 1; return contentPackageRuntimeOwner.resolveExactArtifact(input); },
      resolveForDiscovery: (trackId, familyId) => contentPackageRuntimeOwner.resolveForDiscovery(trackId, familyId),
    },
    premiumSessionAdmission: { authorize: async () => { authorizationCount += 1; return "allowed"; } },
  });

  const prepared = await startAlgorithmsSession({
    modeId: "coding-interview-simulation",
    requestedLength: 40,
    scope: { simulationProfileId: PROFILE_ID },
    source: "integration-test",
  });
  assert.equal(prepared.session.itemOrder.length, 40);
  assert.equal(authorizationCount, 1);

  const projection = await getAlgorithmsSimulationProjection();
  assert.equal(projection.session.id, prepared.session.id);
  assert.equal(projection.navigator.length, 40);
  assert.equal(authorizationCount, 2);
  assert.equal(exactResolutionCount, 1);

  const first = prepared.session.itemOrder[0]!;
  const question = await contentPackageRuntimeOwner.resolveItem(first.item);
  const continued = await saveAlgorithmsSimulationResponseAndContinue({ occurrenceId: first.occurrenceId, response: correctResponse(question) });
  assert.equal(continued.position.current, 2);
  assert.equal(authorizationCount, 3);
  assert.equal(exactResolutionCount, 4);

  await finalizeAlgorithmsSimulation();
  assert.equal(authorizationCount, 4);
  assert.equal(exactResolutionCount, 5);

  const result = await getAlgorithmsPracticeResultProjection(prepared.session.id);
  assert.equal(result.completionKind, "completed");
  assert.equal(result.totalOccurrences, 40);
  assert.equal(result.feedbackItems.length, 40);
  assert.deepEqual(result.answeredOccurrenceIds, [first.occurrenceId]);
  assert.equal(result.unansweredOccurrenceIds.length, 39);
  assert.equal(result.feedbackItems[0]?.correctness, "correct");
  assert.equal(result.feedbackItems.slice(1).every((item) => item.correctness === "unanswered"), true);
  assert.deepEqual(result.feedbackItems.map((item) => item.questionId), prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId));

  const review = await getAlgorithmsPracticeReviewProjection(prepared.session.id, result.feedbackItems[39]!.occurrenceId);
  assert.equal(review.feedbackItems.length, 40);
  assert.equal(review.feedbackItems[39]?.correctness, "unanswered");
  assert.equal(authorizationCount, 4);
});
