import assert from "node:assert/strict";
import test from "node:test";

import {
  AlgorithmsFamilyRuntime,
  type AlgorithmsDashboard,
} from "../src/application/algorithms";
import type { AlgorithmContentCatalog } from "../src/tracks/algorithms/algorithmContentCatalog";
import { ALGORITHM_MODE_IDS } from "../src/tracks/algorithms/domain";
import type { ReviewQueueEntry, TrainingAttempt, TrainingSession } from "../src/domain";
import { getTrackDisplay } from "../src/domain";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { buildHomeTabModel } from "../src/features/home/tabs/homeTabModel";
import { validateBundledContent } from "../src/content/application";

const NOW = "2026-07-20T12:00:00.000Z";
const MENTAL_UNIT = "binary_search_signal";
const TOPIC = "binary_search";

function runtime() {
  const catalog = {
    bank: {
      recognitionSets: [{
        itemIds: ["item-1"],
        setId: "binary-recognition",
        taxonomyScope: { mentalUnitIds: [MENTAL_UNIT] },
      }],
    },
    getItemById() { return { taxonomy: { roadmapNodeId: TOPIC } }; },
    getItemsForMentalUnit(mentalUnitId: string) {
      return mentalUnitId === MENTAL_UNIT ? [{ taxonomy: { roadmapNodeId: TOPIC } }] : [];
    },
    getSimulationProfile() { return undefined; },
  } as unknown as AlgorithmContentCatalog;
  return new AlgorithmsFamilyRuntime(catalog, undefined, "algorithms-taxonomy-v2");
}

function attempt(result: "correct" | "incorrect" = "correct"): TrainingAttempt<unknown> {
  return {
    answeredAt: NOW,
    committedAt: NOW,
    id: `attempt-${result}`,
    item: { contentVersion: "algorithms-core-0002", itemId: "item-1", trackId: "algorithms" },
    modeId: ALGORITHM_MODE_IDS.guidedPractice,
    occurrenceId: "occurrence-1",
    response: {},
    result: { earnedPoints: result === "correct" ? 1 : 0, kind: result, maxPoints: 1 },
    reviewEvidence: { sourceItem: { contentVersion: "algorithms-core-0002", itemId: "item-1", trackId: "algorithms" }, taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: MENTAL_UNIT, role: "primary" }] },
    sessionId: "session-1",
    trackId: "algorithms",
  };
}

function review(input: Readonly<{ dueAt: string; id: string; reason?: "wrong_pattern" | "wrong_strategy"; repeated?: boolean }>): ReviewQueueEntry {
  return {
    consecutiveAfterDueSuccesses: 0,
    createdAt: NOW,
    dueAt: input.dueAt,
    id: input.id,
    persistent: Boolean(input.repeated),
    reasons: input.repeated ? ["repeated_mistake"] : [input.reason ?? "incorrect"],
    sourceAttemptId: `attempt-${input.id}`,
    sourceItem: { contentVersion: "algorithms-core-0002", itemId: "item-1", trackId: "algorithms" },
    sourceSessionId: "session-1",
    taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: MENTAL_UNIT, role: "primary" }],
    trackId: "algorithms",
  };
}

async function dashboard(input: Readonly<{ attempts?: readonly TrainingAttempt<unknown>[]; reviews?: readonly ReviewQueueEntry[] }>): Promise<AlgorithmsDashboard> {
  return runtime().queryDashboard({ activeSession: null, attempts: input.attempts ?? [], now: NOW, reviews: input.reviews ?? [], trackId: "algorithms" });
}

function activeSession(): TrainingSession {
  return {
    configurationSnapshot: {},
    currentItemIndex: 0,
    id: "active-session",
    itemOrder: [{ item: { contentVersion: "algorithms-core-0002", itemId: "item-1", trackId: "algorithms" }, occurrenceId: "occurrence-1" }],
    modeId: ALGORITHM_MODE_IDS.guidedPractice,
    status: "active",
    trackId: "algorithms",
  } as unknown as TrainingSession;
}

test("Algorithms dashboard prioritizes due review and provides a complete review action", async () => {
  const value = await dashboard({ reviews: [review({ dueAt: "2026-07-20T11:00:00.000Z", id: "due" })] });
  assert.equal(value.recommendation.reason, "overdue_review");
  assert.deepEqual(value.recommendation.action, { kind: "start_practice", modeId: ALGORITHM_MODE_IDS.weakAreaReview, reviewSource: "due_queue", topicId: TOPIC });
});

