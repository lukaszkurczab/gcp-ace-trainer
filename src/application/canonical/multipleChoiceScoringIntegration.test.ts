import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { isCanonicalResponseComplete, scoreCanonicalQuestion } from "../../content/canonical/questionScoring";
import type { ChoiceMultipleQuestion } from "../../content/canonical/questionTypes";
import { createTrainingSession } from "../../domain";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { getTrainingAttempts, getReviewQueueItems } from "../../storage";
import { commitTrainingOutcome, commitTrainingSessionStart } from "../learningMutations";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { composeCanonicalFeedback, projectCanonicalChoiceFeedbackControls } from "./canonicalInteractionPresentation";

const NOW = "2026-10-02T12:00:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();
const multiple = (question: unknown): question is ChoiceMultipleQuestion => Boolean(question) && (question as ChoiceMultipleQuestion).interaction.type === "choice_multiple";

test("all current actual multiple-choice items reject every wrong-containing subset independently of oracle parity", async () => {
  const catalog = await catalogPromise;
  const oracle = await import(pathToFileURL(path.resolve("../patternly-content/scripts/content/question-contract.mjs")).href);
  let items = 0, subsets = 0;
  for (const trackId of catalog.tracks) for (const question of catalog.getTrack(trackId).questions.filter(multiple)) {
    items += 1;
    const optionIds = question.interaction.options.map((option) => option.optionId);
    const expected = new Set(question.answer.optionIds);
    for (let mask = 0; mask < 2 ** optionIds.length; mask += 1) {
      subsets += 1;
      const selected = optionIds.filter((_, index) => mask & (1 << index));
      const response = { type: "choice_multiple", optionIds: selected };
      const wrongOrEmpty = selected.length === 0 || selected.some((id) => !expected.has(id));
      // The valid partial formula is deliberately preserved pending a PO decision.
      const earnedPoints = wrongOrEmpty ? 0 : optionIds.filter((id) => expected.has(id) ? selected.includes(id) : !selected.includes(id)).length;
      const kind = wrongOrEmpty ? "incorrect" : selected.length === expected.size ? "correct" : "partial";
      const score = scoreCanonicalQuestion(question, response);
      assert.deepEqual([score.kind, score.earnedPoints, score.maxPoints], [kind, earnedPoints, optionIds.length], `${trackId}/${question.questionId}/${selected}`);
      const { contentDomainId: _domain, ...producerQuestion } = question;
      const producer = oracle.scoreQuestion(producerQuestion, response);
      assert.deepEqual([producer.status, producer.earnedPoints, producer.maxPoints], [kind, earnedPoints, optionIds.length]);
      assert.deepEqual(scoreCanonicalQuestion(question, { ...response, optionIds: [...selected].reverse() }), score);
      assert.equal(isCanonicalResponseComplete(question, response), selected.length > 0);
    }
    for (const optionIds of [[question.answer.optionIds[0]!, question.answer.optionIds[0]!], ["unknown"]]) {
      const response = { type: "choice_multiple", optionIds };
      assert.equal(isCanonicalResponseComplete(question, response), false);
      assert.equal(scoreCanonicalQuestion(question, response).earnedPoints, 0);
      assert.equal(oracle.scoreQuestion(producerQuestionWithoutDomain(question), response).earnedPoints, 0);
    }
  }
  assert.deepEqual({ items, subsets }, { items: 441, subsets: 8992 });
});

function producerQuestionWithoutDomain(question: ChoiceMultipleQuestion) {
  const { contentDomainId: _domain, ...producerQuestion } = question;
  return producerQuestion;
}

