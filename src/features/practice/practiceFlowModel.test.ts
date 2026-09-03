import assert from "node:assert/strict";
import test, { before } from "node:test";

import type { TrackRegistration, TrainingAttempt } from "../../domain";
import {
  getTrackDisplay,
  getTrackDisplays,
  UnknownTrackError,
  UnknownTrackFamilyError,
  UnsupportedTrackError,
} from "../../domain";
import { buildAnalyticsData } from "../analytics/analyticsService";
import {
  buildPracticeStatsSummary,
  buildPracticeModes,
  buildTrackProgressPercent,
  buildTopicRoadmapNodes,
  getCurrentPracticeTopic,
  hasTrackProgress,
  resolvePracticeTopic,
  resolvePracticeFlowRegistration,
} from "./practiceFlowModel";
import {
  formatPracticeStatsDetail,
  formatPracticeStatsTitle,
  formatPracticeTopicDetail,
  formatPracticeTopicTitle,
} from "./practiceFlowPresentation";
import {
  ALGORITHM_MODE_IDS,
  ALGORITHM_ROADMAP,
  type AlgorithmQuestion,
} from "../../tracks/coding-interview";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import i18n from "../../i18n";

const translate = (locale: "en" | "pl", value: string): string => i18n.t(value, { lng: locale });

function codingPackage() {
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving");
  return {
    contentVersion: resolution.package.contentVersion,
    items: resolution.profile.items as readonly AlgorithmQuestion[],
    packagePin: resolution.package.packagePin,
  };
}

before(async () => { await contentPackageRuntimeOwner.verifyBundledPackages(); });

function attemptForItem(
  item: AlgorithmQuestion,
  answeredAt: string,
): TrainingAttempt {
  const itemRef = {
    contentVersion: codingPackage().contentVersion, packagePin: codingPackage().packagePin,
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

test("Algorithms practice hub exposes exactly the four bundled Free-package modes", () => {
  const modes = buildPracticeModes(getTrackDisplay("coding-interview-dsa-problem-solving"));

  assert.deepEqual(
    modes.map(({ mode, title }) => ({ mode, title })),
    [
      { mode: ALGORITHM_MODE_IDS.learnApproach, title: "Learn Approach" },
      { mode: ALGORITHM_MODE_IDS.guidedPractice, title: "Guided Practice" },
      { mode: ALGORITHM_MODE_IDS.customPractice, title: "Custom Practice" },
      { mode: ALGORITHM_MODE_IDS.weakAreaReview, title: "Weak Area Review" },
    ],
  );
});

test("Algorithms Independent Practice keeps its canonical title in the Polish presentation boundary", () => {
  assert.equal(translate("pl", "Independent Practice"), "Samodzielne ćwiczenia");
});

test("Certification practice hub keeps Focus primary and exposes the declared Diagnostic, Weak, and Quick modes", () => {
  const modes = buildPracticeModes(getTrackDisplay("google-cloud-associate-cloud-engineer"));

  assert.deepEqual(
    modes.map(({ mode, title }) => ({ mode, title })),
    [
      { mode: "certification-focus-practice", title: "Focus Practice" },
      { mode: "certification-diagnostic-baseline", title: "Diagnostic Baseline" },
      { mode: "certification-weak-area-review", title: "Weak Area Review" },
      { mode: "certification-quick-review", title: "Quick Review" },
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
    "Practice this topic in Google Cloud ACE",
  );
  assert.equal(
    formatPracticeTopicDetail(topic.detail, (value) => translate("pl", value)),
    "Ćwicz ten temat w ścieżce Google Cloud ACE",
  );
  assert.equal(
    formatPracticeTopicTitle(topic.title, (value) => translate("pl", value)),
    "Organization Projects Policies Services Quotas And Assets",
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
  await contentPackageRuntimeOwner.verifyBundledPackages();
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
    "Ćwicz rozwiązywanie problemów algorytmicznych.",
  );
  assert.equal(formatPracticeStatsTitle(stats, pl), "Rozmowa techniczna — Statystyki");
  assert.equal(
    formatPracticeStatsDetail(stats.detail, pl),
    "0 poprawnych, 0 częściowych, 0 niepoprawnych.",
  );
});

test("route-selected Algorithms topic preserves authored copy and translates only structured 0/158 and 0/8 labels", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
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

test("Every launch roadmap exposes its Free node first and all other nodes locked", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  for (const track of getTrackDisplays()) {
    const topics = buildTopicRoadmapNodes({ activeTrackId: track.id, trainingAttempts: [] });
    const freeNodeId = contentPackageRuntimeOwner.getPreparedDiscovery(track.id).profile.freeNodeId;
    assert.ok(topics.length > 1, `${track.id} must expose its full roadmap`);
    assert.equal(topics[0]?.id, freeNodeId);
    assert.equal(topics[0]?.status, "current");
    assert.ok(topics.slice(1).every((topic) => topic.status === "locked"));
    assert.equal(topics.filter((topic) => topic.label === "Recommended").length, track.familyId === "coding_interview" ? 1 : 0);
  }
  assert.equal(
    buildTopicRoadmapNodes({ activeTrackId: "coding-interview-dsa-problem-solving", trainingAttempts: [] }).length,
    ALGORITHM_ROADMAP.nodes.length,
  );
});

test("Algorithms roadmap records practice inside the bundled package Free node while keeping Premium nodes locked", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const items = codingPackage().items;
  const first = items[0];
  assert.ok(first);
  const topics = buildTopicRoadmapNodes({
    activeTrackId: "coding-interview-dsa-problem-solving",
    trainingAttempts: [
      attemptForItem(first, "2026-07-28T10:00:00.000Z"),
    ],
  });
  const practicedTopic = topics.find((topic) =>
    topic.id === first.taxonomy.roadmapNodeId,
  );

  assert.equal(topics.length, ALGORITHM_ROADMAP.nodes.length);
  assert.equal(practicedTopic?.status, "current");
  assert.equal(practicedTopic?.label, "Recommended");
  assert.equal(practicedTopic?.detail.kind, "algorithm-progress");
  assert.equal(practicedTopic?.detail.practicedItemCount, 1);
  assert.ok(topics.filter((topic) => topic.id !== first.taxonomy.roadmapNodeId).every((topic) => topic.status === "locked"));
});
