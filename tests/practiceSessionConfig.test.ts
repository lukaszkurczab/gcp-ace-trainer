import assert from "node:assert/strict";
import test from "node:test";

import type { TrainingSession } from "../src/domain";
import { buildCertificationPracticeResumeRoute, buildPracticeSessionConfig } from "../src/features/practice/sessionConfig";

const ordinaryConfiguration = {
  answerChanges: "none",
  feedbackMode: "afterEachAnswer",
  navigation: "linear",
  submission: "perItem",
  timer: "elapsedForeground",
} as const;

function certificationSession(input: Readonly<{
  configuration: TrainingSession["configurationSnapshot"];
  id: string;
  modeId: string;
  requestedLength: number;
  status?: TrainingSession["status"];
  trackId?: TrainingSession["trackId"];
}>): TrainingSession {
  return {
    activeForegroundMs: 0,
    actualLength: input.requestedLength,
    configurationSnapshot: input.configuration,
    contentVersion: "gcp-ace-test",
    currentItemIndex: 0,
    id: input.id,
    itemOrder: [],
    modeId: input.modeId,
    optionOrderByOccurrence: {},
    requestedLength: input.requestedLength,
    startedAt: "2026-08-02T10:00:00.000Z",
    status: input.status ?? "active",
    trackId: input.trackId ?? "cloud-certification",
  } as TrainingSession;
}

test("Custom Practice accepts every declared length and persists its selected feedback timing", () => {
  for (const sessionLength of [10, 20, 40] as const) {
    for (const feedbackMode of ["afterEachAnswer", "atSessionEnd"] as const) {
      const config = buildPracticeSessionConfig({
        feedbackMode,
        mode: "algorithms-custom-practice",
        sessionLength,
        source: "practiceSetup",
        topicId: "binary_search",
        trackId: "algorithms",
      });
      assert.equal(config.mode, "algorithms-custom-practice");
      assert.equal(config.sessionLength, sessionLength);
      assert.equal(config.feedbackMode, feedbackMode);
      assert.equal(config.reviewBehaviorEnabled, true);
    }
  }
});

test("Custom Practice setup rejects every unsupported session length", () => {
  for (const sessionLength of [0, 1, 9, 11, 15, 21, 39, 41] as const) {
    assert.throws(
      () => buildPracticeSessionConfig({
        feedbackMode: "afterEachAnswer",
        mode: "algorithms-custom-practice",
        sessionLength: sessionLength as never,
        source: "practiceSetup",
        topicId: "binary_search",
        trackId: "algorithms",
      }),
      /does not support session length/,
    );
  }
});

test("Custom Practice requires a selected timing while predefined Algorithms modes retain fixed timings", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "algorithms-custom-practice",
      sessionLength: 20,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /Custom Practice requires an explicit feedback mode/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      feedbackMode: "afterReview" as never,
      mode: "algorithms-custom-practice",
      sessionLength: 20,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /does not support feedback mode afterReview/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      feedbackMode: "atSessionEnd",
      mode: "algorithms-guided-practice",
      sessionLength: 40,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /does not support feedback mode atSessionEnd/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "algorithms-custom-practice",
      reviewBehaviorEnabled: false,
      feedbackMode: "afterEachAnswer",
      sessionLength: 20,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /owns reinsert setting true/,
  );
});

test("rejects an Algorithms session length that the selected mode does not declare", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "algorithms-weak-area-review",
      reviewSource: "due_queue",
      sessionLength: 40,
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /does not support session length 40/,
  );
});

test("Independent Practice defaults to the research-sized 10-item contract and supports no impossible 40-item scope", () => {
  const config = buildPracticeSessionConfig({
    algorithmScope: { interleavedScopeId: "hash-map-and-set-node-v1" },
    mode: "algorithms-independent-practice",
    topicId: "hash_map_and_set",
    trackId: "algorithms",
  });

  assert.equal(config.sessionLength, 10);
  assert.throws(
    () => buildPracticeSessionConfig({
      algorithmScope: { interleavedScopeId: "hash-map-and-set-node-v1" },
      mode: "algorithms-independent-practice",
      sessionLength: 40,
      topicId: "hash_map_and_set",
      trackId: "algorithms",
    }),
    /does not support session length 40/,
  );
});

test("Certification resume routes preserve the exact immutable configuration for all six ordinary modes", () => {
  const routes = [
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationDiagnosticBaseline" }, id: "diagnostic", modeId: "certification-diagnostic-baseline", requestedLength: 40 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, domain: "operations", kind: "certificationFocusPractice" }, id: "focus", modeId: "certification-focus-practice", requestedLength: 20 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, competencyId: "iam", kind: "certificationScenarioPractice" }, id: "scenario", modeId: "certification-scenario-practice", requestedLength: 20 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationWeakAreaReview" }, id: "weak", modeId: "certification-weak-area-review", requestedLength: 20 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationMixedPractice" }, id: "mixed", modeId: "certification-mixed-practice", requestedLength: 40 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationQuickReview", maximumLength: 10 }, id: "quick", modeId: "certification-quick-review", requestedLength: 10 })),
  ];

  assert.deepEqual(routes.map((route) => ({ competencyId: route.competencyId, expectedSessionId: route.expectedSessionId, mode: route.mode, sessionLength: route.sessionLength, topicId: route.topicId })), [
    { competencyId: undefined, expectedSessionId: "diagnostic", mode: "certification-diagnostic-baseline", sessionLength: 40, topicId: "" },
    { competencyId: undefined, expectedSessionId: "focus", mode: "certification-focus-practice", sessionLength: 20, topicId: "operations" },
    { competencyId: "iam", expectedSessionId: "scenario", mode: "certification-scenario-practice", sessionLength: 20, topicId: "" },
    { competencyId: undefined, expectedSessionId: "weak", mode: "certification-weak-area-review", sessionLength: 20, topicId: "" },
    { competencyId: undefined, expectedSessionId: "mixed", mode: "certification-mixed-practice", sessionLength: 40, topicId: "" },
    { competencyId: undefined, expectedSessionId: "quick", mode: "certification-quick-review", sessionLength: 10, topicId: "" },
  ]);
});

test("Certification resume rejects stale, cross-track, exam, and non-active sessions explicitly", () => {
  const staleFocus = certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationFocusPractice" }, id: "stale-focus", modeId: "certification-focus-practice", requestedLength: 10 });
  assert.throws(() => buildCertificationPracticeResumeRoute(staleFocus), /immutable Cloud domain/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationSimulation" }, id: "exam", modeId: "certification-exam-simulation", requestedLength: 50 })), /ordinary Cloud Certification session/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationFocusPractice", domain: "operations" }, id: "cross-track", modeId: "certification-focus-practice", requestedLength: 10, trackId: "algorithms" })), /ordinary Cloud Certification session/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationFocusPractice", domain: "operations" }, id: "completed", modeId: "certification-focus-practice", requestedLength: 10, status: "completed" })), /Only an active/);
});