test("actual practice runtime writes zero-point incorrect attempt/review, survives repository rebind and preserves authored feedback", async () => {
  const storage = installMemoryStorage();
  const track = (await catalogPromise).getTrack("claude-certified-architect-professional-certification");
  const runtime = new CanonicalTrainingRuntime(track);
  const mode = track.getMode("certification-focus-practice");
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "bizq01-scoring", requestedLength: Math.max(...mode.requestedLengths) }, attempts: [], reviews: [], now: NOW });
  const question = track.getPool(mode.modeId).find(multiple);
  assert.ok(question, "the actual eligible practice pool must contain multiple-choice content");
  // Explicit reconstructed plan fixture: current automatic selection does not select
  // this item. Keep actual pool membership, refs, configuration and resume validation.
  const index = 0;
  const occurrence = prepared.session.itemOrder[index]!;
  const item = { ...occurrence.item, questionId: question.questionId };
  const itemOrder = prepared.session.itemOrder.map((entry, i) => i === index ? { ...entry, item } : entry);
  const optionOrderByOccurrence = { ...prepared.session.optionOrderByOccurrence, [occurrence.occurrenceId]: question.interaction.options.map((option) => option.optionId) };
  const base = createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }) });
  await runtime.validateResume({ session, draft: null });
  await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
  const wrong = question.interaction.options.find((option) => !question.answer.optionIds.includes(option.optionId))!.optionId;
  const response = { type: "choice_multiple" as const, optionIds: [...question.answer.optionIds, wrong] };
  const outcome = await runtime.submitPractice({ session, response, attempts: [], reviews: [], now: NOW });
  const reviews = outcome.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry);
  const commit = () => commitTrainingOutcome({ attempt: outcome.attempt, session: outcome.session, reviews, createdAt: NOW });
  await commit();
  await commit();
  installKeyValueStorageForTests(storage);
  const attempts = (await getTrainingAttempts()).value;
  const storedReviews = (await getReviewQueueItems()).value;
  assert.equal(attempts.length, 1);
  assert.deepEqual(attempts[0]!.result, { kind: "incorrect", earnedPoints: 0, maxPoints: question.interaction.options.length });
  assert.deepEqual(attempts[0]!.response, response);
  assert.deepEqual(attempts[0]!.item, session.itemOrder[index]!.item);
  assert.equal(storedReviews.length, 1);
  assert.deepEqual(storedReviews[0]!.reasons, ["incorrect"]);
  assert.equal(storedReviews[0]!.persistent, true);
  const partialWrong = { type: "choice_multiple" as const, optionIds: [question.answer.optionIds[0]!, wrong] };
  const feedback = composeCanonicalFeedback(question, partialWrong);
  assert.equal(feedback.correctness, "incorrect");
  assert.equal(feedback.reason, question.feedback.reason);
  assert.equal(feedback.details, question.feedback.details);
  const controls = projectCanonicalChoiceFeedbackControls(question, partialWrong);
  assert.equal(controls.find((control) => control.id === wrong)?.state, "incorrect");
  assert.equal(controls.find((control) => control.id === question.answer.optionIds[0])?.state, "correct");
  assert.equal(controls.find((control) => control.id === question.answer.optionIds[1])?.state, "omitted_correct");
  for (const optionIds of [[], ["unknown"], [wrong, wrong]]) {
    await assert.rejects(runtime.submitPractice({ session, response: { type: "choice_multiple", optionIds }, attempts, reviews: storedReviews, now: NOW }), /incomplete or invalid/);
  }
  assert.deepEqual((await getTrainingAttempts()).value, attempts);
  assert.deepEqual((await getReviewQueueItems()).value, storedReviews);
});

test("actual Coding Mock simulation finalization records wrong-containing response as incorrect zero, preserving other answers", async () => {
  const track = (await catalogPromise).getTrack("coding-interview-dsa-problem-solving");
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: "coding-interview-simulation", request: { sessionId: "bizq01-simulation", scope: { simulationProfileId: track.simulationProfiles![0]!.profileId } }, attempts: [], reviews: [], now: NOW });
  assert.ok(prepared.draft);
  const occurrence = prepared.session.itemOrder.find((entry) => multiple(track.getQuestion(entry.item.questionId)));
  assert.ok(occurrence);
  const question = track.getQuestion(occurrence.item.questionId)!;
  assert.ok(multiple(question));
  const wrong = question.interaction.options.find((option) => !question.answer.optionIds.includes(option.optionId))!.optionId;
  const responsesByOccurrenceId = Object.fromEntries(prepared.session.itemOrder.map((entry) => [entry.occurrenceId, entry === occurrence ? { type: "choice_multiple", optionIds: [...question.answer.optionIds, wrong] } : track.getQuestion(entry.item.questionId)!.answer]));
  const draft = { ...prepared.draft, responsesByOccurrenceId };
  const result = await runtime.finalizeSimulation({ session: prepared.session, draft, attempts: [], reviews: [], now: NOW });
  const attempt = result.attempts.find((entry) => entry.occurrenceId === occurrence.occurrenceId)!;
  assert.deepEqual([attempt.result.kind, attempt.result.earnedPoints], ["incorrect", 0]);
  assert.equal(result.attempts.filter((entry) => entry.result.kind !== "correct").length, 1);
  assert.deepEqual(result.reviewMutations.find((mutation) => mutation.kind === "upsert" && mutation.entry.sourceAttemptId === attempt.id)?.entry.reasons, ["incorrect"]);
});
