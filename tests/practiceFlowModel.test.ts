import assert from "node:assert/strict";
import test from "node:test";

import type { TrackRegistration, TrainingAttempt } from "../src/domain";
import {
  getTrackDisplay,
  UnknownTrackError,
  UnknownTrackFamilyError,
  UnsupportedTrackError,
} from "../src/domain";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import {
  buildPracticeStatsSummary,
  buildPracticeModes,
  buildTrackProgressPercent,
  buildTopicRoadmapNodes,
  getCurrentPracticeTopic,
  hasTrackProgress,
  resolvePracticeTopic,
  resolvePracticeFlowRegistration,
} from "../src/features/practice/practiceFlowModel";
import {
  formatPracticeStatsDetail,
  formatPracticeStatsTitle,
  formatPracticeTopicDetail,
  formatPracticeTopicTitle,
} from "../src/features/practice/practiceFlowPresentation";
import {
  ALGORITHM_MODE_IDS,
  getAlgorithmItems,
  getRoadmapNodesWithActiveItems,
} from "../src/tracks/coding-interview";
import { validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { translate } from "../src/preferences/translations";

function attemptForItem(
  item: ReturnType<typeof getAlgorithmItems>[number],
  answeredAt: string,
): TrainingAttempt {
  const itemRef = {
    contentVersion: getAlgorithmContentCatalog().getContentVersion(),
    itemId: item.id,
    trackId: "coding-interview-dsa-problem-solving" as const,
  };

  return {
    answeredAt,
    committedAt: answeredAt,
    id: `attempt-${item.id}`,
    item: itemRef,
    modeId: ALGORITHM_MODE_IDS.guidedPractice,
    occurrenceId: `occurrence-${item.id}`,
    response: {},
    result: { earnedPoints: 1, kind: "correct", maxPoints: 1 },
    reviewEvidence: {
      sourceItem: itemRef,
      taxonomyOrSkillRefs: [{
        axisId: "mental_unit",
        nodeId: item.taxonomy.primaryMentalUnitId,
        role: "primary",
      }],
    },
    sessionId: `session-${item.id}`,
    trackId: "coding-interview-dsa-problem-solving",
  };
}

test("Algorithms practice hub exposes only the three deliberate alternatives to Continue practice", () => {
  const modes = buildPracticeModes(getTrackDisplay("coding-interview-dsa-problem-solving"));

  assert.deepEqual(
    modes.map(({ mode, title }) => ({ mode, title })),
    [
      { mode: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review" },
      { mode: ALGORITHM_MODE_IDS.independentPractice, title: "Independent Practice" },
      { mode: ALGORITHM_MODE_IDS.interviewSimulation, title: "Interview Simulation" },
    ],
  );
});

test("Algorithms Independent Practice keeps its canonical title in the Polish presentation boundary", () => {
  assert.equal(translate("pl", "Independent Practice"), "Samodzielne ćwiczenia");
});

test("Certification practice hub exposes every declared mode, including the canonical Exam Simulation", () => {
  const modes = buildPracticeModes(getTrackDisplay("google-cloud-associate-cloud-engineer"));

  assert.deepEqual(
    modes.map(({ mode, title }) => ({ mode, title })),
    [
      { mode: "certification-diagnostic-baseline", title: "Diagnostic Baseline" },
      { mode: "certification-focus-practice", title: "Focus Practice" },
      { mode: "certification-scenario-practice", title: "Scenario Practice" },
      { mode: "certification-weak-area-review", title: "Weak Area Review" },
      { mode: "certification-mixed-practice", title: "Mixed Practice" },
      { mode: "certification-quick-review", title: "Quick Review" },
      { mode: "certification-exam-simulation", title: "Exam Simulation" },
    ],
  );
});

test("Certification practice presentation composes the concrete Google Cloud name through Polish translation", () => {
  const track = getTrackDisplay("google-cloud-associate-cloud-engineer");
  const analytics = buildAnalyticsData([], []);
  const topic = getCurrentPracticeTopic(track);
  const stats = buildPracticeStatsSummary({
    activeTrack: track,
    analytics,
    cloudProgress: null,
    trainingAttempts: [],
  });

  assert.equal(
    formatPracticeTopicDetail(topic.detail, (value) => translate("en", value)),
    "Scenario practice across the track domains: Google Cloud ACE",
  );
  assert.equal(
    formatPracticeTopicDetail(topic.detail, (value) => translate("pl", value)),
    "Ćwiczenia scenariuszowe w obszarach ścieżki: Google Cloud ACE",
  );
  assert.equal(
    formatPracticeTopicTitle(topic.title, (value) => translate("pl", value)),
    "Planowanie i wdrażanie",
  );
  assert.equal(
    formatPracticeStatsTitle(stats, (value) => translate("pl", value)),
    "Google Cloud ACE — Statystyki",
  );
  assert.equal(
    formatPracticeStatsDetail(stats.detail, (value) => translate("pl", value)),
    "Postęp, słabe obszary i lokalna historia ćwiczeń.",
  );
  assert.doesNotMatch(
    JSON.stringify({ modes: buildPracticeModes(track), stats, topic }),
    /Cloud Certification/,
  );
});

test("Algorithms practice topic and statistics compose through Polish translation", async () => {
  await validateBundledContent();
  const track = getTrackDisplay("coding-interview-dsa-problem-solving");
  const stats = buildPracticeStatsSummary({
    activeTrack: track,
    analytics: buildAnalyticsData([], []),
    trainingAttempts: [],
  });
  const topic = getCurrentPracticeTopic(track);
  const pl = (value: string) => translate("pl", value);

  assert.equal(
    formatPracticeTopicDetail(topic.detail, pl),
    "Ćwiczenia z rozwiązywania problemów algorytmicznych według mapy tematów.",
  );
  assert.equal(formatPracticeStatsTitle(stats, pl), "Rozmowa techniczna — Statystyki");
  assert.equal(
    formatPracticeStatsDetail(stats.detail, pl),
    "0 poprawnych, 0 częściowych, 0 niepoprawnych.",
  );
});

test("route-selected Algorithms topic preserves authored copy and translates only structured 0/158 and 0/8 labels", async () => {
  await validateBundledContent();
  const roadmapTopic = buildTopicRoadmapNodes({
    activeTrackId: "coding-interview-dsa-problem-solving",
    trainingAttempts: [],
  }).find((candidate) =>
    candidate.detail.kind === "algorithm-progress" &&
    candidate.detail.itemCount === 158 &&
    candidate.detail.skillCount === 8
  );
  assert.ok(roadmapTopic);

  const topic = resolvePracticeTopic({
    activeTrackId: "coding-interview-dsa-problem-solving",
    routeTopicId: roadmapTopic.id,
    trainingAttempts: [],
  });
  const translatedKeys: string[] = [];
  const pl = (value: string) => {
    translatedKeys.push(value);
    return translate("pl", value);
  };

  assert.equal(topic.detail.kind, "algorithm-progress");
  assert.equal(
    formatPracticeTopicDetail(topic.detail, pl),
    `${roadmapTopic.detail.description} 0/158 przećwiczonych. Przećwiczone umiejętności: 0/8.`,
  );
  assert.deepEqual(translatedKeys, ["practiced", "Skills tried"]);
  assert.deepEqual(
    topic.title,
    { kind: "authored", value: roadmapTopic.title },
  );

  translatedKeys.length = 0;
  assert.equal(formatPracticeTopicTitle(topic.title, pl), roadmapTopic.title);
  assert.deepEqual(translatedKeys, []);
});

test("shared practice presentation rejects an unknown track instead of substituting another track", () => {
  const analytics = buildAnalyticsData([], []);
  const unknownTrack = {
    ...getTrackDisplay("coding-interview-dsa-problem-solving"),
    familyId: "unregistered-family",
    id: "unregistered-track",
  };
  const operations = [
    () => getCurrentPracticeTopic(unknownTrack),
    () => hasTrackProgress({
      activeTrackId: unknownTrack.id,
      analytics,
      trainingAttempts: [],
    }),
    () => buildPracticeModes(unknownTrack),
    () => buildPracticeStatsSummary({
      activeTrack: unknownTrack,
      analytics,
      trainingAttempts: [],
    }),
    () => buildTrackProgressPercent({
      activeTrackId: unknownTrack.id,
      analytics,
      trainingAttempts: [],
    }),
    () => buildTopicRoadmapNodes({
      activeTrackId: unknownTrack.id,
      trainingAttempts: [],
    }),
  ];

  for (const operation of operations) {
    assert.throws(operation, UnknownTrackError);
  }
});

test("practice presentation rejects unknown families and unsupported registered family members explicitly", () => {
  const metadata = getTrackDisplay("google-cloud-associate-cloud-engineer");
  const registration = (
    id: string,
    familyId: string,
  ): TrackRegistration => ({
    familyId,
    id,
    metadata: {
      accentColor: metadata.accentColor,
      accentMutedColor: metadata.accentMutedColor,
      description: metadata.description,
      shortTitle: metadata.shortTitle,
      status: metadata.status,
      title: metadata.title,
    },
  });

  assert.throws(
    () => resolvePracticeFlowRegistration(
      registration("unregistered-track", "unregistered-family"),
    ),
    UnknownTrackFamilyError,
  );
  assert.throws(
    () => resolvePracticeFlowRegistration(
      registration("unregistered-certification", "certification"),
    ),
    UnsupportedTrackError,
  );
});

test("every Algorithms roadmap topic with active items remains directly selectable", async () => {
  await validateBundledContent();
  const topics = buildTopicRoadmapNodes({
    activeTrackId: "coding-interview-dsa-problem-solving",
    trainingAttempts: [],
  });

  assert.deepEqual(
    topics.map((topic) => topic.id),
    getRoadmapNodesWithActiveItems().map((node) => node.id),
  );
  assert.ok(topics.length > 1);
  assert.ok(topics.every((topic) =>
    topic.status === "current" || topic.status === "available",
  ));
  assert.equal(topics.filter((topic) => topic.label === "Recommended").length, 1);
  assert.ok(topics.filter((topic) => topic.status === "available").every((topic) =>
    topic.label === "Available",
  ));
  assert.doesNotMatch(JSON.stringify(topics), /\b(?:locked|mastery|retention|readiness)\b/i);
});

test("Algorithms roadmap distinguishes practiced topics from untouched available topics", async () => {
  await validateBundledContent();
  const items = getAlgorithmItems();
  const first = items[0];
  assert.ok(first);
  const second = items.find((item) =>
    item.taxonomy.roadmapNodeId !== first.taxonomy.roadmapNodeId,
  );
  assert.ok(second);

  const topics = buildTopicRoadmapNodes({
    activeTrackId: "coding-interview-dsa-problem-solving",
    trainingAttempts: [
      attemptForItem(first, "2026-07-28T10:00:00.000Z"),
      attemptForItem(second, "2026-07-28T11:00:00.000Z"),
    ],
  });
  const earlierTopic = topics.find((topic) =>
    topic.id === first.taxonomy.roadmapNodeId,
  );
  const currentTopic = topics.find((topic) =>
    topic.id === second.taxonomy.roadmapNodeId,
  );

  assert.equal(earlierTopic?.status, "available");
  assert.equal(earlierTopic?.label, "Practiced");
  assert.equal(currentTopic?.status, "current");
  assert.equal(currentTopic?.label, "Recommended");
  assert.ok(topics.some((topic) =>
    topic.status === "available" && topic.label === "Available",
  ));
});
