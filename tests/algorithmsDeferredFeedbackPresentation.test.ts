import assert from "node:assert/strict";
import test from "node:test";

import {
  getAlgorithmsPracticeProjection,
  getAlgorithmsPracticeResultProjection,
} from "../src/application/algorithms";
import {
  installTrainingLifecycleUseCases,
  type TrainingLifecycleUseCases,
} from "../src/application/trainingLifecycle";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { validateBundledContent } from "../src/content/application";
import {
  createFamilyEnvelope,
  createTrainingAttempt,
  createTrainingSession,
  createTrainingSessionResult,
  type TrainingAttempt,
  type TrainingSession,
} from "../src/domain";
import {
  addTrainingAttempt,
  getActiveTrainingSession,
  saveTrainingSession,
} from "../src/storage/repositories";
import {
  isAlgorithmChoiceQuestion,
  submitAlgorithmInteraction,
  type AlgorithmResponse,
} from "../src/tracks/algorithms";
import { installMemoryStorage } from "./journalTestSupport";

const NOW = "2026-07-22T08:00:00.000Z";

function deferredSession(status: "active" | "completed"): Readonly<{ attempt: TrainingAttempt<AlgorithmResponse>; session: TrainingSession }> {
  const catalog = getAlgorithmContentCatalog();
  const question = catalog.getItems().find(isAlgorithmChoiceQuestion);
  if (!question) throw new Error("Deferred feedback fixture requires a choice question.");
  const item = catalog.toContentItemRef(question);
  const response: AlgorithmResponse = { kind: "choice", selectedOptionIds: question.interaction.acceptedOptionIds };
  const submitted = submitAlgorithmInteraction({ question, response });
  const session = createTrainingSession({
    id: "deferred-practice",
    trackId: "algorithms",
    modeId: "algorithms-custom-practice",
    configurationSnapshot: {
      answerChanges: "beforeSubmit",
      feedbackMode: "atSessionEnd",
      kind: "algorithmsPractice",
      navigation: "sequential",
      submission: "perItem",
      timer: "elapsedForeground",
    },
    requestedLength: 10,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "deferred-practice:occurrence:0", item }],
    optionOrderByOccurrence: { "deferred-practice:occurrence:0": question.interaction.options.map((option) => option.id) },
    conditionalReinsertSlots: [],
    activeForegroundMs: 0,
    contentVersion: item.contentVersion,
    taxonomyVersion: "algorithms-taxonomy-v2",
    planFingerprint: "a".repeat(64),
    status,
    startedAt: NOW,
    ...(status === "completed" ? { completedAt: NOW } : {}),
  });
  const attempt = createTrainingAttempt({
    id: "deferred-practice:attempt:0",
    sessionId: session.id,
    trackId: session.trackId,
    modeId: session.modeId,
    occurrenceId: session.itemOrder[0]!.occurrenceId,
    item,
    response,
    result: submitted.score.result,
    reviewEvidence: {
      sourceItem: item,
      taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: question.taxonomy.primaryMentalUnitId, role: "primary" }],
    },
    answeredAt: NOW,
    committedAt: NOW,
  });
  return { attempt, session };
}

test("deferred-feedback practice projection withholds correctness and authored feedback after a durable per-item attempt", async () => {
  await validateBundledContent();
  installMemoryStorage();
  const { attempt, session } = deferredSession("active");
  await saveTrainingSession(session);
  await addTrainingAttempt(attempt);
  installTrainingLifecycleUseCases({
    async getPendingMutationProjection() { return null; },
    async getPracticeOperationState() { return { family: "practice", kind: "feedback" } as const; },
  } as unknown as TrainingLifecycleUseCases);

  const projection = await getAlgorithmsPracticeProjection();
  assert.equal(projection.response?.value.kind, "choice");
  assert.equal(projection.feedback, null);
});

test("deferred-feedback summary reads timing, length, and authored feedback from completed durable records", async () => {
  await validateBundledContent();
  installMemoryStorage();
  const { attempt, session } = deferredSession("completed");
  const result = createTrainingSessionResult({
    id: `${session.id}:result`,
    sessionId: session.id,
    trackId: session.trackId,
    totalOccurrences: 1,
    answeredOccurrenceIds: [attempt.occurrenceId],
    unansweredOccurrenceIds: [],
    completedAt: NOW,
    evidence: createFamilyEnvelope({ familyId: "algorithms", details: { correctCount: 1, partialCount: 0, incorrectCount: 0, pointsEarned: attempt.result.earnedPoints, maxPoints: attempt.result.maxPoints } }),
  });
  await saveTrainingSession(session);
  await addTrainingAttempt(attempt);
  assert.equal(await getActiveTrainingSession(), null);
  installTrainingLifecycleUseCases({
    async loadSummary() { return result; },
    async queryHistory() { return [session]; },
  } as unknown as TrainingLifecycleUseCases);

  const projection = await getAlgorithmsPracticeResultProjection(session.id);
  assert.deepEqual(projection.configuration, { actualLength: 1, feedbackTiming: "atSessionEnd", requestedLength: 10 });
  assert.equal(projection.feedbackItems.length, 1);
  assert.equal(projection.feedbackItems[0]?.correctness, "correct");
  assert.ok(projection.feedbackItems[0]?.reason.length);
  assert.ok(projection.feedbackItems[0]?.details.length);
});
