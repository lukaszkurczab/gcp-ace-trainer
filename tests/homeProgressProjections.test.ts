import assert from "node:assert/strict";
import test from "node:test";
import type { ReviewQueueEntry, TrainingAttempt, TrainingSession } from "../src/domain";
import { getTrackDisplay } from "../src/domain";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { buildHomeTabModel } from "../src/features/home/tabs/homeTabModel";
import { buildProgressTabModel } from "../src/features/home/tabs/progressTabModel";
import {
  ALGORITHM_MODE_IDS,
  type AlgorithmQuestion,
} from "../src/tracks/coding-interview";
import { buildCloudCertificationProgressViewModel } from "../src/tracks/certification";
import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";

const NOW = "2026-07-28T12:00:00.000Z";

function codingPackage() {
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving");
  return {
    contentVersion: resolution.package.contentVersion,
    items: resolution.profile.items as readonly AlgorithmQuestion[],
    packagePin: resolution.package.packagePin,
  };
}

function algorithmAttempt(
  result: "correct" | "incorrect" = "correct",
  itemOverride?: AlgorithmQuestion,
): TrainingAttempt {
  const content = codingPackage();
  const item = itemOverride ?? content.items[0];
  assert.ok(item);
  const itemRef = {
    contentVersion: content.contentVersion, packagePin: content.packagePin,
    itemId: item.id,
    trackId: "coding-interview-dsa-problem-solving" as const,
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
    trackId: "coding-interview-dsa-problem-solving",
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
    trackId: "coding-interview-dsa-problem-solving",
  };
}

test("Home projection exposes a stable empty-state focus without inventing evidence", () => {
  const model = buildHomeTabModel({ activeTrack: getTrackDisplay("google-cloud-associate-cloud-engineer"), algorithmsDashboard: null, analytics: buildAnalyticsData([], []), dashboardError: null, trainingAttempts: [] });
  assert.equal(model.focusTitle, "Google Cloud Associate Cloud Engineer");
  assert.equal(model.primaryLabel, "Start learning");
});

test("Home prioritizes one exact ordinary Certification resume action and excludes exam or cross-track sessions", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const activeSession = {
    actualLength: 10,
    configurationSnapshot: {
      answerChanges: "none",
      domain: "setup_environment",
      feedbackMode: "afterEachAnswer",
      kind: "certificationFocusPractice",
      navigation: "linear",
      submission: "perItem",
      timer: "elapsedForeground",
    },
    id: "google-cloud-associate-cloud-engineer:certification-focus-practice:resume-1",
    modeId: "certification-focus-practice",
    requestedLength: 10,
    status: "active",
    trackId: "google-cloud-associate-cloud-engineer",
  } as unknown as TrainingSession;
  const input = {
    activeTrack: getTrackDisplay("google-cloud-associate-cloud-engineer"),
    algorithmsDashboard: null,
    analytics: buildAnalyticsData([], []),
    dashboardError: null,
    trainingAttempts: [],
  } as const;

  const model = buildHomeTabModel({ ...input, activeSession });
  assert.equal(model.recommendations.length, 1);
  assert.deepEqual(model.recommendations[0]?.action, {
    kind: "resume_certification_practice",
    modeId: "certification-focus-practice",
    sessionId: activeSession.id,
  });
  assert.equal(model.recommendations[0]?.title, "Continue Focus Practice");
  assert.match(model.recommendations[0]?.detail ?? "", /exact saved Focus Practice session/);

  assert.equal(buildHomeTabModel({ ...input, activeSession: { ...activeSession, modeId: "certification-exam-simulation" } }).recommendations.length, 0);
  assert.equal(buildHomeTabModel({ ...input, activeSession: { ...activeSession, trackId: "coding-interview-dsa-problem-solving" } }).recommendations.length, 0);

  const stale = buildHomeTabModel({
    ...input,
    activeSession: { ...activeSession, configurationSnapshot: { ...activeSession.configurationSnapshot, domain: undefined } } as unknown as TrainingSession,
  }).recommendations[0];
  assert.equal(stale?.enabled, false);
  assert.equal(stale?.action.kind, "unavailable");
  assert.match(stale?.title ?? "", /Saved Focus Practice session unavailable/);
  assert.match(stale?.detail ?? "", /incomplete and cannot be resumed/);
});

