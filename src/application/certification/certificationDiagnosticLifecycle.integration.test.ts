import assert from "node:assert/strict";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { getTrainingAttempts, getTrainingSessions } from "../../storage/repositories";
import { getCertificationPracticeReviewProjection, openCertificationPracticeSession, submitCertificationPracticeResponse, abandonCertificationSession, retryCertificationAbandonmentCommand } from "./certificationSessionFacade";
import { getTrainingLifecycleUseCases } from "../trainingLifecycle";
import { STORAGE_KEYS } from "../../storage/keys";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";


test("abandoned GCP diagnostic preserves its one durable answer and cannot produce a completed review", async () => {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  composeTrainingLifecycleUseCases({
    sessionIds: { create: async () => "gcp-diagnostic-abandoned-lifecycle" },
  });

  const opened = await openCertificationPracticeSession({ modeId: "certification-diagnostic-baseline", requestedLength: 40, source: "diagnostic-lifecycle-integration-test" });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") throw new Error("Expected the GCP diagnostic session to start.");
  assert.equal(opened.projection.total, 40);
  const firstQuestion = await contentPackageRuntimeOwner.resolveItem(opened.projection.session.itemOrder[0]!.item);
  await submitCertificationPracticeResponse(firstQuestion.answer as import("../../content/canonical").CanonicalQuestionResponse);

  const abandoned = await abandonCertificationSession(opened.projection.session.id);
  assert.equal(abandoned.kind, "abandoned");
  if (abandoned.kind !== "abandoned") throw new Error("Expected canonical diagnostic abandonment.");
  assert.equal(abandoned.session.status, "abandoned");
  const attempts = await getTrainingAttempts(productionTrackAdmissionContext);
  assert.equal(attempts.value.filter((attempt) => attempt.sessionId === opened.projection.session.id).length, 1);
  const sessions = await getTrainingSessions(productionTrackAdmissionContext);
  assert.equal(sessions.value.find((session) => session.id === opened.projection.session.id)?.status, "abandoned");

  const snapshotAfterAbandon = storage.snapshot();
  await assert.rejects(getCertificationPracticeReviewProjection(opened.projection.session.id), (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && error.code === "summary_unavailable");
  assert.deepEqual(storage.snapshot(), snapshotAfterAbandon, "an abandoned diagnostic receives no synthetic completed summary or read repair");
});

test("Certification exact abandonment retry routes a later durable phase failure to recovery", async () => {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  composeTrainingLifecycleUseCases({
    sessionIds: { create: async () => "gcp-diagnostic-abandonment-later-phase" },
  });
  const opened = await openCertificationPracticeSession({ modeId: "certification-diagnostic-baseline", requestedLength: 40, source: "diagnostic-abandonment-recovery-test" });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") throw new Error("Expected the GCP diagnostic session to start.");
  const lifecycle = getTrainingLifecycleUseCases();

  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.abandonActiveSession());
  storage.setFailurePlan(null);
  const initial = await lifecycle.getPracticeOperationState(opened.projection.session, false);
  assert.equal("error" in initial ? initial.error.allowedAction : null, "retry_same_command");
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);

  storage.setFailurePlan({ kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION });
  const result = await retryCertificationAbandonmentCommand(opened.projection.session.id);
  storage.setFailurePlan(null);
  assert.deepEqual(result, { expectedSessionId: opened.projection.session.id, kind: "recovery_required", recovery: "abandonment" });
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), true, "the exact retry durably wrote its journal before the later phase fault");
});
