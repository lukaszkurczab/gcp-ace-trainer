import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSession, type TrainingAttempt, type TrainingSession } from "../src/domain";
import {
  ALGORITHM_MODE_IDS,
  prepareAlgorithmsConditionalReinsertPlan,
  resolveAlgorithmsConditionalReinsertPlan,
  type AlgorithmContentGroup,
  type AlgorithmQuestion,
  type AlgorithmQuestionEntry,
} from "../src/tracks/algorithms";

function question(id: string, primarySkillAtomId: string): AlgorithmQuestion {
  return {
    contentVersion: "v1", difficulty: "core", id, learningStage: "guided_application", primarySkillAtomId, prompt: id, type: "single_choice",
    feedbackModel: { decisionSignal: "signal", mentalModelCorrection: "correction", mistakeTypes: [], nextAction: "next", result: "diagnostic" },
    options: [{ id: `${id}:yes`, isCorrect: true, text: "Yes" }, { id: `${id}:no`, isCorrect: false, text: "No" }],
  };
}

const questions = [question("source", "same-mechanism"), question("middle-1", "m1"), question("middle-2", "m2"), question("middle-3", "m3"), question("ordinary", "m4"), question("reviewed-variant", "same-mechanism")];
const group = { id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions } as const satisfies AlgorithmContentGroup;
const entries: readonly AlgorithmQuestionEntry[] = questions.map((question) => ({ group, question }));

function baseSession(): TrainingSession {
  return createTrainingSession({
    id: "session-conditional", trackId: "algorithms", modeId: ALGORITHM_MODE_IDS.guidedPractice, configurationSnapshot: { kind: "guided" },
    requestedLength: 5, actualLength: 5, currentItemIndex: 0,
    itemOrder: questions.slice(0, 5).map((question, index) => ({ occurrenceId: `occurrence-${index}`, item: { contentVersion: "v1", itemId: question.id, trackId: "algorithms" } })),
    optionOrderByOccurrence: Object.fromEntries(questions.slice(0, 5).map((question, index) => [`occurrence-${index}`, [`${question.id}:yes`, `${question.id}:no`]])),
    flaggedOccurrenceIds: [], activeForegroundMs: 0, contentVersion: "v1", status: "active", startedAt: "2026-07-16T12:00:00.000Z",
  });
}

function prepare(reviewed = true): TrainingSession {
  return prepareAlgorithmsConditionalReinsertPlan({
    entries, mode: ALGORITHM_MODE_IDS.guidedPractice,
    reviewedItemRefs: reviewed ? [{ contentVersion: "v1", itemId: "reviewed-variant", trackId: "algorithms" }] : [],
    optionOrderByItemId: { "reviewed-variant": ["reviewed-variant:no", "reviewed-variant:yes"] },
    session: baseSession(),
  });
}

