import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";
import { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import { getTrackRegistration } from "../../domain";
import type { TrainingLifecyclePorts } from "./contracts";

test("training lifecycle resolves every canonical track runtime", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const id of catalog.tracks) assert.ok(catalog.getTrack(id).modes.length > 0);
});

test("lifecycle preserves an explicit review conflict through the practice operation projection", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const runtime = new CanonicalTrainingRuntime(track);
  const mode = track.getMode("coding-interview-learn-approach");
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: mode.modeId,
    request: { sessionId: "lifecycle-review-conflict", requestedLength: mode.requestedLengths[0] },
    attempts: [],
    reviews: [],
    now: "2026-10-01T12:00:00.000Z",
  });
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
  const ports = {
    clock: { now: () => "2026-10-01T12:00:00.000Z" },
    sessionIds: { async create() { return prepared.session.id; } },
    tracks: { getTrackRegistration },
    packages: {
      async resolveExactArtifact() { return { track, runtime }; },
      async resolveForPreparation() { return { track, runtime }; },
      async resolveForDiscovery() { return { track, runtime }; },
    },
    repositories: {
      async getActiveSession() { return prepared.session; },
      async getSession() { return null; },
      async getHistory() { return []; },
      async getAttempts() { return []; },
      async getReviews() { return []; },
      async getDraft() { return null; },
      async getResult() { return null; },
      async saveDraft() {},
    },
    mutations: {
      async start() {},
      async submitPractice() { return true; },
      async advance() {},
      async completeWithResult() {},
      async finalize() { return false; },
      async abandon() {},
      async recover() {},
      async reset() {},
    },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(ports);

  await lifecycle.submitPracticeResponse(question.answer);

  assert.deepEqual(await lifecycle.getPracticeOperationState(prepared.session, true), {
    family: "practice",
    kind: "feedback",
    reviewConflict: true,
  });
});
