import assert from "node:assert/strict";
import test from "node:test";

import {
  AlgorithmsFamilyRuntime,
  buildAlgorithmsInterviewSimulationTerminalProjection,
  classifyAlgorithmsRuntimeFailure,
  createAlgorithmsRuntimeDependencies,
  filterAlgorithmsInterviewSimulationReview,
  getAlgorithmsInterviewSimulationReviewDetail,
  inspectActiveAlgorithmsInterviewSimulation,
} from "../src/application/algorithms";
import { MissingContentItemError, type TrainingSession } from "../src/domain";
import { ALGORITHM_MODE_IDS, AlgorithmContentCatalog, isAlgorithmChoiceQuestion, type AlgorithmChoiceQuestion, type AlgorithmQuestion } from "../src/tracks/algorithms";
import { getActiveTrainingSession, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts } from "../src/storage/repositories";
import { installMemoryStorage } from "./journalTestSupport";

function choice(id: string, skill = `skill:${id}`): AlgorithmChoiceQuestion {
  return {
    contentVersion: "v1",
    difficulty: "core",
    feedbackModel: {
      decisionSignal: "signal",
      details: `details:${id}`,
      mentalModelCorrection: `reason:${id}`,
      mistakeTypes: ["mistake"],
      nextAction: `next:${id}`,
      result: "diagnostic",
    },
    id,
    learningStage: "guided_application",
    options: [{ id: `${id}:correct`, isCorrect: true, text: "Correct" }, { id: `${id}:wrong`, isCorrect: false, text: "Wrong" }],
    primarySkillAtomId: skill,
    prompt: `prompt:${id}`,
    roadmapNodeId: "arrays_and_strings",
    taxonomyRefs: [{ axisId: "pattern_family", nodeId: "arrays_and_strings", role: "primary" }],
    title: `title:${id}`,
    type: "single_choice",
  };
}

function harness(questions: readonly AlgorithmQuestion[]) {
  let tick = Date.parse("2026-07-15T10:00:00.000Z");
  const catalog = new AlgorithmContentCatalog([{ id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions }]);
  const dependencies = createAlgorithmsRuntimeDependencies({
    catalog: () => catalog,
    createSessionId: () => "projection-session",
    now: () => new Date(tick++).toISOString(),
    planOptionIds: (question) => isAlgorithmChoiceQuestion(question) ? question.options.map((option) => option.id) : [],
    select: () => questions,
  });
  return { catalog, dependencies };
}

function correct(question: AlgorithmChoiceQuestion) {
  return { kind: "choice" as const, selectedOptionIds: [question.options[0]!.id] };
}

function wrong(question: AlgorithmChoiceQuestion) {
  return { kind: "choice" as const, selectedOptionIds: [question.options[1]!.id] };
}

async function finalize(manual: boolean) {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`projection:${index}`, index < 2 ? "skill:shared" : `skill:${index}`));
  const { catalog, dependencies } = harness(questions);
  const runtime = new AlgorithmsFamilyRuntime(dependencies);
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  await runtime.saveSimulationResponse(started.session.itemOrder[0]!.occurrenceId, correct(questions[0]!));
  await runtime.saveSimulationResponse(started.session.itemOrder[1]!.occurrenceId, wrong(questions[1]!));
  await runtime.setSimulationFlag(started.session.itemOrder[1]!.occurrenceId, true);
  const terminal = await runtime.finalizeSimulation();
  const projection = buildAlgorithmsInterviewSimulationTerminalProjection({ session: terminal.session, attempts: (await getTrainingAttempts()).value, catalog });
  return { catalog, projection, terminal };
}

test("terminal projection derives finalization-only summary, review, flags, and a deterministic missed-skill recommendation", async () => {
  const { projection, terminal } = await finalize(true);
  assert.equal(terminal.session.status, "completed");
  assert.deepEqual(projection.points, { earned: 1, max: 40 });
  assert.deepEqual(projection.submittedAnswerAccuracy, { correct: 1, submitted: 2, ratio: 0.5 });
  assert.deepEqual(projection.completionRate, { answered: 2, total: 40, ratio: 0.05 });
  assert.deepEqual(projection.outcomes, { correct: 1, incorrect: 1, partial: 0, unanswered: 38 });
  assert.equal(projection.flags[0]?.index, 1);
  assert.equal(projection.missedRows.length, 1);
  assert.equal(projection.unansweredRows.length, 38);
  assert.equal(projection.recommendation.kind, "review_missed_primary_skill");
  assert.equal(projection.recommendation.primarySkillAtomId, "skill:shared");
  assert.equal(projection.recommendation.nextAction, "next:projection:1");
  assert.deepEqual(filterAlgorithmsInterviewSimulationReview(projection, "flagged").map((row) => row.index), [1]);
  const detail = getAlgorithmsInterviewSimulationReviewDetail(projection, projection.review.rows[1]!.occurrenceId);
  assert.deepEqual(detail.selectedResponse, { kind: "choice", optionIds: ["projection:1:wrong"] });
  assert.deepEqual(detail.correctResponse, { kind: "choice", optionIds: ["projection:1:correct"] });
  assert.equal(detail.reason, "reason:projection:1");
  assert.equal(detail.details, "details:projection:1");
  assert.ok(projection.mentalUnitBreakdown.some((row) => row.id === "arrays_and_strings"));
  assert.ok(projection.categoryBreakdown.some((row) => row.id === "pattern_family:arrays_and_strings"));
  assert.ok(projection.primarySkillBreakdown.some((row) => row.id === "skill:shared"));
  assert.equal("answerChanges" in (projection as unknown as Record<string, unknown>), false);
});

