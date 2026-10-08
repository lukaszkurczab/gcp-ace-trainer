import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSession, getTrackRegistration, type TrackId, type TrainingSession } from "../../domain";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import { TrainingApplicationFailure, TrainingLifecycleUseCases, type TrainingFamilyRuntime, type TrainingLifecyclePorts } from "./";

const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;
const PROFILE_ID = "algorithms-interview-simulation-v1";
const NOW = "2026-09-27T00:00:00.000Z";

async function fixture(decision: "allowed" | "denied" | "unavailable" | "missing" = "allowed", requestedTrackId: TrackId = TRACK_ID, finalizedReviewConflict = false) {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(requestedTrackId);
  const isDesign = track.trackId !== TRACK_ID;
  const modeId = isDesign ? "design-interview-simulation" : "coding-interview-simulation";
  const profileId = isDesign
    ? track.simulationProfiles?.find((candidate) => candidate.modeId === modeId)?.profileId ?? (() => { throw new Error(`Design simulation profile is missing for ${track.trackId}.`); })()
    : PROFILE_ID;
  const questions = track.questions.slice(0, isDesign ? 1 : 40);
  const session = createTrainingSession({
    id: "mock-session",
    trackId: requestedTrackId,
    modeId,
    configurationSnapshot: isDesign ? {
      kind: "designInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
      navigation: "free", submission: "manualOrForegroundTimeout", timer: "absoluteDeadline", timerDurationMs: 2_700_000,
      timerDeadlineAt: "2026-09-27T00:45:00.000Z", simulationProfileId: profileId, simulationProfileVersion: "1",
      simulationCaseId: "case", simulationCaseVersion: "1",
    } : {
      kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
      navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 2_700_000,
      simulationProfileId: profileId, simulationProfileVersion: "1", simulationBlueprintId: "coding-interview-interview-simulation-v1",
      simulationBlueprintVersion: "1", simulationPoolId: profileId, simulationPoolVersion: "1",
    },
    requestedLength: questions.length,
    actualLength: questions.length,
    currentItemIndex: 0,
    itemOrder: questions.map((question, index) => ({
      occurrenceId: `mock-session:occurrence:${index}`,
      item: { trackId: requestedTrackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    })),
    optionOrderByOccurrence: {},
    conditionalReinsertSlots: [],
    activeForegroundMs: 0,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    taxonomyVersion: "canonical-content-v1",
    planFingerprint: "a".repeat(64),
    status: "active",
    startedAt: NOW,
  });
  const runtime = {
    familyId: isDesign ? "design_interview" : "coding_interview",
    prepare: async () => { events.push("prepare"); return { session, firstOccurrence: session.itemOrder[0]!.item, draft: null }; },
    validateResume: async () => { events.push("validate-resume"); },
    validateDraftCommand: async () => { events.push("validate-draft"); },
    finalizeSimulation: async () => {
      events.push("finalize-runtime");
      return { session: { ...session, status: "completed", completedAt: NOW }, result: { sessionId: session.id } };
    },
  } as unknown as TrainingFamilyRuntime;
  const events: string[] = [];
  const draft = { schemaVersion: 1, draftVersion: 1, sessionId: session.id, trackId: requestedTrackId, familyId: isDesign ? "design_interview" : "coding_interview", revision: 1, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: NOW };
  let active: TrainingSession | null = null;
  let resolutionCount = 0;
  let startCount = 0;
  const ports = {
    clock: { now: () => NOW },
    sessionIds: { create: async () => "mock-session" },
    tracks: { getTrackRegistration },
    packages: {
      resolveForPreparation: async () => { events.push("resolve-prepare"); resolutionCount += 1; return { track: track as CanonicalTrackRuntime, runtime }; },
      resolveExactArtifact: async () => { events.push("resolve-exact"); resolutionCount += 1; return { track: track as CanonicalTrackRuntime, runtime }; },
    },
    repositories: {
      getActiveSession: async () => active,
      getAttempts: async () => [],
      getReviews: async () => [],
      getDraft: async () => draft,
      getResult: async () => ({ sessionId: session.id }),
      saveDraft: async () => { events.push("save-draft"); },
    },
    mutations: {
      start: async () => { events.push("start"); startCount += 1; active = session; },
      finalize: async () => { events.push("finalize"); active = null; return finalizedReviewConflict; },
    },
    ...(decision === "missing" ? {} : { premiumSessionAdmission: { authorize: async () => { events.push("authorize"); return decision; } } }),
  } as unknown as TrainingLifecyclePorts;
  return { lifecycle: new TrainingLifecycleUseCases(ports), events, session, get active() { return active; }, get resolutionCount() { return resolutionCount; }, get startCount() { return startCount; } };
}

test("Free and unavailable Coding Mock access fail before package resolution, preparation, or mutation", async () => {
  for (const decision of ["denied", "unavailable", "missing"] as const) {
    const setup = await fixture(decision);
    await assert.rejects(setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-simulation", request: { scope: { simulationProfileId: PROFILE_ID } } }),
      (error: unknown) => error instanceof TrainingApplicationFailure && error.code === (decision === "denied" ? "premium_entitlement_denied" : "premium_entitlement_unavailable"));
    assert.equal(setup.resolutionCount, 0);
    assert.equal(setup.startCount, 0);
    assert.deepEqual(setup.events, decision === "missing" ? [] : ["authorize"]);
  }
});

test("Premium Coding Mock starts the exact 40-item product mode and immutable profile identity", async () => {
  const setup = await fixture("allowed");
  const prepared = await setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-simulation", request: { scope: { simulationProfileId: PROFILE_ID } } });
  assert.equal(prepared.session.modeId, "coding-interview-simulation");
  assert.equal(prepared.session.requestedLength, 40);
  assert.equal(prepared.session.actualLength, 40);
  assert.equal(prepared.session.configurationSnapshot.simulationProfileId, PROFILE_ID);
  assert.deepEqual(setup.events, ["authorize", "resolve-prepare", "prepare", "start"]);
  assert.equal(setup.startCount, 1);
});

test("Coding Mock resume, draft save, and finalization each authorize once before one exact resolution", async () => {
  const setup = await fixture("allowed");
  await setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-simulation", request: { scope: { simulationProfileId: PROFILE_ID } } });

  setup.events.length = 0;
  await setup.lifecycle.resumeActiveSession();
  assert.deepEqual(setup.events, ["authorize", "resolve-exact", "validate-resume"]);

  setup.events.length = 0;
  await setup.lifecycle.saveSimulationDraft({ draft: {
    schemaVersion: 1, draftVersion: 1, sessionId: setup.session.id, trackId: TRACK_ID, familyId: "coding_interview",
    revision: 1, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: NOW,
  }, expectedPreviousRevision: 0 });
  assert.deepEqual(setup.events, ["authorize", "resolve-exact", "validate-draft", "save-draft"]);

  setup.events.length = 0;
  await setup.lifecycle.finalizeSimulation();
  assert.deepEqual(setup.events, ["authorize", "resolve-exact", "finalize-runtime", "finalize"]);
});

test("completed simulation operation exposes the canonical finalization review conflict", async () => {
  const setup = await fixture("allowed", TRACK_ID, true);
  await setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-simulation", request: { scope: { simulationProfileId: PROFILE_ID } } });
  await setup.lifecycle.finalizeSimulation();

  assert.deepEqual(await setup.lifecycle.getSimulationOperationState(setup.session), {
    family: "simulation",
    kind: "completed",
    reviewConflict: true,
  });
});

test("expired Coding Mock draft-save boundary aborts before package resolution or draft persistence", async () => {
  const setup = await fixture("allowed");
  await setup.lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-simulation", request: { scope: { simulationProfileId: PROFILE_ID } } });
  setup.events.length = 0;
  setup.lifecycle.installSimulationDraftSaveBoundary(async () => { setup.events.push("countdown-expiry"); return true; });
  await assert.rejects(setup.lifecycle.saveSimulationDraft({ draft: {
    schemaVersion: 1, draftVersion: 1, sessionId: setup.session.id, trackId: TRACK_ID, familyId: "coding_interview",
    revision: 1, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: NOW,
  }, expectedPreviousRevision: 0 }), /countdown expired/u);
  assert.deepEqual(setup.events, ["authorize", "countdown-expiry"]);
  assert.equal(setup.resolutionCount, 1);
});

test("active Coding Mock reauthorizes before exact resolution and resume validation", async () => {
  const resume = await fixture("denied");
  const active = resume.session;
  let exactResolutions = 0;
  let validations = 0;
  const runtime = { familyId: "coding_interview", validateResume: async () => { validations += 1; } } as unknown as TrainingFamilyRuntime;
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const events: string[] = [];
  const resumePorts = {
    clock: { now: () => NOW }, tracks: { getTrackRegistration },
    packages: { resolveExactArtifact: async () => { events.push("resolve-exact"); exactResolutions += 1; return { track: track as CanonicalTrackRuntime, runtime }; } },
    repositories: { getActiveSession: async () => active },
    premiumSessionAdmission: { authorize: async () => { events.push("authorize"); return "denied"; } },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(resumePorts);
  await assert.rejects(lifecycle.resumeActiveSession(), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "premium_entitlement_denied");
  assert.equal(exactResolutions, 0);
  assert.equal(validations, 0);
  assert.deepEqual(events, ["authorize"]);
});

test("all three Design simulations require Premium before create and resume, then prepare exact profile identity", async () => {
  const tracks = [
    "object-oriented-design-interview",
    "backend-system-design-interview",
    "frontend-system-design-interview",
  ] as TrackId[];
  for (const trackId of tracks) {
    const denied = await fixture("denied", trackId);
    const deniedProfileId = denied.session.configurationSnapshot.simulationProfileId;
    await assert.rejects(denied.lifecycle.startSession({ trackId, modeId: "design-interview-simulation", request: { scope: { simulationProfileId: deniedProfileId } } }),
      (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "premium_entitlement_denied");
    assert.equal(denied.startCount, 0);
    assert.deepEqual(denied.events, ["authorize"]);

    const allowed = await fixture("allowed", trackId);
    const profileId = allowed.session.configurationSnapshot.simulationProfileId;
    const prepared = await allowed.lifecycle.startSession({ trackId, modeId: "design-interview-simulation", request: { scope: { simulationProfileId: profileId } } });
    assert.equal(prepared.session.trackId, trackId);
    assert.equal(prepared.session.modeId, "design-interview-simulation");
    assert.equal(prepared.session.configurationSnapshot.kind, "designInterviewSimulation");
    assert.equal(prepared.session.configurationSnapshot.simulationProfileId, profileId);
    assert.equal(prepared.session.actualLength, 1);
    allowed.events.length = 0;
    await allowed.lifecycle.resumeActiveSession();
    assert.deepEqual(allowed.events, ["authorize", "resolve-exact", "validate-resume"]);

    const deniedResume = await fixture("denied", trackId);
    const active = deniedResume.session;
    const runtime = { familyId: "design_interview", validateResume: async () => { throw new Error("Premium denial must precede validation"); } } as unknown as TrainingFamilyRuntime;
    const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
    let exactResolutionCount = 0;
    const events: string[] = [];
    const ports = {
      clock: { now: () => NOW }, tracks: { getTrackRegistration },
      packages: { resolveExactArtifact: async () => { exactResolutionCount += 1; return { track: track as CanonicalTrackRuntime, runtime }; } },
      repositories: { getActiveSession: async () => active },
      premiumSessionAdmission: { authorize: async () => { events.push("authorize"); return "denied"; } },
    } as unknown as TrainingLifecyclePorts;
    await assert.rejects(new TrainingLifecycleUseCases(ports).resumeActiveSession(),
      (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "premium_entitlement_denied");
    assert.equal(exactResolutionCount, 0);
    assert.deepEqual(events, ["authorize"]);
  }
});

test("every Design mode denies before package resolution, preparation, and session mutation", async () => {
  const trackId = "object-oriented-design-interview" as TrackId;
  for (const modeId of [
    "design-interview-learn-framework",
    "design-interview-tradeoff-practice",
    "design-interview-weak-area-review",
    "design-interview-simulation",
  ]) {
    const setup = await fixture("denied", trackId);
    await assert.rejects(setup.lifecycle.startSession({ trackId, modeId, request: {} }),
      (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "premium_entitlement_denied");
    assert.equal(setup.resolutionCount, 0, `${modeId} must be denied before package resolution`);
    assert.equal(setup.startCount, 0, `${modeId} must not mutate an active session`);
    assert.deepEqual(setup.events, ["authorize"], `${modeId} must authorize before preparation`);
  }
});
