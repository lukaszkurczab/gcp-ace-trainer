import assert from "node:assert/strict";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getAlgorithmsPracticeProjection, getAlgorithmsPracticeResultProjection, getAlgorithmsPracticeReviewProjection, getAlgorithmsSimulationProjection, startAlgorithmsSession, submitAlgorithmsPracticeResponse, toCanonicalPracticeResponse, saveAlgorithmsSimulationResponseAndContinue, finalizeAlgorithmsSimulation, toggleAlgorithmsSimulationFlag } from "./codingInterviewSessionFacade";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import type { ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import type { AlgorithmResponse } from "../../tracks/coding-interview/domain";

const PROFILE_ID = "algorithms-interview-simulation-v1";

function correctResponse(item: ResolvedInteractionItem): AlgorithmResponse {
  const review = item.interactions.presentReview(item.question.questionId, null);
  const model = review.model as { renderer: { kind: string; options?: readonly { id: string; selected: boolean }[]; elements?: readonly { id: string }[]; dimensions?: readonly { id: string; selectedValues: readonly string[] }[] } };
  if (model.renderer.kind === "choice") return { kind: "choice", selectedOptionIds: model.renderer.options!.filter((option) => option.selected).map((option) => option.id) };
  if (model.renderer.kind === "ordering") return { kind: "ordering", orderedSubgoalIds: model.renderer.elements!.map((element) => element.id) };
  if (model.renderer.kind === "complexity") return { kind: "complexity", selectedValuesByDimension: Object.fromEntries(model.renderer.dimensions!.map((dimension) => [dimension.id, [...dimension.selectedValues]])) };
  throw new Error("The exact interaction has no review response fixture.");
}

function incorrectChoiceResponse(item: ResolvedInteractionItem) {
  for (const id of item.interactions.controlIds(item.question.questionId)) {
    const diagnostics = item.interactions.projectDiagnostics(item.question.questionId, { type: "choice_single", optionId: id }) as readonly { id: string; state: string }[];
    if (diagnostics.some((entry) => entry.id === id && entry.state === "incorrect")) return { kind: "choice" as const, selectedOptionIds: [id] };
  }
  throw new Error("The exact single-choice interaction has no incorrect option for this fixture.");
}

test("Coding Mock flags persist in the active draft and reappear after lifecycle resume", async () => {
  installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const dependencies = { premiumSessionAdmission: { authorize: async () => "allowed" as const } };
  composeTrainingLifecycleUseCases(dependencies);

  const prepared = await startAlgorithmsSession({
    modeId: "coding-interview-simulation",
    requestedLength: 40,
    scope: { simulationProfileId: PROFILE_ID },
    source: "flag-resume-integration-test",
  });
  const occurrenceId = prepared.session.itemOrder[0]!.occurrenceId;

  const flagged = await toggleAlgorithmsSimulationFlag(occurrenceId);
  assert.equal(flagged.durableDraftRevision, 2);
  assert.equal(flagged.navigator[0]?.flagged, true);
  const unflagged = await toggleAlgorithmsSimulationFlag(occurrenceId);
  assert.equal(unflagged.durableDraftRevision, 3);
  assert.equal(unflagged.navigator[0]?.flagged, false);
  const flaggedAgain = await toggleAlgorithmsSimulationFlag(occurrenceId);
  assert.equal(flaggedAgain.durableDraftRevision, 4);
  assert.equal(flaggedAgain.navigator[0]?.flagged, true);

  composeTrainingLifecycleUseCases(dependencies);
  const resumed = await getAlgorithmsSimulationProjection();
  assert.equal(resumed.session.id, prepared.session.id);
  assert.equal(resumed.durableDraftRevision, 4);
  assert.equal(resumed.navigator[0]?.flagged, true);
});

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
  assert.equal(result.feedbackItems.slice(1).every((item) => !("messages" in item)), true, "unanswered rows must not derive diagnostics from the answer-key control fallback");
  const answeredQuestion = await contentPackageRuntimeOwner.resolveItem(first.item);
  const correct = correctResponse(answeredQuestion);
  const canonicalCorrect = toCanonicalPracticeResponse(answeredQuestion.question.interactionType, correct);
  const projectedFeedback = answeredQuestion.interactions.projectFeedback(answeredQuestion.question.questionId, canonicalCorrect);
  if (projectedFeedback?.messages !== undefined) assert.deepEqual(result.feedbackItems[0]?.messages, []);
  else assert.equal("messages" in result.feedbackItems[0]!, false);
  assert.deepEqual(result.feedbackItems.map((item) => item.questionId), prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId));

  const review = await getAlgorithmsPracticeReviewProjection(prepared.session.id, result.feedbackItems[39]!.occurrenceId);
  assert.equal(review.feedbackItems.length, 40);
  assert.equal(review.feedbackItems[39]?.correctness, "unanswered");
  assert.equal(authorizationCount, 4);
});

test("Coding immediate practice feedback survives durable submit and lifecycle rebind", async () => {
  installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const dependencies = {
    sessionIds: { create: async () => "coding-feedback-delivery-rebind" },
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  };
  composeTrainingLifecycleUseCases(dependencies);
  await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10, source: "feedback-delivery-test" });

  const before = await getAlgorithmsPracticeProjection();
  assert.equal(before.feedback, null);
  const question = await contentPackageRuntimeOwner.resolveItem(before.item);
  if (question.question.interactionType !== "choice_single") throw new Error("Expected the actual Coding practice item to be single choice.");
  const wrongResponse = incorrectChoiceResponse(question);
  await submitAlgorithmsPracticeResponse(wrongResponse);

  const committed = await getAlgorithmsPracticeProjection();
  const canonicalWrong = toCanonicalPracticeResponse(question.question.interactionType, wrongResponse);
  assert.deepEqual(committed.response?.value, canonicalWrong);
  const expectedMessages = question.interactions.projectFeedback(question.question.questionId, canonicalWrong)?.messages;
  assert.ok(expectedMessages?.length);
  assert.deepEqual(committed.feedback?.messages, expectedMessages);
  assert.equal(committed.feedback?.correctness, "incorrect");

  composeTrainingLifecycleUseCases(dependencies);
  const rebound = await getAlgorithmsPracticeProjection();
  assert.deepEqual(rebound.response, committed.response);
  assert.deepEqual(rebound.feedback, committed.feedback);
});