test("timeout finalization creates no fake unanswered attempts or review entries", async () => {
  const { projection } = await finalize(false);
  assert.equal(projection.outcomes.unanswered, 38);
  assert.equal(projection.unansweredRows.every((row) => row.selectedResponse === null && row.result === "unanswered"), true);
  const attempts = (await getTrainingAttempts()).value;
  const reviews = (await getReviewQueueItems()).value;
  assert.equal(attempts.length, 2);
  assert.equal(reviews.every((review) => attempts.some((attempt) => attempt.item.itemId === review.sourceItem.itemId)), true);
});

test("active discovery is scoring-blind and returns none, terminal, and conflicting-track states explicitly", async () => {
  installMemoryStorage();
  const questions = Array.from({ length: 40 }, (_, index) => choice(`active:${index}`));
  const { catalog, dependencies } = harness(questions);
  assert.deepEqual(inspectActiveAlgorithmsInterviewSimulation({ activeSession: null, activeDraft: null, catalog }), { kind: "none" });

  const runtime = new AlgorithmsFamilyRuntime(dependencies);
  const started = await runtime.start({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  await runtime.saveSimulationResponse(started.session.itemOrder[0]!.occurrenceId, correct(questions[0]!));
  const active = await getActiveTrainingSession();
  const draft = await getActiveTrainingSessionDraft();
  const discovered = inspectActiveAlgorithmsInterviewSimulation({ activeSession: active, activeDraft: draft, catalog });
  assert.equal(discovered.kind, "resumable");
  if (discovered.kind !== "resumable") throw new Error("expected resumable discovery");
  assert.deepEqual(discovered.resumeInput, { modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId: "arrays_and_strings" });
  assert.deepEqual(discovered.session.navigator.counts, { total: 40, unanswered: 39, partial: 0, complete: 1, flagged: 0 });
  assert.equal("feedback" in (discovered.session as unknown as Record<string, unknown>), false);
  assert.equal("correct" in (discovered.session as unknown as Record<string, unknown>), false);

  const terminal = { ...active!, currentItemIndex: 39, status: "completed" as const, completedAt: "2026-07-15T12:00:00.000Z" };
  const terminalInspection = inspectActiveAlgorithmsInterviewSimulation({ activeSession: terminal, activeDraft: draft, catalog });
  assert.equal(terminalInspection.kind, "unavailable");
  assert.equal(terminalInspection.kind === "unavailable" && terminalInspection.failure.kind, "session_invalid");

  const conflicting = { ...active!, trackId: "cloud-certification" } as unknown as TrainingSession;
  const conflictInspection = inspectActiveAlgorithmsInterviewSimulation({ activeSession: conflicting, activeDraft: draft, catalog });
  assert.equal(conflictInspection.kind, "unavailable");
  assert.equal(conflictInspection.kind === "unavailable" && conflictInspection.failure.kind, "session_invalid");
});

test("missing terminal content and known storage/content errors classify without a generic fallback", async () => {
  const { terminal } = await finalize(true);
  const incompleteCatalog = new AlgorithmContentCatalog([{ id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions: Array.from({ length: 39 }, (_, index) => choice(`projection:${index}`)) }]);
  assert.throws(() => buildAlgorithmsInterviewSimulationTerminalProjection({ session: terminal.session, attempts: [], catalog: incompleteCatalog }), MissingContentItemError);
  assert.deepEqual(classifyAlgorithmsRuntimeFailure(new MissingContentItemError("algorithms", "gone")).kind, "content_missing");
  assert.deepEqual(classifyAlgorithmsRuntimeFailure(new Error("content version does not match")).kind, "content_version_mismatch");
  assert.deepEqual(classifyAlgorithmsRuntimeFailure(new Error("unexpected")).disposition, "fatal");
});
