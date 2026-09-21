import assert from "node:assert/strict";
import test, { before } from "node:test";

import type { TrainingSession } from "../../domain";
import { buildCertificationPracticeResumeRoute, buildPracticeSessionConfig, resolvePracticeSessionLength } from "./sessionConfig";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";

before(async () => { await contentPackageRuntimeOwner.verifyBundledPackages(); });

const ordinaryConfiguration = {
  answerChanges: "none",
  feedbackMode: "afterEachAnswer",
  kind: "practice",
  navigation: "linear",
  reinsertEnabled: false,
  submission: "perItem",
  timer: "elapsedForeground",
} as const;
const GCP_FREE_NODE_ID = "organization_projects_policies_services_quotas_and_assets";
const CLAUDE_FREE_NODE_ID = "solution_design_and_architecture";

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
    artifactSha256: "a".repeat(64), contentVersion: "gcp-ace-test",
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
  for (const sessionLength of [10, 20, 40] as const) {
    for (const feedbackMode of ["afterEachAnswer", "atSessionEnd"] as const) {
      const config = buildPracticeSessionConfig({
        feedbackMode,
        mode: "coding-interview-custom-practice",
        sessionLength,
        source: "practiceSetup",
        topicId: "complexity_and_constraints",
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
  for (const sessionLength of [0, 1, 9, 11, 15, 21, 39, 41] as const) {
    assert.throws(
      () => buildPracticeSessionConfig({
        feedbackMode: "afterEachAnswer",
        mode: "coding-interview-custom-practice",
        sessionLength: sessionLength as never,
        source: "practiceSetup",
        topicId: "complexity_and_constraints",
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
      topicId: "complexity_and_constraints",
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
      topicId: "complexity_and_constraints",
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
      topicId: "complexity_and_constraints",
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
      topicId: "complexity_and_constraints",
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
      topicId: "complexity_and_constraints",
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
    /unavailable(?: in package|; restart to load canonical content)/,
  );
});

test("Certification resume routes preserve exact immutable configuration for package modes", () => {
  const routes = [
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: ordinaryConfiguration, id: "diagnostic", modeId: "certification-diagnostic-baseline", requestedLength: 40 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: ordinaryConfiguration, id: "focus", modeId: "certification-focus-practice", requestedLength: 20 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: ordinaryConfiguration, id: "weak", modeId: "certification-weak-area-review", requestedLength: 20 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: ordinaryConfiguration, id: "quick", modeId: "certification-quick-review", requestedLength: 10 })),
    buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, feedbackMode: "atSessionEnd" }, id: "claude-focus-deferred", modeId: "certification-focus-practice", requestedLength: 20, trackId: "claude-certified-architect-professional-certification" })),
  ];

  assert.deepEqual(routes.map((route) => ({ competencyId: route.competencyId, expectedSessionId: route.expectedSessionId, feedbackMode: route.feedbackMode, mode: route.mode, sessionLength: route.sessionLength, topicId: route.topicId })), [
    { competencyId: undefined, expectedSessionId: "diagnostic", feedbackMode: "afterEachAnswer", mode: "certification-diagnostic-baseline", sessionLength: 40, topicId: "" },
    { competencyId: undefined, expectedSessionId: "focus", feedbackMode: "afterEachAnswer", mode: "certification-focus-practice", sessionLength: 20, topicId: GCP_FREE_NODE_ID },
    { competencyId: undefined, expectedSessionId: "weak", feedbackMode: "afterEachAnswer", mode: "certification-weak-area-review", sessionLength: 20, topicId: "" },
    { competencyId: undefined, expectedSessionId: "quick", feedbackMode: "afterEachAnswer", mode: "certification-quick-review", sessionLength: 10, topicId: "" },
    { competencyId: undefined, expectedSessionId: "claude-focus-deferred", feedbackMode: "atSessionEnd", mode: "certification-focus-practice", sessionLength: 20, topicId: CLAUDE_FREE_NODE_ID },
  ]);
});

test("Certification resume rejects stale, cross-track, exam, and non-active sessions explicitly", () => {
  const staleFocus = certificationSession({ configuration: ordinaryConfiguration, id: "stale-focus", modeId: "certification-focus-practice", requestedLength: 15 });
  assert.throws(() => buildCertificationPracticeResumeRoute(staleFocus), /valid immutable session length/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: ordinaryConfiguration, id: "exam", modeId: "certification-exam-simulation", requestedLength: 50 })), /ordinary Certification session/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: ordinaryConfiguration, id: "cross-track", modeId: "certification-focus-practice", requestedLength: 10, trackId: "coding-interview-dsa-problem-solving" })), /Certification package/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: ordinaryConfiguration, id: "completed", modeId: "certification-focus-practice", requestedLength: 10, status: "completed" })), /Only an active/);
  assert.throws(() => buildCertificationPracticeResumeRoute(certificationSession({ configuration: { ...ordinaryConfiguration, feedbackMode: "atSessionEnd" }, id: "fixed-focus", modeId: "certification-focus-practice", requestedLength: 10 })), /canonical immutable interaction configuration/);
});

test("only Claude Focus exposes selectable feedback while other Certification setup stays fixed", () => {
  for (const feedbackMode of ["afterEachAnswer", "atSessionEnd"] as const) {
    assert.equal(buildPracticeSessionConfig({
      feedbackMode,
      mode: "certification-focus-practice",
      sessionLength: 20,
      source: "practiceSetup",
      topicId: CLAUDE_FREE_NODE_ID,
      trackId: "claude-certified-architect-professional-certification",
    }).feedbackMode, feedbackMode);
  }
  assert.throws(() => buildPracticeSessionConfig({
    feedbackMode: "atSessionEnd",
    mode: "certification-focus-practice",
    sessionLength: 20,
    source: "practiceSetup",
    topicId: GCP_FREE_NODE_ID,
    trackId: "google-cloud-associate-cloud-engineer",
  }), /does not render or accept undeclared setup controls/);
  for (const mode of ["certification-weak-area-review", "certification-quick-review"] as const) {
    assert.throws(() => buildPracticeSessionConfig({ feedbackMode: "atSessionEnd", mode, topicId: "", trackId: "claude-certified-architect-professional-certification" }), /does not render or accept/);
  }
  assert.throws(() => buildPracticeSessionConfig({ feedbackMode: "atSessionEnd", mode: "certification-diagnostic-baseline", topicId: "", trackId: "claude-certified-architect-professional-certification" }), /unavailable/);
});


test("Practice Setup uses the package default until the learner or route selects a supported length", () => {
  const coding = { requestedLengths: [10, 20, 40], defaultRequestedLength: 10 };
  const aws = { requestedLengths: [10, 20, 40], defaultRequestedLength: 10 };
  for (const missing of [null, undefined]) {
    assert.equal(resolvePracticeSessionLength(missing, coding), 10);
    assert.equal(resolvePracticeSessionLength(missing, aws), 10);
  }
  for (const selected of [10, 20, 40]) assert.equal(resolvePracticeSessionLength(selected, coding), selected);
  for (const invalid of [0, 9, 30, 100, NaN]) assert.equal(resolvePracticeSessionLength(invalid, coding), 10);
  assert.equal(resolvePracticeSessionLength(20, aws), 20);
});
