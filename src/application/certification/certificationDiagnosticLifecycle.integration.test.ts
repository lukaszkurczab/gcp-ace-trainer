import assert from "node:assert/strict";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { getTrainingAttempts, getTrainingSessions } from "../../storage/repositories";
import { getCertificationPracticeReviewProjection, openCertificationPracticeSession, submitCertificationPracticeResponse, abandonCertificationSession } from "./certificationSessionFacade";

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
  const attempts = await getTrainingAttempts();
  assert.equal(attempts.value.filter((attempt) => attempt.sessionId === opened.projection.session.id).length, 1);
  const sessions = await getTrainingSessions();
  assert.equal(sessions.value.find((session) => session.id === opened.projection.session.id)?.status, "abandoned");

  const snapshotAfterAbandon = storage.snapshot();
  await assert.rejects(getCertificationPracticeReviewProjection(opened.projection.session.id), (error: unknown) =>
    typeof error === "object" && error !== null && "code" in error && error.code === "summary_unavailable");
  assert.deepEqual(storage.snapshot(), snapshotAfterAbandon, "an abandoned diagnostic receives no synthetic completed summary or read repair");
});