test("Progress tab projects Certification empty state and due review availability", () => {
  const analytics = buildAnalyticsData([], []);
  const packagePin = contentPackageRuntimeOwner.getPreparedDiscovery("google-cloud-associate-cloud-engineer").package.packagePin;
  const empty = buildProgressTabModel({ activeTrackId: "google-cloud-associate-cloud-engineer", analytics, attempts: [], practiceHistory: [], cloudProgress: buildCloudCertificationProgressViewModel({ attempts: [], packagePin }) });
  assert.equal(empty.hasData, false);
  assert.equal(empty.reviewActionEnabled, false);
  const due = buildProgressTabModel({ activeTrackId: "google-cloud-associate-cloud-engineer", analytics, attempts: [], practiceHistory: [], cloudProgress: { ...buildCloudCertificationProgressViewModel({ attempts: [], packagePin }), dueReviewCount: 2, scheduledReviewCount: 2 } });
  assert.equal(due.reviewQueueCount, 2);
  assert.deepEqual(due.reviewAction, { kind: "canonicalReviewQueue" });
});

test("Progress projection rejects an unknown track instead of selecting a default", () => {
  assert.throws(() => buildProgressTabModel({ activeTrackId: "unknown", analytics: buildAnalyticsData([], []), attempts: [], practiceHistory: [] }));
});

test("Algorithms Progress first use states the evidence limit and offers one useful start action", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const model = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
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
  assert.equal(model.nextTopic, null);
  assert.doesNotMatch(
    JSON.stringify(model),
    /\b(?:locked|mastery|retention|readiness)\b|score at least|to unlock/i,
  );
});

test("Algorithms Progress keeps due review evidence honest and recommendations overridable", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const attempt = algorithmAttempt("incorrect");
  const model = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
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
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const attempt = algorithmAttempt("correct");
  const model = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
    analytics: buildAnalyticsData([], []),
    attempts: [],
    practiceHistory: [],
    trainingAttempts: [attempt],
  }).algorithmsProgress;

  assert.ok(model);
  assert.equal(model.priority.label, "Recommended from recent practice");
  assert.equal(model.priority.primaryActionMode, ALGORITHM_MODE_IDS.guidedPractice);
  assert.equal(model.currentFocus.showProgress, true);
  const itemCount = codingPackage().items.filter((item) =>
    item.taxonomy.roadmapNodeId === model.currentFocus.nodeId,
  ).length;
  assert.equal(model.currentFocus.practicedLabel, `1 of ${itemCount}`);
  assert.doesNotMatch(JSON.stringify(model.currentFocus), /score|%/i);
  assert.match(model.priority.detail, /record[s]? evidence/i);
});

test("Algorithms Progress excludes due review from a stale content bank", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const attempt = algorithmAttempt("incorrect");
  const staleReview = {
    ...dueAlgorithmReview(attempt),
    sourceItem: {
      ...attempt.item,
      contentVersion: "algorithms-stale-bank",
      packagePin: { ...attempt.item.packagePin, contentReleaseId: "stale-release" },
    },
  };
  const model = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
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

test("Algorithms Progress ignores same-version evidence from another exact content package", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const attempt = algorithmAttempt("incorrect");
  const foreignAttempt = {
    ...attempt,
    item: { ...attempt.item, packagePin: { ...attempt.item.packagePin, packageIdentity: "a".repeat(64) } },
    reviewEvidence: { ...attempt.reviewEvidence, sourceItem: { ...attempt.item, packagePin: { ...attempt.item.packagePin, packageIdentity: "a".repeat(64) } } },
  };
  const foreignReview = dueAlgorithmReview(foreignAttempt);
  const model = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
    analytics: buildAnalyticsData([], []),
    attempts: [],
    now: NOW,
    practiceHistory: [],
    reviewQueueItems: [foreignReview],
    trainingAttempts: [foreignAttempt],
  });

  assert.equal(model.hasData, false);
  assert.equal(model.reviewQueueCount, 0);
  assert.equal(model.algorithmsProgress?.currentFocus.practicedLabel, "No attempts");
});

test("Algorithms Progress keeps due review copy scoped to the bundled package Free node", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const items = codingPackage().items;
  const first = items[0];
  assert.ok(first);
  const second = items[1];
  assert.ok(second);
  const firstAttempt = algorithmAttempt("correct", first);
  const secondAttempt = {
    ...algorithmAttempt("correct", second),
    id: "attempt-correct-second",
    occurrenceId: "occurrence-2",
    sessionId: "session-2",
  };
  const model = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
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
  assert.match(model.priority.detail, /2 items are due from earlier .* practice/i);
  assert.equal(first.taxonomy.roadmapNodeId, second.taxonomy.roadmapNodeId);
  assert.equal(model.roadmapSummary.allNodes.length, 1);
});
