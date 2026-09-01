import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getTrackDisplay } from "../../domain";
import { buildReviewQueueScreenModel } from "./reviewQueueModel";
import { formatReviewTaxonomyLabel } from "./reviewQueuePresentation";
import i18n from "../../i18n";

const translate = (locale: "en" | "pl", value: string): string => i18n.t(value, { lng: locale });

test("track presentation exposes only the concrete Google Cloud track", () => {
  const track = getTrackDisplay("google-cloud-associate-cloud-engineer");

  assert.equal(track.id, "google-cloud-associate-cloud-engineer");
  assert.equal(track.familyId, "certification");
  assert.equal(track.title, "Google Cloud Associate Cloud Engineer");
  assert.equal(track.shortTitle, "Google Cloud ACE");
});

test("active track naming is complete in the Polish presentation dictionary", () => {
  for (const trackId of ["coding-interview-dsa-problem-solving", "google-cloud-associate-cloud-engineer"]) {
    const track = getTrackDisplay(trackId);

    assert.notEqual(translate("pl", track.description), track.description);
    if (trackId === "coding-interview-dsa-problem-solving") assert.notEqual(translate("pl", track.shortTitle), track.shortTitle);
  }

  assert.equal(
    translate("pl", "Google Cloud Associate Cloud Engineer"),
    "Google Cloud Associate Cloud Engineer",
  );
});

test("review presentation uses the concrete track title when taxonomy context is absent", () => {
  const track = getTrackDisplay("google-cloud-associate-cloud-engineer");
  const model = buildReviewQueueScreenModel({
    degraded: false,
    dueItems: [
      {
        dueAt: "2026-07-28T12:00:00.000Z",
        id: "review-1",
        isDue: true,
        isOverdue: false,
        itemId: "ace-q-0001",
        mistakeTypeRefs: [],
        prompt: "Choose the appropriate service.",
        reasons: [],
        sourceAttemptId: "attempt-1",
        taxonomyRefs: [],
      },
    ],
    issues: [],
    ok: true,
    overdueItems: [],
    totalItems: 1,
    trackTitle: track.title,
    upcomingItems: [],
  });

  const taxonomyLabel = model.dueRows[0]?.taxonomyLabel;
  assert.ok(taxonomyLabel);
  assert.deepEqual(
    taxonomyLabel,
    { kind: "translation-key", value: track.title },
  );
  assert.equal(
    formatReviewTaxonomyLabel(
      taxonomyLabel,
      (value) => translate("pl", value),
    ),
    "Google Cloud Associate Cloud Engineer",
  );
  assert.equal(
    translate("pl", model.emptyDescription),
    "Niepoprawne lub częściowo poprawne odpowiedzi z tej ścieżki pojawią się tutaj po dodaniu do powtórek.",
  );
});