function attempt(session: TrainingSession, occurrenceId: string, result: "correct" | "partial" | "incorrect" = "correct"): TrainingAttempt {
  const slot = session.conditionalReinsertSlots?.find((candidate) => candidate.reviewedVariantBranch?.occurrence.occurrenceId === occurrenceId || candidate.exactSourceBranch?.occurrence.occurrenceId === occurrenceId);
  const occurrence = session.itemOrder.find((candidate) => candidate.occurrenceId === occurrenceId) ?? slot?.reviewedVariantBranch?.occurrence ?? slot?.exactSourceBranch?.occurrence;
  if (!occurrence) throw new Error(`Unknown fixture occurrence ${occurrenceId}.`);
  return {
    id: `attempt:${occurrenceId}`, sessionId: session.id, trackId: "algorithms", modeId: session.modeId, occurrenceId, item: occurrence.item,
    response: {}, result: { kind: result, earnedPoints: result === "correct" ? 1 : 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-07-16T12:00:00.000Z", committedAt: "2026-07-16T12:00:00.000Z",
  };
}

function attemptsThrough(session: TrainingSession, interveningCount: number, sourceResult: "correct" | "partial" | "incorrect" = "incorrect"): readonly TrainingAttempt[] {
  return [attempt(session, "occurrence-0", sourceResult), ...["occurrence-1", "occurrence-2", "occurrence-3"].slice(0, interveningCount).map((id) => attempt(session, id))];
}

test("conditional slots, alternatives, and option orders are all persisted before first item", () => {
  const session = prepare();
  assert.equal(session.conditionalReinsertSlots?.length, 1);
  const slot = session.conditionalReinsertSlots?.[0]!;
  assert.equal(slot.slotId, "session-conditional:conditional:4");
  assert.equal(slot.sourceOccurrenceId, "occurrence-0");
  assert.equal(slot.ordinaryBranch.occurrence.occurrenceId, "occurrence-4");
  assert.equal(slot.reviewedVariantBranch?.occurrence.item.itemId, "reviewed-variant");
  assert.deepEqual(slot.reviewedVariantBranch?.optionOrder, ["reviewed-variant:no", "reviewed-variant:yes"]);
  assert.equal(slot.exactSourceBranch, undefined);
  assert.equal(slot.resolutionRule, "incorrect_or_partial_after_three_materialized_submissions");
  assert.equal(Object.isFrozen(slot), true);
});

test("zero, one, and two intervening durable submissions resolve ordinary; three resolve exactly one reinsert", () => {
  const session = prepare();
  for (const count of [0, 1, 2]) {
    const resolved = resolveAlgorithmsConditionalReinsertPlan({ materializedAttempts: attemptsThrough(session, count), session });
    assert.equal(resolved.itemOrder[4]?.occurrenceId, "occurrence-4");
  }
  const resolved = resolveAlgorithmsConditionalReinsertPlan({ materializedAttempts: attemptsThrough(session, 3), session });
  assert.equal(resolved.itemOrder[4]?.item.itemId, "reviewed-variant");
  assert.equal(resolved.slots[0]?.branch, "reviewed_variant");
  assert.equal(resolved.persistentReviewEffect, "unchanged");
  assert.equal(new Set(resolved.itemOrder.map((occurrence) => occurrence.item.itemId)).size, resolved.itemOrder.length);
});

test("a reviewed compatible variant wins; exact source is preallocated only when no variant exists", () => {
  const preferred = prepare(true).conditionalReinsertSlots?.[0]!;
  const exact = prepare(false).conditionalReinsertSlots?.[0]!;
  assert.equal(preferred.reviewedVariantBranch?.occurrence.item.itemId, "reviewed-variant");
  assert.equal(preferred.exactSourceBranch, undefined);
  assert.equal(exact.reviewedVariantBranch, undefined);
  assert.equal(exact.exactSourceBranch?.occurrence.item.itemId, "source");
  const resolved = resolveAlgorithmsConditionalReinsertPlan({ materializedAttempts: attemptsThrough(prepare(false), 3), session: prepare(false) });
  assert.equal(resolved.itemOrder[4]?.item.itemId, "source");
  assert.notEqual(resolved.itemOrder[4]?.occurrenceId, "occurrence-0");
});

test("restart resume preserves the same branch, never changes slot order, and creates no review resolution", () => {
  const prepared = prepare();
  const before = structuredClone(prepared.itemOrder);
  const durable = createTrainingSession(JSON.parse(JSON.stringify(prepared)) as TrainingSession);
  const first = resolveAlgorithmsConditionalReinsertPlan({ materializedAttempts: attemptsThrough(durable, 3), session: durable });
  const resumed = resolveAlgorithmsConditionalReinsertPlan({ materializedAttempts: attemptsThrough(durable, 3), session: durable });
  assert.deepEqual(resumed, first);
  assert.deepEqual(durable.itemOrder, before);
  assert.equal(first.itemOrder.length, durable.itemOrder.length);
  assert.equal(first.persistentReviewEffect, "unchanged");
});

test("only permitted modes receive slots and one source can claim at most one fixed slot", () => {
  const disabled = createTrainingSession({ ...baseSession(), modeId: ALGORITHM_MODE_IDS.independentPractice });
  const noSlots = prepareAlgorithmsConditionalReinsertPlan({ entries, mode: ALGORITHM_MODE_IDS.independentPractice, optionOrderByItemId: {}, reviewedItemRefs: [], session: disabled });
  assert.deepEqual(noSlots.conditionalReinsertSlots, []);
  const weakWithoutSource = createTrainingSession({ ...baseSession(), modeId: ALGORITHM_MODE_IDS.weakAreaReview });
  assert.throws(() => prepareAlgorithmsConditionalReinsertPlan({ entries, mode: ALGORITHM_MODE_IDS.weakAreaReview, optionOrderByItemId: {}, reviewedItemRefs: [], session: weakWithoutSource }), /requires due_queue or session_misses source/);
  const session = prepare();
  const sourceIds = session.conditionalReinsertSlots?.map((slot) => slot.sourceOccurrenceId) ?? [];
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  assert.equal(session.conditionalReinsertSlots?.filter((slot) => slot.sourceOccurrenceId === "occurrence-0").length, 1);
});

test("conditional alternatives cannot duplicate a reviewed item across fixed slots", () => {
  const sourceTwo = question("source-two", "same-mechanism");
  const extra = question("extra", "m5");
  const sixItemSession = createTrainingSession({
    ...baseSession(), requestedLength: 6, actualLength: 6,
    itemOrder: [questions[0]!, sourceTwo, questions[1]!, questions[2]!, questions[3]!, extra].map((question, index) => ({ occurrenceId: `many-${index}`, item: { contentVersion: "v1", itemId: question.id, trackId: "algorithms" } })),
    optionOrderByOccurrence: Object.fromEntries([questions[0]!, sourceTwo, questions[1]!, questions[2]!, questions[3]!, extra].map((question, index) => [`many-${index}`, [`${question.id}:yes`, `${question.id}:no`]])),
  });
  const prepared = prepareAlgorithmsConditionalReinsertPlan({
    entries: [...entries, { group, question: sourceTwo }, { group, question: extra }], mode: ALGORITHM_MODE_IDS.guidedPractice,
    reviewedItemRefs: [{ contentVersion: "v1", itemId: "reviewed-variant", trackId: "algorithms" }], optionOrderByItemId: { "reviewed-variant": ["reviewed-variant:yes", "reviewed-variant:no"] }, session: sixItemSession,
  });
  const alternativeItemIds = prepared.conditionalReinsertSlots?.map((slot) => (slot.reviewedVariantBranch ?? slot.exactSourceBranch)!.occurrence.item.itemId) ?? [];
  assert.equal(new Set(alternativeItemIds).size, alternativeItemIds.length);
});

test("only immutable materialized attempts participate in resolution", () => {
  const session = prepare();
  assert.throws(() => resolveAlgorithmsConditionalReinsertPlan({ materializedAttempts: [{ ...attempt(session, "occurrence-0", "incorrect"), occurrenceId: "unknown" }], session }), /not a valid occurrence/);
  assert.throws(() => resolveAlgorithmsConditionalReinsertPlan({ materializedAttempts: [attempt(session, "occurrence-0", "incorrect"), attempt(session, "occurrence-0", "incorrect")], session }), /more than one materialized attempt/);
});
