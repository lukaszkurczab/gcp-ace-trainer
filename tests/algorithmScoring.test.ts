import assert from "node:assert/strict";
import test from "node:test";
import { scoreAlgorithmQuestion, type AlgorithmQuestion } from "../src/tracks/algorithms";
import { buildAlgorithmsReviewQueueUpdate, buildAlgorithmsSubmission } from "../src/features/algorithms/algorithmsSessionModel";
import { abandonTrainingSession, createTrainingSession } from "../src/domain";
import { commitSessionAbandonment, commitTrainingOutcome, recoverPendingMutation } from "../src/application/learningMutations";
import { addReviewQueueItems, getReviewQueueItems } from "../src/storage/repositories";
import { STORAGE_KEYS } from "../src/storage/keys";
import { installMemoryStorage } from "./journalTestSupport";

const feedbackModel = { mentalModelCorrection: "Review.", mistakeTypes: [], nextAction: "Continue.", result: "correct" as const, decisionSignal: "Signal." };
const base = { contentVersion: "algorithms-core", difficulty: "core", learningStage: "foundations", primarySkillAtomId: "skill", prompt: "Prompt", feedbackModel } as const;
const choice = { ...base, id: "choice", type: "single_choice" as const, options: [{ id: "a", text: "A", isCorrect: true }, { id: "b", text: "B", isCorrect: true }, { id: "x", text: "X", isCorrect: false }] } satisfies AlgorithmQuestion;
const ordering = { ...base, id: "ordering", type: "subgoal_ordering" as const, subgoals: ["a", "b", "c", "d"].map((id) => ({ id, text: id })), correctOrder: ["a", "b", "c", "d"] } satisfies AlgorithmQuestion;
const complexity = { ...base, id: "complexity", type: "complexity_check" as const, correctComplexity: { dimensions: [{ id: "time" as const, values: ["O(n)", "O(n^2)"], acceptedValues: ["O(n)"], acceptedAliases: ["linear"] }, { id: "space" as const, values: ["O(1)", "O(n)"], acceptedValues: ["O(1)"] }] } } satisfies AlgorithmQuestion;

test("Algorithms choice scores full set, proper subset, empty, and any wrong option canonically", () => {
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: ["a", "b"] }).result.kind, "correct");
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: ["a"] }).result.kind, "partial");
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: [] }).result.kind, "incorrect");
  assert.equal(scoreAlgorithmQuestion(choice, { kind: "choice", selectedOptionIds: ["a", "x"] }).result.kind, "incorrect");
});

test("Algorithms ordering scores canonical adjacent relations", () => {
  assert.deepEqual(scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["a", "b", "c", "d"] }).result, { kind: "correct", earnedPoints: 3, maxPoints: 3, components: undefined });
  assert.equal(scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["a", "b", "d", "c"] }).result.kind, "partial");
  assert.equal(scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["d", "c", "b", "a"] }).result.kind, "incorrect");
});

test("Algorithms complexity scores dimensions and accepts content-defined aliases", () => {
  assert.equal(scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "O(n)", space: "O(1)" } }).result.kind, "correct");
  assert.equal(scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "linear", space: "O(n)" } }).result.kind, "partial");
  assert.equal(scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "O(n^2)", space: "O(n)" } }).result.kind, "incorrect");
});

test("Algorithms scorer rejects response-kind, ordering, and complexity payload mismatches", () => {
  assert.throws(() => scoreAlgorithmQuestion(choice, { kind: "ordering", orderedSubgoalIds: [] }));
  assert.throws(() => scoreAlgorithmQuestion(ordering, { kind: "ordering", orderedSubgoalIds: ["a", "a", "c", "d"] }));
  assert.throws(() => scoreAlgorithmQuestion(complexity, { kind: "complexity", selectedValuesByDimension: { time: "O(log n)", space: "O(1)" } }));
});

test("Algorithms submission constructs an immutable typed canonical attempt and review entry directly", async () => {
  const session = createTrainingSession({ id: "session", trackId: "algorithms", modeId: "guided", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ trackId: "algorithms", itemId: choice.id, contentVersion: choice.contentVersion }], optionOrderByItem: { [choice.id]: choice.options.map((option) => option.id) }, activeForegroundMs: 0, contentVersion: choice.contentVersion, status: "active", startedAt: "2026-01-01T00:00:00.000Z" });
  const submission = await buildAlgorithmsSubmission({ answeredAt: "2026-01-01T00:01:00.000Z", complexityAnswer: {}, question: choice, selectedOptionIds: ["a", "b"], session });
  assert.equal(Object.isFrozen(submission.attempt), true);
  assert.equal(submission.attempt.sessionId, session.id);
  assert.equal(submission.attempt.response.kind, "choice");
  assert.equal(submission.reviewQueueEntries[0]?.sourceSessionId, session.id);
});

