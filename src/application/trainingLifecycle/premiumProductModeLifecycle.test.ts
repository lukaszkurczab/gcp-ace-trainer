import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSession, getTrackRegistration, type TrackId, type TrainingSession } from "../../domain";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import { TrainingApplicationFailure, TrainingLifecycleUseCases, type TrainingFamilyRuntime, type TrainingLifecyclePorts } from "./";

const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;
const PROFILE_ID = "algorithms-interview-simulation-v1";
const NOW = "2026-09-27T00:00:00.000Z";

async function fixture(decision: "allowed" | "denied" | "unavailable" | "missing" = "allowed") {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const questions = track.questions.slice(0, 40);
  const session = createTrainingSession({
    id: "mock-session",
    trackId: TRACK_ID,
    modeId: "coding-interview-simulation",
    configurationSnapshot: {
      kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
      navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 2_700_000,
      simulationProfileId: PROFILE_ID, simulationProfileVersion: "1", simulationBlueprintId: "coding-interview-interview-simulation-v1",
      simulationBlueprintVersion: "1", simulationPoolId: PROFILE_ID, simulationPoolVersion: "1",
    },
    requestedLength: 40,
    actualLength: 40,
    currentItemIndex: 0,
    itemOrder: questions.map((question, index) => ({
      occurrenceId: `mock-session:occurrence:${index}`,
      item: { trackId: TRACK_ID, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
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
    familyId: "coding_interview",
    prepare: async () => { events.push("prepare"); return { session, firstOccurrence: session.itemOrder[0]!.item, draft: null }; },
    validateResume: async () => { events.push("validate-resume"); },
    validateDraftCommand: async () => { events.push("validate-draft"); },
    finalizeSimulation: async () => {
      events.push("finalize-runtime");
      return { session: { ...session, status: "completed", completedAt: NOW }, result: { sessionId: session.id } };
    },
  } as unknown as TrainingFamilyRuntime;
  const events: string[] = [];
  const draft = { schemaVersion: 1, draftVersion: 1, sessionId: session.id, trackId: TRACK_ID, familyId: "coding_interview", revision: 1, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: NOW };
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
      finalize: async () => { events.push("finalize"); active = null; },
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
