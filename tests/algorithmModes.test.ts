import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ALGORITHM_ENTRY_MODE_IDS,
  ALGORITHM_MODE_IDS,
  ALGORITHM_MODES,
  getAlgorithmMode,
  getAlgorithmModeIdForEntryPoint,
  resolveAlgorithmSessionNode,
  selectAlgorithmSessionItems,
  ALGORITHM_ROADMAP,
  type AlgorithmModeId,
  type AlgorithmSessionEntryPoint,
} from "../src/tracks/algorithms";
import {
  buildPracticeSessionConfig,
  getGeneralPracticeReviewSource,
} from "../src/features/practice/sessionConfig";

const expected = [
  [ALGORITHM_MODE_IDS.learnApproach, "Learn Approach", 10, "afterEachAnswer", "elapsedForeground", false],
  [ALGORITHM_MODE_IDS.guidedPractice, "Guided Practice", 20, "afterEachAnswer", "elapsedForeground", true],
  [ALGORITHM_MODE_IDS.recognizePatterns, "Recognize Patterns", 20, "afterEachAnswer", "elapsedForeground", false],
  [ALGORITHM_MODE_IDS.contrastPractice, "Contrast Practice", 20, "afterEachAnswer", "elapsedForeground", false],
  [ALGORITHM_MODE_IDS.weakAreaReview, "Weak Area Review", 10, "afterEachAnswer", "elapsedForeground", true],
  [ALGORITHM_MODE_IDS.independentPractice, "Independent Practice", 20, "afterEachAnswer", "elapsedForeground", false],
  [ALGORITHM_MODE_IDS.interviewSimulation, "Interview Simulation", 40, "atSessionEnd", "countdownForeground", false],
] as const;

test("Algorithms exposes exactly seven immutable mode-owned profiles", () => {
  assert.deepEqual(
    ALGORITHM_MODES.map((mode) => [
      mode.id,
      mode.title,
      mode.profile.sessionLength,
      mode.profile.feedbackMode,
      mode.profile.timer.kind,
      mode.profile.reinsertEnabled,
    ]),
    expected,
  );
  assert.equal(Object.isFrozen(ALGORITHM_MODES), true);
  for (const mode of ALGORITHM_MODES) {
    assert.equal(Object.isFrozen(mode), true);
    assert.equal(Object.isFrozen(mode.profile), true);
    assert.equal(Object.isFrozen(mode.profile.timer), true);
  }
});

test("Interview Simulation owns the approved interaction profile", () => {
  const profile = getAlgorithmMode(ALGORITHM_MODE_IDS.interviewSimulation).profile;
  assert.deepEqual(profile, {
    answerChanges: "untilFinalSubmission",
    feedbackMode: "atSessionEnd",
    navigation: "free",
    reinsertEnabled: false,
    sessionLength: 40,
    shortening: "prohibited",
    submission: "manualOrForegroundTimeout",
    supportedLengths: [40],
    timer: { durationMs: 2_700_000, kind: "countdownForeground" },
  });
});

test("Algorithms entry points dispatch only to canonical modes", () => {
  assert.deepEqual(ALGORITHM_ENTRY_MODE_IDS, {
    approach_primer: ALGORITHM_MODE_IDS.learnApproach,
    topic_default: ALGORITHM_MODE_IDS.guidedPractice,
    pattern_recognition: ALGORITHM_MODE_IDS.recognizePatterns,
    contrast: ALGORITHM_MODE_IDS.contrastPractice,
    due_queue: ALGORITHM_MODE_IDS.weakAreaReview,
    session_misses: ALGORITHM_MODE_IDS.weakAreaReview,
    mixed_practice: ALGORITHM_MODE_IDS.independentPractice,
    timed_validation: ALGORITHM_MODE_IDS.interviewSimulation,
  });
  assert.throws(
    () => getAlgorithmModeIdForEntryPoint("unknown" as AlgorithmSessionEntryPoint),
    /Unknown Algorithms entry point/,
  );
  assert.throws(() => getAlgorithmMode(["algorithms", "drill"].join("-")), /Unknown Algorithms mode id/);
  assert.throws(() => selectAlgorithmSessionItems({
    mode: "unknown" as AlgorithmModeId,
    nodeId: ALGORITHM_ROADMAP.nodes[0]!.id,
    sessionLength: 20,
  }), /Unknown Algorithms mode id/);
});