test("Algorithms review resolution exposes the durable entry that must be deleted", async () => {
  const session = createTrainingSession({ id: "session-new", trackId: "algorithms", modeId: "guided", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ trackId: "algorithms", itemId: choice.id, contentVersion: choice.contentVersion }], optionOrderByItem: { [choice.id]: choice.options.map((option) => option.id) }, activeForegroundMs: 0, contentVersion: choice.contentVersion, status: "active", startedAt: "2026-01-03T00:00:00.000Z" });
  const submission = await buildAlgorithmsSubmission({ answeredAt: "2026-01-03T00:01:00.000Z", complexityAnswer: {}, question: choice, selectedOptionIds: ["a", "b"], session });
  const existing = { ...submission.reviewQueueEntries[0]!, id: "review-existing", sourceAttemptId: "older-attempt", sourceSessionId: "older-session", createdAt: "2026-01-01T00:00:00.000Z", dueAt: "2026-01-02T00:00:00.000Z", consecutiveAfterDueSuccesses: 1, persistent: true };
  const update = buildAlgorithmsReviewQueueUpdate(submission, existing);
  assert.equal(update.action, "resolve");
  if (update.action === "resolve") assert.equal(update.reviewQueueEntry.id, existing.id);
});

test("Algorithms incorrect review survives first due success and physically resolves on second with force-close replay", async () => {
  const storage = installMemoryStorage();
  const makeSession = (id: string, startedAt: string) => createTrainingSession({ id, trackId: "algorithms", modeId: "guided", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ trackId: "algorithms", itemId: choice.id, contentVersion: choice.contentVersion }], optionOrderByItem: { [choice.id]: choice.options.map((option) => option.id) }, activeForegroundMs: 0, contentVersion: choice.contentVersion, status: "active", startedAt });
  const incorrect = await buildAlgorithmsSubmission({ answeredAt: "2026-01-01T00:01:00.000Z", complexityAnswer: {}, question: choice, selectedOptionIds: ["a", "x"], session: makeSession("incorrect-session", "2026-01-01T00:00:00.000Z") });
  const originalReview = incorrect.reviewQueueEntries[0]!;
  await addReviewQueueItems([originalReview]);

  const firstSession = makeSession("first-success", "2026-01-03T00:00:00.000Z");
  const firstSuccess = await buildAlgorithmsSubmission({ answeredAt: "2026-01-03T00:01:00.000Z", complexityAnswer: {}, question: choice, selectedOptionIds: ["a", "b"], session: firstSession });
  const firstUpdate = buildAlgorithmsReviewQueueUpdate(firstSuccess, originalReview);
  assert.equal(firstUpdate.action, "keep");
  if (firstUpdate.action !== "keep") throw new Error("First due success unexpectedly resolved review.");
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(firstSession.id) });
  await assert.rejects(() => commitTrainingOutcome({ attempt: firstSuccess.attempt, session: firstSession, reviews: firstUpdate.reviewQueueEntries, createdAt: firstSuccess.attempt.committedAt }));
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  const afterFirst = (await getReviewQueueItems()).value[0]!;
  assert.equal(afterFirst.id, originalReview.id);
  assert.equal(afterFirst.consecutiveAfterDueSuccesses, 1);
  const abandonedAt = "2026-01-03T00:02:00.000Z";
  await commitSessionAbandonment(abandonTrainingSession(firstSession, abandonedAt), abandonedAt);

  const secondSession = makeSession("second-success", "2026-01-04T00:00:00.000Z");
  const secondSuccess = await buildAlgorithmsSubmission({ answeredAt: "2026-01-04T00:01:00.000Z", complexityAnswer: {}, question: choice, selectedOptionIds: ["a", "b"], session: secondSession });
  const secondUpdate = buildAlgorithmsReviewQueueUpdate(secondSuccess, afterFirst);
  assert.equal(secondUpdate.action, "resolve");
  if (secondUpdate.action !== "resolve") throw new Error("Second due success did not resolve review.");
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(secondSession.id) });
  await assert.rejects(() => commitTrainingOutcome({ attempt: secondSuccess.attempt, session: secondSession, reviews: [], resolvedReviews: [secondUpdate.reviewQueueEntry], createdAt: secondSuccess.attempt.committedAt }));
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal((await getReviewQueueItems()).value.length, 0);
  assert.equal(storage.contains(STORAGE_KEYS.reviewEntry(originalReview.id)), false);
});