test("review translates known track and cloud taxonomy labels while preserving authored taxonomy", () => {
  const algorithmsModel = buildReviewQueueScreenModel({
    degraded: false,
    dueItems: [
      {
        dueAt: "2026-07-28T12:00:00.000Z",
        id: "review-track",
        isDue: true,
        isOverdue: false,
        itemId: "algorithm-q-1",
        mistakeTypeRefs: [],
        prompt: "Choose a strategy.",
        reasons: [],
        sourceAttemptId: "attempt-track",
        taxonomyRefs: [],
      },
      {
        dueAt: "2026-07-28T13:00:00.000Z",
        id: "review-authored",
        isDue: true,
        isOverdue: false,
        itemId: "algorithm-q-2",
        mistakeTypeRefs: [],
        prompt: "Compare approaches.",
        reasons: [],
        sourceAttemptId: "attempt-authored",
        taxonomyRefs: [
          { axisId: "mental_unit", nodeId: "custom_mental_unit", role: "primary" },
        ],
      },
    ],
    issues: [],
    ok: true,
    overdueItems: [],
    totalItems: 2,
    trackTitle: getTrackDisplay("coding-interview-dsa-problem-solving").title,
    upcomingItems: [],
  });
  const cloudModel = buildReviewQueueScreenModel({
    degraded: false,
    dueItems: [
      {
        dueAt: "2026-07-28T12:00:00.000Z",
        id: "review-cloud",
        isDue: true,
        isOverdue: false,
        itemId: "ace-q-1",
        mistakeTypeRefs: [],
        prompt: "Choose the appropriate service.",
        reasons: [],
        sourceAttemptId: "attempt-cloud",
        taxonomyRefs: [
          {
            axisId: "cloud-domain",
            nodeId: "planning_implementation",
            role: "primary",
          },
        ],
      },
    ],
    issues: [],
    ok: true,
    overdueItems: [],
    totalItems: 1,
    trackTitle: getTrackDisplay("google-cloud-associate-cloud-engineer").title,
    upcomingItems: [],
  });
  const pl = (value: string) => translate("pl", value);
  const trackLabel = algorithmsModel.dueRows.find(
    (row) => row.id === "review-track",
  )?.taxonomyLabel;
  const authoredLabel = algorithmsModel.dueRows.find(
    (row) => row.id === "review-authored",
  )?.taxonomyLabel;
  const cloudLabel = cloudModel.dueRows[0]?.taxonomyLabel;

  assert.ok(trackLabel);
  assert.ok(authoredLabel);
  assert.ok(cloudLabel);
  assert.equal(formatReviewTaxonomyLabel(trackLabel, pl), "Rozmowa techniczna: DSA i rozwiązywanie problemów");
  assert.equal(formatReviewTaxonomyLabel(cloudLabel, pl), "Planowanie i konfigurowanie rozwiązania chmurowego");
  assert.deepEqual(authoredLabel, { kind: "authored", value: "Custom Mental Unit" });
  assert.equal(formatReviewTaxonomyLabel(authoredLabel, pl), "Custom Mental Unit");
});

test("dynamic track titles cross the translation boundary and long header copy can shrink", () => {
  const homeScreen = readFileSync(
    "src/features/home/HomeScreen.tsx",
    "utf8",
  );
  const homeTab = readFileSync(
    "src/features/home/tabs/HomeTab.tsx",
    "utf8",
  );
  const selectTrackScreen = readFileSync(
    "src/features/home/SelectTrackScreen.tsx",
    "utf8",
  );
  const appShellHeader = readFileSync(
    "src/components/AppShellHeader.tsx",
    "utf8",
  );
  const practiceHub = readFileSync(
    "src/features/practice/PracticeHubScreen.tsx",
    "utf8",
  );
  const reviewScreen = readFileSync(
    "src/features/review/MistakesReviewScreen.tsx",
    "utf8",
  );
  const practiceSetup = readFileSync(
    "src/features/practice/PracticeSetupScreen.tsx",
    "utf8",
  );

  assert.match(homeScreen, /activeTrack=\{activeTrack\}/);
  assert.match(homeTab, /\{t\(activeTrack\.shortTitle\)\}/);
  assert.match(selectTrackScreen, /title=\{t\(track\.shortTitle\)\}/);
  assert.match(
    appShellHeader,
    /brandRow:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/,
  );
  assert.match(
    appShellHeader,
    /headerCopy:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/,
  );
  assert.match(
    appShellHeader,
    /headerMeta:\s*\{[\s\S]*?flexShrink:\s*1,/,
  );
  assert.match(practiceHub, /formatPracticeTopicDetail\(topic\.detail,\s*t\)/);
  assert.match(practiceHub, /formatPracticeTopicTitle\(topic\.title,\s*t\)/);
  assert.doesNotMatch(practiceHub, /buildPracticeStatsSummary/);
  assert.doesNotMatch(practiceHub, /t\(topic\.title\)/);
  assert.doesNotMatch(
    practiceHub,
    /detail:\s*\{\s*key:\s*roadmapTopic\.detail/,
  );
  assert.match(practiceSetup, /resolvePracticeTopicModel\(\{/);
  assert.match(
    practiceSetup,
    /formatPracticeTopicTitle\(topic\.title,\s*t\)/,
  );
  assert.doesNotMatch(practiceSetup, /t\(topic\.title\)/);
  assert.doesNotMatch(
    practiceSetup,
    /detail:\s*\{\s*key:\s*node\.detail/,
  );
  assert.match(
    reviewScreen,
    /detail=\{formatReviewTaxonomyLabel\(row\.taxonomyLabel,\s*t\)\}/,
  );
});
