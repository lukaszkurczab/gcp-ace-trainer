import assert from "node:assert/strict";
import test from "node:test";

import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createCanonicalTrainingFamilyComposition } from "../canonicalTrainingFamilyComposition";
import { bootstrapApplication, type ApplicationBootstrapState } from "../bootstrap/applicationBootstrap";
import { composeTrainingLifecycleUseCases, createAdjustableWallClock } from "../bootstrap/trainingLifecycleComposition";
import type { ContentPackageRuntimePort } from "./contracts";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { getActiveTrainingSession, getTrainingAttempts, getActiveTrainingSessionDraft } from "../../storage/repositories";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { installMemoryStorage } from "../../testing/journalTestSupport";

const TRACK = "google-cloud-associate-cloud-engineer" as const;
const MODE = "certification-exam-simulation";
const STARTED_AT = "2026-10-26T12:00:00.000Z";

async function createExpiredGcpExam() {
  installMemoryStorage();
  initializeStorageMetadata();
  const canonical = await loadCanonicalRuntimeCatalog();
  const track = canonical.getTrack(TRACK);
  const family = createCanonicalTrainingFamilyComposition(track);
  const wallClock = createAdjustableWallClock(() => STARTED_AT);
  const packages: ContentPackageRuntimePort = {
    async resolveForPreparation() { return Object.freeze({ track: family.catalog, runtime: family.runtime }); },
    async resolveExactArtifact() { return Object.freeze({ track: family.catalog, runtime: family.runtime }); },
    async resolveForDiscovery() { return Object.freeze({ track: family.catalog, runtime: family.runtime }); },
  };
  const createLifecycle = () => composeTrainingLifecycleUseCases({
    wallClock,
    sessionIds: { create: async () => "gcp-expired-bootstrap-reproduction" },
    packages,
    premiumSessionAdmission: { authorize: async () => "allowed" },
  });
  const lifecycle = createLifecycle();
  const prepared = await lifecycle.startSession({ trackId: TRACK, modeId: MODE, request: {} });
  assert.equal(prepared.session.actualLength, 50, "the current GCP v1 profile selects its 50-question minimum");
  assert.equal(prepared.session.configurationSnapshot.timer, "absoluteDeadline");
  const first = prepared.session.itemOrder[0]!;
  const question = track.getQuestion(first.item.questionId);
  assert.ok(question);
  const responseDraft = {
    ...prepared.draft!,
    revision: prepared.draft!.revision + 1,
    responsesByOccurrenceId: { [first.occurrenceId]: question.answer },
    flaggedOccurrenceIds: [first.occurrenceId],
    updatedAt: wallClock.now(),
  };
  await lifecycle.saveSimulationDraft({ draft: responseDraft, expectedPreviousRevision: prepared.draft!.revision });
  const deadline = prepared.session.configurationSnapshot.timerDeadlineAt;
  if (typeof deadline !== "string") throw new Error("GCP exam runtime must persist an immutable deadline.");
  wallClock.advanceBy((Date.parse(deadline) - Date.parse(STARTED_AT)) + 1);
  return { lifecycle, createLifecycle, wallClock, session: prepared.session, responseDraft };
}

test("real GCP v1 expired exam finalizes through lifecycle and bootstrap owners", async () => {
  const direct = await createExpiredGcpExam();
  assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.id, direct.session.id);
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 0);
  const storedDraft = await getActiveTrainingSessionDraft(productionTrackAdmissionContext);
  assert.deepEqual(storedDraft?.responsesByOccurrenceId, direct.responseDraft.responsesByOccurrenceId);
  assert.deepEqual(storedDraft?.flaggedOccurrenceIds, direct.responseDraft.flaggedOccurrenceIds);
  const directFinalizedId = await direct.lifecycle.finalizeExpiredSimulationIfDue();
  assert.equal(directFinalizedId, direct.session.id);
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);

  const boot = await createExpiredGcpExam();
  const diagnostics: Array<Readonly<{ stage: string; operationalCode: string; errorKind: string }>> = [];
  let lifecycle = boot.lifecycle;
  const result: ApplicationBootstrapState = await bootstrapApplication(
    async () => undefined,
    async () => { await lifecycle.resumeActiveSession(); },
    async () => { lifecycle = boot.createLifecycle(); },
    { diagnosticObserver: (event) => { diagnostics.push(event); } },
  );
  assert.deepEqual(result, { kind: "ready", activeSessionId: null });
  assert.deepEqual(diagnostics, []);
  assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext), null);
  assert.equal((await getTrainingAttempts(productionTrackAdmissionContext)).value.length, 1);
});
