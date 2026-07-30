import assert from "node:assert/strict";
import test from "node:test";
import type { ReviewQueueEntry, TrainingAttempt } from "../src/domain";
import { getTrackDisplay } from "../src/domain";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { buildHomeTabModel } from "../src/features/home/tabs/homeTabModel";
import { buildProgressTabModel } from "../src/features/home/tabs/progressTabModel";
import {
  ALGORITHM_MODE_IDS,
  getAlgorithmItems,
} from "../src/tracks/algorithms";
import { buildCloudCertificationProgressViewModel } from "../src/tracks/cloud-certification";
import { validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";

const NOW = "2026-07-28T12:00:00.000Z";

function algorithmAttempt(
  result: "correct" | "incorrect" = "correct",
  itemOverride?: ReturnType<typeof getAlgorithmItems>[number],
): TrainingAttempt {
  const item = itemOverride ?? getAlgorithmItems()[0];
  assert.ok(item);
  const itemRef = {
    contentVersion: getAlgorithmContentCatalog().getContentVersion(),
    itemId: item.id,
    trackId: "algorithms" as const,
  };

  return {
    answeredAt: NOW,
    committedAt: NOW,
    id: `attempt-${result}`,
    item: itemRef,
    modeId: ALGORITHM_MODE_IDS.guidedPractice,
    occurrenceId: "occurrence-1",
    response: {},
    result: {
      earnedPoints: result === "correct" ? 1 : 0,
      kind: result,
      maxPoints: 1,
    },
    reviewEvidence: {
      sourceItem: itemRef,
      taxonomyOrSkillRefs: [{
        axisId: "mental_unit",
        nodeId: item.taxonomy.primaryMentalUnitId,
        role: "primary",
      }],
    },
    sessionId: "session-1",
    trackId: "algorithms",
  };
}

function dueAlgorithmReview(
  attempt: TrainingAttempt,
  options: Readonly<{ id?: string; persistent?: boolean }> = {},
): ReviewQueueEntry {
  const persistent = options.persistent ?? true;
  return {
    consecutiveAfterDueSuccesses: 0,
    createdAt: "2026-07-27T12:00:00.000Z",
    dueAt: "2026-07-28T11:00:00.000Z",
    id: options.id ?? "review-1",
    persistent,
    reasons: persistent ? ["incorrect", "repeated_mistake"] : ["incorrect"],
    sourceAttemptId: attempt.id,
    sourceItem: attempt.item,
    sourceSessionId: attempt.sessionId,
    taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs,
    trackId: "algorithms",
  };
}

test("Home projection exposes a stable empty-state focus without inventing evidence", () => {
  const model = buildHomeTabModel({ activeTrack: getTrackDisplay("cloud-certification"), algorithmsDashboard: null, analytics: buildAnalyticsData([], []), dashboardError: null, trainingAttempts: [] });
  assert.equal(model.focusTitle, "Google Cloud Associate Cloud Engineer");
  assert.equal(model.primaryLabel, "Start learning");
});

test("Progress tab projects Certification empty state and due review availability", () => {
  const analytics = buildAnalyticsData([], []);
  const empty = buildProgressTabModel({ activeTrackId: "cloud-certification", analytics, attempts: [], practiceHistory: [], cloudProgress: buildCloudCertificationProgressViewModel({ attempts: [] }) });
  assert.equal(empty.hasData, false);
  assert.equal(empty.reviewActionEnabled, false);
  const due = buildProgressTabModel({ activeTrackId: "cloud-certification", analytics, attempts: [], practiceHistory: [], cloudProgress: { ...buildCloudCertificationProgressViewModel({ attempts: [] }), dueReviewCount: 2, scheduledReviewCount: 2 } });
  assert.equal(due.reviewQueueCount, 2);
  assert.deepEqual(due.reviewAction, { kind: "canonicalReviewQueue" });
});

test("Progress projection rejects an unknown track instead of selecting a default", () => {
  assert.throws(() => buildProgressTabModel({ activeTrackId: "unknown", analytics: buildAnalyticsData([], []), attempts: [], practiceHistory: [] }));
});

test("Algorithms Progress first use states the evidence limit and offers one useful start action", async () => {
  await validateBundledContent();
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: buildAnalyticsData([], []),
    attempts: [],
    practiceHistory: [],
    trainingAttempts: [],
  }).algorithmsProgress;

  assert.ok(model);
  assert.equal(model.priority.label, "Get started");
  assert.equal(model.priority.primaryActionLabel, "Start practice");
  assert.equal(model.priority.secondaryAction, undefined);
  assert.equal(model.currentFocus.practicedLabel, "No attempts");
  assert.equal(model.currentFocus.skillEvidenceLabel, "No attempts");
  assert.equal(model.currentFocus.showProgress, false);
  assert.equal(model.roadmapSummary.allNodes[0]?.showProgress, false);
  assert.doesNotMatch(JSON.stringify(model.currentFocus), /score|%/i);
  assert.equal(model.nextTopic?.detail, "All roadmap topics are available. Choose this topic whenever it fits your practice goal.");
  assert.doesNotMatch(
    JSON.stringify(model),
    /\b(?:locked|mastery|retention|readiness)\b|score at least|to unlock/i,
  );
});