test("Algorithms routes derive fixed profile settings and reject invalid combinations", () => {
  const simulation = buildPracticeSessionConfig({
    mode: ALGORITHM_MODE_IDS.interviewSimulation,
    topicId: "mixed_pattern_practice",
    trackId: "algorithms",
  });
  assert.equal(simulation.sessionLength, 40);
  assert.equal(simulation.feedbackMode, "atSessionEnd");
  assert.equal(simulation.reviewBehaviorEnabled, false);

  const missedRef = { contentVersion: "v7", itemId: "question-7", trackId: "algorithms" } as const;
  const review = buildPracticeSessionConfig({
    mode: ALGORITHM_MODE_IDS.weakAreaReview,
    reviewItemRefs: [missedRef],
    reviewSource: "session_misses",
    topicId: "arrays_and_strings",
    trackId: "algorithms",
  });
  assert.deepEqual(review.reviewItemRefs, [missedRef]);

  assert.throws(() => buildPracticeSessionConfig({
    feedbackMode: "afterEachAnswer",
    mode: ALGORITHM_MODE_IDS.interviewSimulation,
    topicId: "mixed_pattern_practice",
    trackId: "algorithms",
  }), /owns feedback mode/);
  assert.throws(() => buildPracticeSessionConfig({
    mode: ALGORITHM_MODE_IDS.guidedPractice,
    sessionLength: 10,
    topicId: "arrays_and_strings",
    trackId: "algorithms",
  }), /owns session length/);
  assert.throws(() => buildPracticeSessionConfig({
    mode: ALGORITHM_MODE_IDS.independentPractice,
    reviewBehaviorEnabled: true,
    topicId: "mixed_pattern_practice",
    trackId: "algorithms",
  }), /owns reinsert setting/);
  assert.throws(() => buildPracticeSessionConfig({
    mode: ALGORITHM_MODE_IDS.weakAreaReview,
    reviewItemRefs: [missedRef],
    reviewSource: "due_queue",
    topicId: "arrays_hashing_foundations",
    trackId: "algorithms",
  }), /review item refs require session_misses source/);
  assert.throws(() => buildPracticeSessionConfig({
    mode: "default",
    topicId: "arrays_hashing_foundations",
    trackId: "algorithms",
  }), /Unknown Algorithms mode id/);
  assert.throws(() => buildPracticeSessionConfig({
    mode: ALGORITHM_MODE_IDS.weakAreaReview,
    topicId: "arrays_hashing_foundations",
    trackId: "algorithms",
  }), /requires due_queue or session_misses source/);
  assert.throws(() => buildPracticeSessionConfig({
    mode: ALGORITHM_MODE_IDS.guidedPractice,
    topicId: "access_security",
    trackId: "algorithms",
  }), /Unknown Algorithms topic/);
});

test("Algorithms review and topic entry contracts have no source-less or fallback path", () => {
  assert.equal(
    getGeneralPracticeReviewSource(ALGORITHM_MODE_IDS.weakAreaReview),
    "due_queue",
  );
  assert.equal(
    getGeneralPracticeReviewSource(ALGORITHM_MODE_IDS.guidedPractice),
    undefined,
  );
  assert.throws(() => selectAlgorithmSessionItems({
    mode: ALGORITHM_MODE_IDS.weakAreaReview,
    nodeId: ALGORITHM_ROADMAP.nodes[0]!.id,
    sessionLength: 10,
  }), /requires due_queue or session_misses source/);
  assert.throws(
    () => resolveAlgorithmSessionNode("access_security"),
    /Unknown Algorithms topic/,
  );
});

test("Algorithms setup exposes the owned profile instead of editable ignored controls", () => {
  const source = readFileSync("src/features/practice/PracticeSetupScreen.tsx", "utf8");
  assert.match(source, /title="Fixed mode profile"/);
  assert.match(source, /Algorithms session settings are owned by the selected mode/);
  assert.match(source, /algorithmMode \? \(/);
  assert.match(source, /algorithmMode\.profile\.sessionLength/);
  assert.match(source, /algorithmMode\.profile\.feedbackMode/);
  assert.match(source, /algorithmMode\.profile\.timer\.kind/);
  assert.match(source, /algorithmMode\.profile\.reinsertEnabled/);
});

test("Certification route configuration remains independent of Algorithms profiles", () => {
  assert.deepEqual(buildPracticeSessionConfig({
    feedbackMode: "atSessionEnd",
    mode: "practice",
    reviewBehaviorEnabled: false,
    sessionLength: 40,
    topicId: "access_security",
    trackId: "cloud-certification",
  }), {
    feedbackMode: "atSessionEnd",
    mode: "practice",
    reviewBehaviorEnabled: false,
    reviewItemRefs: undefined,
    reviewSource: undefined,
    sessionLength: 40,
    source: "practiceHub",
    topicId: "access_security",
    trackId: "cloud-certification",
  });
});

test("obsolete Algorithms mode IDs and route aliases are absent from canonical modules", () => {
  const files = [
    "src/tracks/algorithms/domain/algorithmModes.ts",
    "src/tracks/algorithms/algorithmSessionSelection.ts",
    "src/application/algorithms/AlgorithmsFamilyRuntime.ts",
  ];
  const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
  for (const obsoleteId of [
    ["algorithms", "roadmap", "basics"],
    ["algorithms", "learn"],
    ["algorithms", "drill"],
    ["algorithms", "review"],
    ["algorithms", "weak", "area"],
    ["algorithms", "mixed", "practice"],
  ].map((parts) => parts.join("-"))) {
    assert.doesNotMatch(source, new RegExp(`([\"'])${obsoleteId}\\1`));
  }
  assert.doesNotMatch(source, /\bAlgorithmPracticeSessionMode\b|\bALGORITHMS_SESSION_MODE_IDS\b|getAlgorithmsTrainingSessionModeId/);
});