test("Algorithms dashboard prioritizes repeated mistakes after overdue review and keeps its action explicit", async () => {
  const value = await dashboard({ reviews: [review({ dueAt: "2026-07-21T11:00:00.000Z", id: "one", repeated: true }), review({ dueAt: "2026-07-21T11:00:00.000Z", id: "two", repeated: true })] });
  assert.equal(value.recommendation.reason, "repeated_mistake");
  assert.deepEqual(value.recommendation.action, { kind: "start_practice", modeId: ALGORITHM_MODE_IDS.weakAreaReview, reviewSource: "due_queue", topicId: TOPIC });
});

test("Algorithms dashboard turns bounded evidence into a scoped guided-practice action", async () => {
  const value = await dashboard({ attempts: [attempt()] });
  assert.equal(value.recommendation.reason, "guided_practice");
  assert.equal(value.recommendation.explanation, "Practice Binary search signal with guidance before moving on.");
  assert.doesNotMatch(value.recommendation.explanation, /_/);
  assert.deepEqual(value.recommendation.action, { kind: "start_practice", modeId: ALGORITHM_MODE_IDS.guidedPractice, topicId: TOPIC });
});

test("Algorithms dashboard exposes the exact active session as a resume action", async () => {
  const value = await runtime().queryDashboard({ activeSession: activeSession(), attempts: [], now: NOW, reviews: [], trackId: "algorithms" });
  assert.equal(value.recommendation.reason, "active_session");
  assert.deepEqual(value.recommendation.action, { kind: "resume_active_session", modeId: ALGORITHM_MODE_IDS.guidedPractice, sessionId: "active-session", topicId: TOPIC });
});

test("Algorithms dashboard starts recognition only with its one declared set", async () => {
  const value = await dashboard({ reviews: [review({ dueAt: "2026-07-21T11:00:00.000Z", id: "pattern", reason: "wrong_pattern" })] });
  assert.deepEqual(value.recommendation.action, {
    kind: "start_practice",
    modeId: ALGORITHM_MODE_IDS.recognizePatterns,
    scope: { recognitionSetId: "binary-recognition" },
    topicId: TOPIC,
  });
});

test("Algorithms dashboard requires an explicit contrast or independent-practice scope", async () => {
  const contrast = await dashboard({ reviews: [review({ dueAt: "2026-07-21T11:00:00.000Z", id: "strategy", reason: "wrong_strategy" })] });
  assert.deepEqual(contrast.recommendation.action, { kind: "choose_declared_scope", modeId: ALGORITHM_MODE_IDS.contrastPractice, targetMentalUnitId: MENTAL_UNIT });
  const independent = await dashboard({});
  assert.deepEqual(independent.recommendation.action, { kind: "choose_declared_scope", modeId: ALGORITHM_MODE_IDS.independentPractice });
});

test("active session stays ahead of every later recommendation condition", () => {
  const value = runtime().recommend({ evidence: { activeSessionId: "session-1", boundedEvidenceByMentalUnit: { [MENTAL_UNIT]: 0 }, learningStageByMentalUnit: { [MENTAL_UNIT]: "unstable" }, overdueReviewByMentalUnit: { [MENTAL_UNIT]: 1 }, performanceSignals: { repeatedHighRiskMistakesByMentalUnit: { [MENTAL_UNIT]: 2 } } } });
  assert.equal(value.reason, "active_session");
});

test("Home disables an incomplete recommendation action instead of choosing a scope", async () => {
  await validateBundledContent();
  const model = buildHomeTabModel({
    activeTrack: getTrackDisplay("algorithms"),
    algorithmsDashboard: { recommendation: { action: { kind: "unavailable", reason: "An explicit scope is required." }, explanation: "Choose a scope.", modeId: ALGORITHM_MODE_IDS.independentPractice, reason: "independent_practice" } },
    analytics: buildAnalyticsData([], []),
    dashboardError: null,
    trainingAttempts: [],
  });
  assert.equal(model.recommendations[0]?.enabled, false);
  assert.equal(model.recommendations[0]?.unavailableReason, "An explicit scope is required.");
});