test("Algorithms Progress keeps due review evidence honest and recommendations overridable", async () => {
  await validateBundledContent();
  const attempt = algorithmAttempt("incorrect");
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: buildAnalyticsData([], []),
    attempts: [],
    now: NOW,
    practiceHistory: [],
    reviewQueueItems: [dueAlgorithmReview(attempt)],
    trainingAttempts: [attempt],
  }).algorithmsProgress;

  assert.ok(model);
  assert.equal(model.priority.label, "Repeated mistake");
  assert.equal(model.priority.primaryActionMode, ALGORITHM_MODE_IDS.weakAreaReview);
  assert.equal(model.priority.secondaryActionMode, ALGORITHM_MODE_IDS.guidedPractice);
  assert.equal(model.currentFocus.statusLabel, "Needs remediation");
  assert.match(model.currentFocus.explanation, /does not restrict other topics/i);
});

test("Algorithms Progress derives a deterministic continuation from recorded evidence", async () => {
  await validateBundledContent();
  const attempt = algorithmAttempt("correct");
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: buildAnalyticsData([], []),
    attempts: [],
    practiceHistory: [],
    trainingAttempts: [attempt],
  }).algorithmsProgress;

  assert.ok(model);
  assert.equal(model.priority.label, "Recommended from recent practice");
  assert.equal(model.priority.primaryActionMode, ALGORITHM_MODE_IDS.guidedPractice);
  assert.equal(model.currentFocus.showProgress, true);
  const itemCount = getAlgorithmItems().filter((item) =>
    item.taxonomy.roadmapNodeId === model.currentFocus.nodeId,
  ).length;
  assert.equal(model.currentFocus.practicedLabel, `1 of ${itemCount}`);
  assert.doesNotMatch(JSON.stringify(model.currentFocus), /score|%/i);
  assert.match(model.priority.detail, /record[s]? evidence/i);
});

test("Algorithms Progress excludes due review from a stale content bank", async () => {
  await validateBundledContent();
  const attempt = algorithmAttempt("incorrect");
  const staleReview = {
    ...dueAlgorithmReview(attempt),
    sourceItem: {
      ...attempt.item,
      contentVersion: "algorithms-stale-bank",
    },
  };
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: buildAnalyticsData([], []),
    attempts: [],
    now: NOW,
    practiceHistory: [],
    reviewQueueItems: [staleReview],
    trainingAttempts: [attempt],
  });

  assert.equal(model.reviewActionEnabled, false);
  assert.equal(model.reviewQueueCount, 0);
  assert.equal(model.algorithmsProgress?.priority.label, "Recommended from recent practice");
  assert.equal(model.algorithmsProgress?.currentFocus.statusLabel, "Practicing");
});

test("Algorithms Progress uses neutral copy when due review spans multiple topics", async () => {
  await validateBundledContent();
  const items = getAlgorithmItems();
  const first = items[0];
  assert.ok(first);
  const second = items.find((item) =>
    item.taxonomy.roadmapNodeId !== first.taxonomy.roadmapNodeId,
  );
  assert.ok(second);
  const firstAttempt = algorithmAttempt("correct", first);
  const secondAttempt = algorithmAttempt("correct", second);
  const model = buildProgressTabModel({
    activeTrackId: "algorithms",
    analytics: buildAnalyticsData([], []),
    attempts: [],
    now: NOW,
    practiceHistory: [],
    reviewQueueItems: [
      dueAlgorithmReview(firstAttempt, { id: "review-first", persistent: false }),
      dueAlgorithmReview(secondAttempt, { id: "review-second", persistent: false }),
    ],
    trainingAttempts: [firstAttempt, secondAttempt],
  }).algorithmsProgress;

  assert.ok(model);
  assert.equal(model.priority.title, "Return to due review");
  assert.match(model.priority.detail, /2 review items are due from earlier practice across multiple topics/i);
  const dueTopicTitles = model.roadmapSummary.allNodes
    .filter((node) =>
      node.id === first.taxonomy.roadmapNodeId ||
      node.id === second.taxonomy.roadmapNodeId,
    )
    .map((node) => node.title);
  for (const title of dueTopicTitles) {
    assert.doesNotMatch(model.priority.detail, new RegExp(title, "i"));
  }
});
