import assert from "node:assert/strict";
import test from "node:test";

import { AlgorithmsFamilyRuntime } from "../src/application/algorithms";
import type { ContentItemRef, ReviewQueueEntry } from "../src/domain";
import {
  ALGORITHM_MODE_IDS,
  AlgorithmContentCatalog,
  createAlgorithmsInterviewSimulationProfile,
  selectAlgorithmSessionPlan,
  type AlgorithmContentGroup,
  type AlgorithmQuestion,
} from "../src/tracks/algorithms";

const nodeIds = ["arrays_and_strings", "hash_map_and_set", "two_pointers"] as const;

function question(id: string, nodeId: string): AlgorithmQuestion {
  return {
    contentVersion: "v1", difficulty: "core", id, learningStage: "guided_application",
    options: [{ id: `${id}:yes`, isCorrect: true, text: "Yes" }, { id: `${id}:no`, isCorrect: false, text: "No" }],
    feedbackModel: { decisionSignal: "signal", mentalModelCorrection: "correction", mistakeTypes: [], nextAction: "next", result: "diagnostic" },
    primarySkillAtomId: nodeId === "two_pointers" ? "shared-mechanism" : nodeId,
    prompt: id, roadmapNodeId: nodeId, type: "single_choice",
  };
}

function catalog(count = 45): AlgorithmContentCatalog {
  const groups = nodeIds.map((nodeId, index) => ({
    id: nodeId, roadmapNodeId: nodeId,
    questions: Array.from({ length: index === 0 ? count : 8 }, (_, itemIndex) => question(`${nodeId}:${itemIndex}`, nodeId)),
  })) as readonly AlgorithmContentGroup[];
  return new AlgorithmContentCatalog(groups);
}

function ref(itemId: string): ContentItemRef { return { contentVersion: "v1", itemId, trackId: "algorithms" }; }

test("all seven Algorithms modes enforce declared lengths and deterministic boundaries", () => {
  const content = catalog();
  const simulation = createAlgorithmsInterviewSimulationProfile(["arrays_and_strings"]);
  const cases = [
    [ALGORITHM_MODE_IDS.learnApproach, 10, { mentalUnitId: "arrays_and_strings" }],
    [ALGORITHM_MODE_IDS.guidedPractice, 20, { mentalUnitId: "arrays_and_strings" }],
    [ALGORITHM_MODE_IDS.recognizePatterns, 10, { recognitionScope: ["arrays_and_strings"] }],
    [ALGORITHM_MODE_IDS.contrastPractice, 10, { contrastSet: ["arrays_and_strings", "hash_map_and_set"] }],
    [ALGORITHM_MODE_IDS.independentPractice, 10, { interleavedScope: ["arrays_and_strings", "hash_map_and_set"] }],
    [ALGORITHM_MODE_IDS.interviewSimulation, 40, { simulationProfile: simulation }],
  ] as const;
  for (const [mode, requestedLength, scope] of cases) {
    const first = selectAlgorithmSessionPlan({ contentCatalog: content, mode, scope, sessionLength: requestedLength });
    const second = selectAlgorithmSessionPlan({ contentCatalog: content, mode, scope, sessionLength: requestedLength });
    assert.equal(first.actualLength, requestedLength);
    assert.deepEqual(first.items.map((item) => item.id), second.items.map((item) => item.id));
    assert.equal(new Set(first.items.map((item) => item.id)).size, first.items.length);
  }
});

test("review sources remain sources, select eligible source first, and do not widen", () => {
  const content = catalog(2);
  const source = ref("arrays_and_strings:0");
  const review: ReviewQueueEntry = { consecutiveAfterDueSuccesses: 0, createdAt: "2026-07-15T08:00:00.000Z", dueAt: "2026-07-15T09:00:00.000Z", id: "review:source", persistent: true, reasons: ["incorrect"], sourceAttemptId: "attempt:source", sourceItem: source, sourceSessionId: "old", taxonomyOrSkillRefs: [], trackId: "algorithms" };
  const selection = selectAlgorithmSessionPlan({ contentCatalog: content, mode: ALGORITHM_MODE_IDS.weakAreaReview, now: "2026-07-15T10:00:00.000Z", reviewQueueItems: [review], reviewSource: "due_queue", sessionLength: 10 });
  assert.deepEqual(selection.items.map((item) => item.id), ["arrays_and_strings:0", "arrays_and_strings:1"]);
  assert.equal(selection.shorteningReason, "insufficient_compatible_content");
  assert.throws(() => selectAlgorithmSessionPlan({ contentCatalog: content, mode: ALGORITHM_MODE_IDS.weakAreaReview, sessionLength: 10 }), /requires due_queue or session_misses/);
  assert.throws(() => selectAlgorithmSessionPlan({ contentCatalog: content, mode: ALGORITHM_MODE_IDS.guidedPractice, sessionLength: 10 }), /requires one explicit mental unit/);
});

test("fixed simulation fails rather than shortening or widening", () => {
  assert.throws(() => selectAlgorithmSessionPlan({ contentCatalog: catalog(39), mode: ALGORITHM_MODE_IDS.interviewSimulation, scope: { simulationProfile: createAlgorithmsInterviewSimulationProfile(["arrays_and_strings"]) }, sessionLength: 40 }), /cannot prepare 40 unique items/);
  assert.throws(() => selectAlgorithmSessionPlan({ contentCatalog: catalog(), mode: ALGORITHM_MODE_IDS.interviewSimulation, scope: { simulationProfile: createAlgorithmsInterviewSimulationProfile(["arrays_and_strings"]) }, sessionLength: 20 }), /does not support requested length/);
});

test("recommendations are deterministic, explained, evidence-separated, and learner choice wins", () => {
  const runtime = new AlgorithmsFamilyRuntime(catalog());
  const evidence = {
    boundedEvidenceByMentalUnit: { b: 1, a: 1 }, currentMentalUnitId: "a",
    learningStageByMentalUnit: { a: "introduced" as const }, overdueReviewByMentalUnit: { b: 1, a: 1 },
    performanceSignals: { repeatedHighRiskMistakesByMentalUnit: { c: 2 }, strategyConfusionByMentalUnit: { d: 1 }, recognitionBottleneckByMentalUnit: { e: 1 } },
  };
  assert.deepEqual(runtime.recommend({ evidence }), runtime.recommend({ evidence }));
  assert.equal(runtime.recommend({ evidence }).modeId, ALGORITHM_MODE_IDS.weakAreaReview);
  assert.equal(runtime.recommend({ evidence: { ...evidence, overdueReviewByMentalUnit: {} }, learnerChoice: ALGORITHM_MODE_IDS.interviewSimulation }).reason, "learner_choice");
  assert.equal(runtime.recommend({ evidence: { ...evidence, overdueReviewByMentalUnit: {}, performanceSignals: {} } }).modeId, ALGORITHM_MODE_IDS.guidedPractice);
});
