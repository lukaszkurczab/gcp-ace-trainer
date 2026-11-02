import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { canonicalInteractionRegistry } from "../../content/canonical/interactions/registry";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { advanceTrainingSession, createTrainingSession, type TrainingSession } from "../../domain";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { getTrainingSessions } from "../../storage";
import { commitTrainingSessionStart } from "../learningMutations";
import { productionTrackAdmissionContext } from "../tracks/trackAdmissionContext";
import { createCanonicalTrainingFamilyRuntime } from "../canonicalTrainingFamilyComposition";
import { selectApproachChallengeProblems } from "./approachChallengeSelection";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";

const now = "2026-11-01T15:00:00.000Z";
async function harness() {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
  const problems = track.approachChallengeProblems!;
  const selection = selectApproachChallengeProblems({ sources: problems.map(problem => ({ problem })),
    contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
    completion: { kind: "in_progress", chapters: [] } as never, access: "premium",
    settings: { mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium", "hard"],
      selectedFamilyIds: [...new Set(problems.flatMap(problem => problem.requiredFamilyIds))] },
  });
  assert.equal(selection.status, "ready");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepare = (sessionId: string) => runtime.prepare({ trackId: track.trackId, modeId: APPROACH_CHALLENGE_MODE_ID,
    request: { sessionId, selection }, attempts: [], reviews: [], now });
  const questions = new Map(problems.flatMap(problem => [problem.approachQuestion, problem.complexityQuestion]).map(question => [question.questionId, question]));
  return { runtime, prepare, questions };
}
async function refingerprint(session: TrainingSession): Promise<TrainingSession> {
  return createTrainingSession({ ...session, planFingerprint: await createContentSessionPlanFingerprint(session as TrainingSession & { taxonomyVersion: string }) });
}

test("both ACM stages randomize across new sessions, replay deterministically and render saved order", async () => {
  const { runtime, prepare, questions } = await harness();
  const first = await prepare("acm-order:first");
  assert.deepEqual(await prepare(first.session.id), first);
  const positions = first.session.itemOrder.map(() => new Set<string>());
  for (let round = 0; round < 12; round++) {
    const { session } = await prepare(`acm-order:${round}`);
    assert.deepEqual(session.itemOrder.map(entry => entry.item), first.session.itemOrder.map(entry => entry.item));
    await runtime.validateResume({ session, draft: null });
    session.itemOrder.forEach((occurrence, index) => {
      const question = questions.get(occurrence.item.questionId)!;
      const order = session.optionOrderByOccurrence[occurrence.occurrenceId]!;
      positions[index]!.add(JSON.stringify(order));
      assert.deepEqual([...order].sort(), question.interaction.options.map(option => option.optionId).sort());
      assert.equal(Object.isFrozen(order), true);
      for (const model of [canonicalInteractionRegistry.present(question, null, order).model,
        canonicalInteractionRegistry.presentReview(question, question.answer, order).model]) {
        assert.deepEqual((model as { renderer: { options: { id: string }[] } }).renderer.options.map(option => option.id), order);
      }
    });
  }
  positions.forEach((orders, index) => assert.ok(orders.size > 1, `occurrence ${index} must vary, including complexity stages`));
});

test("ACM saved shuffled orders survive storage reload and score stable IDs in both stages", async () => {
  const { runtime, prepare, questions } = await harness();
  const storage = installMemoryStorage();
  const prepared = await prepare("acm-order:durable");
  await commitTrainingSessionStart({ session: prepared.session, draft: null, createdAt: now });
  installKeyValueStorageForTests(storage);
  let session = (await getTrainingSessions(productionTrackAdmissionContext)).value.find(entry => entry.id === prepared.session.id)!;
  assert.deepEqual(session, prepared.session);
  await runtime.validateResume({ session, draft: null });
  const attempts = [];
  for (const occurrence of session.itemOrder.slice(0, 2)) {
    const question = questions.get(occurrence.item.questionId)!;
    const correctOptionId = question.answer.type === "choice_single" ? question.answer.optionId : null;
    const option = question.interaction.type === "approach_choice"
      ? question.interaction.options.find(option => option.grade === "correct")!
      : question.interaction.options.find(option => option.optionId === correctOptionId)!;
    const response = { type: question.interaction.type, optionId: option.optionId };
    const outcome = await runtime.submitPractice({ session, response, attempts, reviews: [], now });
    assert.equal(outcome.attempt.result.kind, "correct");
    assert.deepEqual(outcome.session.optionOrderByOccurrence, prepared.session.optionOrderByOccurrence);
    attempts.push(outcome.attempt);
    session = advanceTrainingSession(outcome.session);
  }
});

test("ACM resume preserves legacy source order and rejects corrupt or unfingerprinted orders", async () => {
  const { runtime, prepare, questions } = await harness();
  const { session } = await prepare("acm-order:guards");
  const legacy = await refingerprint({ ...session, optionOrderByOccurrence: Object.fromEntries(session.itemOrder.map(entry =>
    [entry.occurrenceId, questions.get(entry.item.questionId)!.interaction.options.map(option => option.optionId)])) });
  await runtime.validateResume({ session: legacy, draft: null });
  const occurrence = session.itemOrder[0]!;
  const order = session.optionOrderByOccurrence[occurrence.occurrenceId]!;
  const changed = (ids: readonly string[]) => ({ ...session, optionOrderByOccurrence: { ...session.optionOrderByOccurrence, [occurrence.occurrenceId]: ids } });
  await assert.rejects(runtime.validateResume({ session: changed([...order].reverse()), draft: null }), /pinned session plan/);
  for (const ids of [order.slice(1), order.map(() => order[0]!), order.map((id, index) => index ? id : "foreign")]) {
    await assert.rejects(async () => runtime.validateResume({ session: await refingerprint(changed(ids)), draft: null }), /duplicate option IDs|corrupt or unavailable/);
  }
});
