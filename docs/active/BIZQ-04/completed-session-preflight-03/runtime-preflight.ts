import assert from "node:assert/strict";
import { composeTrainingLifecycleUseCases } from "../../../../src/application/bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../../../../src/application/contentPackageRuntimeOwner";
import { startAlgorithmsSession, saveAlgorithmsSimulationResponseAndContinue, finalizeAlgorithmsSimulation, getAlgorithmsPracticeResultProjection } from "../../../../src/application/coding-interview";
import { getActiveTrainingSession, getTrainingAttempts, getTrainingSessions, getReviewQueueItems, addTrainingAttempt } from "../../../../src/storage/repositories";
import { installMemoryStorage } from "../../../../src/testing/journalTestSupport";
import { createTrainingAttempt } from "../../../../src/domain";
import { TrainingApplicationFailure } from "../../../../src/application/trainingLifecycle";

async function main() {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  let nextIdentity = 0;
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: { now: () => "2026-10-03T12:00:00.000Z" },
    sessionIds: { create: async () => `bizq04-completed-source03-${++nextIdentity}` },
    // Memory-backed application proof; this stub does not prove provider Premium behavior.
    premiumSessionAdmission: { authorize: async () => "allowed" as const },
  });
  const source = await startAlgorithmsSession({ modeId: "coding-interview-simulation", requestedLength: 40, scope: { simulationProfileId: "algorithms-interview-simulation-v1" }, source: "bizq04-source-preflight" });
  const occurrence = source.session.itemOrder[0]!;
  const question = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
  assert.equal(question.interaction.type, "choice_single", "current real first Coding Mock item must support this probe response");
  if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Current probe item shape changed.");
  const wrong = question.interaction.options.find(option => option.optionId !== question.answer.optionId);
  assert.ok(wrong);
  await saveAlgorithmsSimulationResponseAndContinue({ occurrenceId: occurrence.occurrenceId, response: { kind: "choice", selectedOptionIds: [wrong.optionId] } });
  await finalizeAlgorithmsSimulation();
  const result = await getAlgorithmsPracticeResultProjection(source.session.id);
  assert.equal(result.completionKind, "completed");
  assert.equal(result.totalOccurrences, 40);
  const misses = result.feedbackItems.filter(item => item.correctness === "incorrect" || item.correctness === "partial");
  assert.equal(misses.length, 1);
  assert.equal(misses[0]!.occurrenceId, occurrence.occurrenceId);
  assert.equal(await getActiveTrainingSession(), null);
  const before = JSON.stringify({ sessions: (await getTrainingSessions()).value, attempts: (await getTrainingAttempts()).value, reviews: (await getReviewQueueItems()).value });
  storage.resetCounters();
  let reason = "";
  await assert.rejects(
    lifecycle.startSession({ trackId: source.session.trackId, modeId: "coding-interview-weak-area-review", source: "bizq04-completed-result", request: { requestedLength: 10, reviewSource: "session_misses", reviewItemRefs: misses.map(item => item.item) } }),
    (error: unknown) => {
      assert.ok(error instanceof TrainingApplicationFailure);
      assert.equal(error.code, "unknown_mode");
      reason = String(error.cause);
      assert.match(reason, /session_misses is unavailable without verified completed-session evidence/u);
      return true;
    },
  );
  assert.equal(storage.operations.some(operation => operation.kind !== "read"), false);
  const after = JSON.stringify({ sessions: (await getTrainingSessions()).value, attempts: (await getTrainingAttempts()).value, reviews: (await getReviewQueueItems()).value });
  assert.equal(after, before);
  assert.equal(await getActiveTrainingSession(), null);
  const storedAttempt = (await getTrainingAttempts()).value.find(attempt => attempt.sessionId === source.session.id);
  assert.ok(storedAttempt);
  const orphan = createTrainingAttempt({ ...storedAttempt, id: `${storedAttempt.id}-orphan-preflight`, occurrenceId: "not-in-completed-source-plan" });
  await addTrainingAttempt(orphan);
  const acceptedOrphan = await getAlgorithmsPracticeResultProjection(source.session.id);
  assert.equal(acceptedOrphan.feedbackItems.length, 40);
  assert.deepEqual(acceptedOrphan.answeredOccurrenceIds, result.answeredOccurrenceIds);
  console.log(JSON.stringify({ outcome: "confirmed_projection_integrity_gap", injectedRecord: "shape-valid attempt in source session with out-of-plan occurrence", repositoryAccepted: true, projectionAccepted: true, hiddenExtraAttempt: orphan.occurrenceId, scope: "private memory fixture only; no production history changed" }, null, 2));
  console.log(JSON.stringify({ outcome: "confirmed_missing_capability", sourceSessionId: source.session.id, completed: true, totalOccurrences: 40, answered: result.answeredOccurrenceIds.length, missed: misses.length, unanswered: result.unansweredOccurrenceIds.length, questionId: occurrence.item.questionId, reviewPreparation: "rejected", reason, reviewPreparationNoMutation: true, sourceHistoryPreserved: true, limits: ["memory repositories", "stub Premium authorizer", "no native or provider proof", "current request carries refs but no source-session identity"] }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
