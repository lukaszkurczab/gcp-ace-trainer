import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { getTrackRegistration, type TrainingSession } from "../../domain";
import { TrainingApplicationFailure, TrainingLifecycleUseCases, type TrainingLifecyclePorts } from "../trainingLifecycle";
import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";

const TRACK_ID = "google-cloud-associate-cloud-engineer";
const MODE_ID = "certification-exam-simulation";

test("Certification Exam Simulation resolves before Premium admission and starts durably only when allowed", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  const events: string[] = [];
  let decision: "allowed" | "denied" | "unavailable" = "denied";
  let activeSession: TrainingSession | null = null;
  let durableStarts = 0;
  const lifecycle = new TrainingLifecycleUseCases({
    clock: { now: () => "2026-09-27T00:00:00.000Z" },
    sessionIds: { create: async () => "certification-exam-admission" },
    tracks: { getTrackRegistration },
    packages: {
      resolveForPreparation: async () => {
        events.push("resolve");
        return { track, runtime };
      },
    },
    repositories: {
      getActiveSession: async () => activeSession,
      getAttempts: async () => [],
      getReviews: async () => [],
    },
    mutations: {
      start: async (prepared: Parameters<TrainingLifecyclePorts["mutations"]["start"]>[0]) => {
        events.push("start");
        durableStarts += 1;
        activeSession = prepared.session;
      },
    },
    premiumSessionAdmission: {
      authorize: async () => {
        events.push("authorize");
        return decision;
      },
    },
  } as unknown as TrainingLifecyclePorts);

  for (const deniedDecision of ["denied", "unavailable"] as const) {
    decision = deniedDecision;
    events.length = 0;
    await assert.rejects(
      lifecycle.startSession({ trackId: TRACK_ID, modeId: MODE_ID, request: {} }),
      (error: unknown) => error instanceof TrainingApplicationFailure
        && error.code === (deniedDecision === "denied" ? "premium_entitlement_denied" : "premium_entitlement_unavailable"),
    );
    assert.deepEqual(events, ["resolve", "authorize"]);
    assert.equal(durableStarts, 0);
    assert.equal(activeSession, null);
  }

  decision = "allowed";
  events.length = 0;
  const started = await lifecycle.startSession({ trackId: TRACK_ID, modeId: MODE_ID, request: {} });
  assert.deepEqual(events, ["resolve", "authorize", "start"]);
  assert.equal(durableStarts, 1);
  assert.equal((activeSession as TrainingSession | null)?.id, started.session.id);
  assert.equal(started.session.trackId, TRACK_ID);
  assert.equal(started.session.modeId, MODE_ID);
  assert.equal(started.session.status, "active");
});
