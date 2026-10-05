import assert from "node:assert/strict";
import test, { before } from "node:test";

import { getTrackDisplay, getTrackRegistration, type TrackId, type TrainingSession } from "../../domain";
import { buildCertificationPracticeResumeRoute, buildCodingInterviewSimulationResumeRoute, buildDesignInterviewPracticeResumeRoute, buildPracticeSessionConfig, resolvePracticeSessionLength } from "./sessionConfig";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { CanonicalTrainingRuntime } from "../../application/canonical/CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { buildHomeTabModel } from "../home/tabs/homeTabModel";
import type { AnalyticsData } from "../analytics/analyticsService";

before(async () => { await contentPackageRuntimeOwner.verifyBundledPackages(); });

const ordinaryConfiguration = {
  answerChanges: "none",
  feedbackMode: "afterEachAnswer",
  kind: "practice",
  reinsertEnabled: false,
  submission: "perItem",
  timer: "elapsedForeground",
} as const;

test("actual canonical practice producer resumes through routes and Home without legacy navigation", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  let checked = 0;
  for (const trackId of catalog.tracks) {
    const family = getTrackRegistration(trackId as TrackId).familyId;
    if (family !== "certification" && family !== "design_interview") continue;
    const track = catalog.getTrack(trackId);
    for (const mode of track.modes.filter((candidate) => candidate.selection.kind === "node")) {
      const feedbackTimings = mode.feedbackTiming.kind === "learner_selectable"
        ? mode.feedbackTiming.options
        : [undefined];
      for (const feedbackTiming of feedbackTimings) {
        const runtime = new CanonicalTrainingRuntime(track);
        const { session } = await runtime.prepare({ trackId, modeId: mode.modeId,
          request: { sessionId: `resume-regression:${trackId}:${mode.modeId}:${feedbackTiming ?? "fixed"}`, requestedLength: mode.defaultRequestedLength, ...(feedbackTiming ? { feedbackTiming } : {}) },
          attempts: [], reviews: [], now: "2026-10-05T12:00:00.000Z" });
        await runtime.validateResume({ session, draft: null });
        assert.equal("navigation" in session.configurationSnapshot, false);
        const routeBuilder: typeof buildCertificationPracticeResumeRoute = family === "certification" ? buildCertificationPracticeResumeRoute : buildDesignInterviewPracticeResumeRoute;
        const route = routeBuilder(session);
        assert.equal(route.expectedSessionId, session.id);
        assert.equal(route.mode, session.modeId);
        assert.equal(route.trackId, trackId);
        assert.equal(route.sessionLength, session.requestedLength);
        assert.equal(route.feedbackMode, session.configurationSnapshot.feedbackMode);
        const recommendation = buildHomeTabModel({ activeTrack: getTrackDisplay(trackId as TrackId), activeSession: session,
          algorithmsDashboard: null, analytics: {} as AnalyticsData, dashboardError: null, trainingAttempts: [] }).recommendations[0];
        assert.equal(recommendation?.enabled, true);
        assert.equal(recommendation?.action.kind, family === "certification" ? "resume_certification_practice" : "resume_design_interview");
        assert.equal("sessionId" in recommendation.action ? recommendation.action.sessionId : undefined, session.id);
        for (const navigation of ["linear", "free"]) {
          const injected = { ...session, configurationSnapshot: { ...session.configurationSnapshot, navigation } };
          assert.throws(() => routeBuilder(injected), /canonical immutable interaction configuration/);
        }
        checked += 1;
      }
    }
  }
  assert.equal(checked, 12);
});
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

test("Coding Interview simulation resume targets its durable profile route", () => {
  const session = certificationSession({
    configuration: { kind: "algorithmsInterviewSimulation", simulationProfileId: "coding-mock-profile-1" },
    id: "coding-mock-session",
    modeId: "coding-interview-simulation",
    requestedLength: 40,
    trackId: "coding-interview-dsa-problem-solving",
  });

  assert.deepEqual(buildCodingInterviewSimulationResumeRoute(session), {
    name: "AlgorithmsInterviewSimulation",
    params: { profileId: "coding-mock-profile-1" },
  });
  assert.throws(() => buildCodingInterviewSimulationResumeRoute({
    ...session,
    configurationSnapshot: { kind: "algorithmsInterviewSimulation" },
  }), /durable active simulation profile/);
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
