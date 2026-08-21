import { TEST_CONTENT_PACKAGE_PIN } from "./contentPackagePinFixture";
import assert from "node:assert/strict";
import test, { before } from "node:test";

import type { TrainingSession } from "../src/domain";
import { buildCertificationPracticeResumeRoute, buildPracticeSessionConfig } from "../src/features/practice/sessionConfig";
import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";

before(async () => { await contentPackageRuntimeOwner.verifyBundledPackages(); });

const ordinaryConfiguration = {
  answerChanges: "none",
  feedbackMode: "afterEachAnswer",
  navigation: "linear",
  submission: "perItem",
  timer: "elapsedForeground",
} as const;
const GCP_FREE_NODE_ID = "organization_projects_policies_services_quotas_and_assets";

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
    contentVersion: "gcp-ace-test", packagePin: TEST_CONTENT_PACKAGE_PIN,
    currentItemIndex: 0,
    id: input.id,
    itemOrder: [],
    modeId: input.modeId,
    optionOrderByOccurrence: {},
    requestedLength: input.requestedLength,
    startedAt: "2026-08-02T10:00:00.000Z",
    status: input.status ?? "active",
    trackId: input.trackId ?? "google-cloud-associate-cloud-engineer",
  } as TrainingSession;
}

test("Custom Practice accepts its package-declared length and persists its selected feedback timing", () => {
  for (const sessionLength of [10] as const) {
    for (const feedbackMode of ["afterEachAnswer", "atSessionEnd"] as const) {
      const config = buildPracticeSessionConfig({
        feedbackMode,
        mode: "coding-interview-custom-practice",
        sessionLength,
        source: "practiceSetup",
        topicId: "binary_search",
        trackId: "coding-interview-dsa-problem-solving",
      });
      assert.equal(config.mode, "coding-interview-custom-practice");
      assert.equal(config.sessionLength, sessionLength);
      assert.equal(config.feedbackMode, feedbackMode);
      assert.equal(config.reviewBehaviorEnabled, true);
    }
  }
});

test("Custom Practice setup rejects every unsupported session length", () => {
  for (const sessionLength of [0, 1, 9, 11, 15, 20, 21, 39, 40, 41] as const) {
    assert.throws(
      () => buildPracticeSessionConfig({
        feedbackMode: "afterEachAnswer",
        mode: "coding-interview-custom-practice",
        sessionLength: sessionLength as never,
        source: "practiceSetup",
        topicId: "binary_search",
        trackId: "coding-interview-dsa-problem-solving",
      }),
      /does not support session length/,
    );
  }
});

test("Custom Practice requires a selected timing while predefined Algorithms modes retain fixed timings", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "coding-interview-custom-practice",
      sessionLength: 10,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "coding-interview-dsa-problem-solving",
    }),
    /Custom Practice requires an explicit feedback mode/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      feedbackMode: "afterReview" as never,
      mode: "coding-interview-custom-practice",
      sessionLength: 10,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "coding-interview-dsa-problem-solving",
    }),
    /does not support feedback mode afterReview/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      feedbackMode: "atSessionEnd",
      mode: "coding-interview-guided-practice",
      sessionLength: 40,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "coding-interview-dsa-problem-solving",
    }),
    /does not support feedback mode atSessionEnd/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "coding-interview-custom-practice",
      reviewBehaviorEnabled: false,
      feedbackMode: "afterEachAnswer",
      sessionLength: 10,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "coding-interview-dsa-problem-solving",
    }),
    /owns reinsert setting true/,
  );
});

test("rejects an Algorithms session length that the selected mode does not declare", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "coding-interview-weak-area-review",
      reviewSource: "due_queue",
      sessionLength: 40,
      topicId: "binary_search",
      trackId: "coding-interview-dsa-problem-solving",
    }),
    /does not support session length 40/,
  );
});

test("Independent Practice direct entry fails because it is excluded from the bundled Free package", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      algorithmScope: { interleavedScopeId: "hash-map-and-set-node-v1" },
      mode: "coding-interview-independent-practice",
      topicId: "hash_map_and_set",
      trackId: "coding-interview-dsa-problem-solving",
    }),
    /unavailable in package/,
  );
});

test("Certification resume routes preserve exact immutable configuration for the three package modes", () => {
  const routes = [
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, domain: GCP_FREE_NODE_ID, kind: "certificationFocusPractice" }, id: "focus", modeId: "certification-focus-practice", requestedLength: 20 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationWeakAreaReview" }, id: "weak", modeId: "certification-weak-area-review", requestedLength: 20 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationQuickReview", maximumLength: 10 }, id: "quick", modeId: "certification-quick-review", requestedLength: 10 })),
  ];

  assert.deepEqual(routes.map((route) => ({ competencyId: route.competencyId, expectedSessionId: route.expectedSessionId, mode: route.mode, sessionLength: route.sessionLength, topicId: route.topicId })), [
    { competencyId: undefined, expectedSessionId: "focus", mode: "certification-focus-practice", sessionLength: 20, topicId: GCP_FREE_NODE_ID },
    { competencyId: undefined, expectedSessionId: "weak", mode: "certification-weak-area-review", sessionLength: 20, topicId: "" },
    { competencyId: undefined, expectedSessionId: "quick", mode: "certification-quick-review", sessionLength: 10, topicId: "" },
  ]);
});

test("Certification resume rejects stale, cross-track, exam, and non-active sessions explicitly", () => {
  const staleFocus = certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationFocusPractice" }, id: "stale-focus", modeId: "certification-focus-practice", requestedLength: 10 });
    assert.throws(() => buildCertificationPracticeResumeRoute(staleFocus), /immutable installed node/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationSimulation" }, id: "exam", modeId: "certification-exam-simulation", requestedLength: 50 })), /ordinary Certification session/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationFocusPractice", domain: "operations" }, id: "cross-track", modeId: "certification-focus-practice", requestedLength: 10, trackId: "coding-interview-dsa-problem-solving" })), /Certification package/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, kind: "certificationFocusPractice", domain: "operations" }, id: "completed", modeId: "certification-focus-practice", requestedLength: 10, status: "completed" })), /Only an active/);
});
