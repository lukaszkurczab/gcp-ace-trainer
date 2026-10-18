import assert from "node:assert/strict";
import test from "node:test";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { getTrainingAttempts } from "../../storage/repositories";
import { getForegroundSessionTimerFacade, getTrainingLifecycleUseCases } from "../trainingLifecycle";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import {
  advanceAlgorithmsPracticeSession,
  getAlgorithmsPracticeProjection,
  startAlgorithmsSession,
  submitAlgorithmsPracticeResponse,
} from "./codingInterviewSessionFacade";

test("Guided Coding preserves the first correct answer across resume and saves the second exactly once", async () => {
  installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const dependencies = {
    sessionIds: { create: async () => "guided-second-answer-regression" },
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  };
  composeTrainingLifecycleUseCases(dependencies);
  const { session } = await startAlgorithmsSession({ modeId: "coding-interview-guided-practice", requestedLength: 10 });
  let projection = await getAlgorithmsPracticeProjection();
  assert.equal(projection.item.questionId, "alg-complexity-amortized-001");
  await submitAlgorithmsPracticeResponse({ kind: "choice", selectedOptionIds: ["sequence_average"] });
  const first = (await getTrainingAttempts(productionTrackAdmissionContext)).value.find(attempt => attempt.sessionId === session.id)!;
  assert.equal(first.result.kind, "correct");

  // Recompose the production owners around the same persisted memory store.
  // This is a local contract check, not native iOS persistence evidence.
  composeTrainingLifecycleUseCases(dependencies);
  const resumed = await getTrainingLifecycleUseCases().resumeActiveSession();
  assert(resumed);
  await getForegroundSessionTimerFacade().restoreForResume(resumed);
  projection = await getAlgorithmsPracticeProjection();
  assert.equal(projection.feedback?.correctness, "correct");
  await advanceAlgorithmsPracticeSession();
  projection = await getAlgorithmsPracticeProjection();
  assert.equal(projection.position.current, 2);
  assert.equal(projection.item.questionId, "alg-complexity-output-001");
  await submitAlgorithmsPracticeResponse({ kind: "choice", selectedOptionIds: ["omega_k"] });
  projection = await getAlgorithmsPracticeProjection();
  assert.equal(projection.operation.kind, "feedback");
  assert.equal(projection.feedback?.correctness, "correct");
  const attempts = (await getTrainingAttempts(productionTrackAdmissionContext)).value.filter(attempt => attempt.sessionId === session.id);
  assert.equal(attempts.length, 2);
  assert.equal(attempts.filter(attempt => attempt.occurrenceId === projection.occurrenceId).length, 1);
  assert.deepEqual(attempts.find(attempt => attempt.id === first.id), first);
});
