import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItemRef, ReviewQueueEntry, TrainingSessionItemOccurrence } from "../src/domain";
import { AlgorithmContentCatalog } from "../src/tracks/algorithms/algorithmContentCatalog";
import {
  ALGORITHM_MODE_IDS,
  decideAlgorithmReinsert,
  selectAlgorithmReviewItems,
  selectAlgorithmSessionItems,
  type AlgorithmContentGroup,
  type AlgorithmQuestion,
  type AlgorithmQuestionEntry,
} from "../src/tracks/algorithms";

function question(id: string, primarySkillAtomId: string): AlgorithmQuestion {
  return {
    contentVersion: "v1",
    difficulty: "core",
    feedbackModel: {
      decisionSignal: "signal",
      mentalModelCorrection: "correction",
      mistakeTypes: [],
      nextAction: "next",
      result: "diagnostic",
    },
    id,
    learningStage: "guided_application",
    options: [
      { id: `${id}-correct`, isCorrect: true, text: "Correct" },
      { id: `${id}-wrong`, isCorrect: false, text: "Wrong" },
    ],
    primarySkillAtomId,
    prompt: id,
    type: "single_choice",
  };
}

function entries(): readonly AlgorithmQuestionEntry[] {
  const source = question("source", "shared-mechanism");
  const categoryPeer = question("category-peer", "category-peer-skill");
  const skillPeer = question("skill-peer", "shared-mechanism");
  const unrelated = question("unrelated", "other-mechanism");
  const groups = [
    { id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions: [source, categoryPeer] },
    { id: "hash_map_and_set", roadmapNodeId: "hash_map_and_set", questions: [skillPeer] },
    { id: "two_pointers", roadmapNodeId: "two_pointers", questions: [unrelated] },
  ] as const satisfies readonly AlgorithmContentGroup[];
  return groups.flatMap((group) => group.questions.map((entryQuestion) => ({ group, question: entryQuestion })));
}

function review(itemId: string, dueAt = "2026-07-15T09:00:00.000Z"): ReviewQueueEntry {
  return {
    consecutiveAfterDueSuccesses: 0,
    createdAt: "2026-07-14T09:00:00.000Z",
    dueAt,
    id: `review:${itemId}`,
    persistent: true,
    reasons: ["incorrect"],
    sourceAttemptId: `attempt:${itemId}`,
    sourceItem: { contentVersion: "v1", itemId, trackId: "algorithms" },
    sourceSessionId: "prior-session",
    taxonomyOrSkillRefs: [],
    trackId: "algorithms",
  };
}

function ref(itemId: string, contentVersion = "v1", trackId = "algorithms"): ContentItemRef {
  return { contentVersion, itemId, trackId } as ContentItemRef;
}

test("review selects source items first, fills only compatible reviewed content, and shortens exactly", () => {
  const result = selectAlgorithmReviewItems({
    entries: entries(),
    reviewedItemRefs: [ref("source"), ref("skill-peer")],
    requestedLength: 5,
    source: { itemRefs: [ref("source")], kind: "session_misses" },
  });
  assert.deepEqual(result.items.map((item) => item.id), ["source", "skill-peer", "category-peer"]);
  assert.equal(result.actualLength, 3);
  assert.equal(result.requestedLength, 5);
  assert.equal(result.items.some((item) => item.id === "category-peer"), true);
  assert.equal(result.items.some((item) => item.id === "unrelated"), false);
});

test("due review preserves due priority before eligible compatible fill", () => {
  const result = selectAlgorithmReviewItems({
    entries: entries(),
    reviewedItemRefs: [ref("source"), ref("category-peer"), ref("skill-peer")],
    requestedLength: 3,
    source: {
      kind: "due_queue",
      now: "2026-07-15T10:00:00.000Z",
      reviewQueueItems: [review("source", "2026-07-15T08:00:00.000Z")],
    },
  });
  assert.deepEqual(result.items.map((item) => item.id), ["source", "category-peer", "skill-peer"]);
});

test("Algorithms selection adapter excludes other-track review history before strict due selection", () => {
  const questions = Array.from({ length: 30 }, (_, index) => question(`adapter-${index}`, `skill-${index}`));
  const group = {
    id: "arrays_and_strings",
    questions,
    roadmapNodeId: "arrays_and_strings",
  } as const satisfies AlgorithmContentGroup;
  const catalog = new AlgorithmContentCatalog([group]);
  const item = questions[0]!;
  const algorithmReview = { ...review(item.id), sourceItem: catalog.toContentItemRef(item) };
  const cloudReview = {
    ...review("cloud-item"),
    sourceItem: ref("cloud-item", "v1", "cloud-certification"),
    trackId: "cloud-certification",
  } as ReviewQueueEntry;
  const selected = selectAlgorithmSessionItems({
    contentCatalog: catalog,
    mode: ALGORITHM_MODE_IDS.weakAreaReview,
    nodeId: group.roadmapNodeId,
    now: "2026-07-15T10:00:00.000Z",
    reviewQueueItems: [cloudReview, algorithmReview],
    reviewSource: "due_queue",
    sessionLength: 10,
  });
  assert.equal(selected.length, 10);
  assert.equal(selected[0]?.id, item.id);
  assert.equal(selected.some((entry) => entry.id === "cloud-item"), false);
});

test("review rejects missing, stale-version, and cross-track source refs", () => {
  const base = { entries: entries(), requestedLength: 3, reviewedItemRefs: [] };
  assert.throws(() => selectAlgorithmReviewItems({
    ...base,
    source: { itemRefs: [ref("missing")], kind: "session_misses" },
  }), /unavailable in the active catalog/);
  assert.throws(() => selectAlgorithmReviewItems({
    ...base,
    source: { itemRefs: [ref("source", "v0")], kind: "session_misses" },
  }), /stale content version v0/);
  assert.throws(() => selectAlgorithmReviewItems({
    ...base,
    source: { itemRefs: [ref("source", "v1", "cloud-certification")], kind: "session_misses" },
  }), /belongs to track cloud-certification/);
  assert.throws(() => selectAlgorithmReviewItems({
    ...base,
    requestedLength: 1,
    source: { itemRefs: [ref("source"), ref("missing")], kind: "session_misses" },
  }), /unavailable in the active catalog/);
});

function occurrence(occurrenceId: string, itemId: string): TrainingSessionItemOccurrence {
  return { occurrenceId, item: { contentVersion: "v1", itemId, trackId: "algorithms" } };
}

const reinsertEntries = (() => {
  const source = question("source", "shared-mechanism");
  const variant = question("variant", "shared-mechanism");
  const otherOne = question("other-one", "other-one-skill");
  const otherTwo = question("other-two", "other-two-skill");
  const otherThree = question("other-three", "other-three-skill");
  const group = { id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions: [source, variant, otherOne, otherTwo, otherThree] } as const satisfies AlgorithmContentGroup;
  return group.questions.map((entryQuestion) => ({ group, question: entryQuestion }));
})();

const variantPlan = [
  occurrence("source-occurrence", "source"),
  occurrence("middle-one", "other-one"),
  occurrence("middle-two", "other-two"),
  occurrence("middle-three", "other-three"),
  occurrence("exact-occurrence", "source"),
  occurrence("variant-occurrence", "variant"),
] as const;

function decide(overrides: Partial<Parameters<typeof decideAlgorithmReinsert>[0]> = {}) {
  return decideAlgorithmReinsert({
    entries: reinsertEntries,
    mode: ALGORITHM_MODE_IDS.guidedPractice,
    plan: variantPlan,
    reinsertedSourceOccurrenceIds: new Set(),
    reviewedItemRefs: [ref("variant")],
    sourceOccurrenceId: "source-occurrence",
    sourceResult: "incorrect",
    submittedOccurrenceIds: new Set(["source-occurrence", "middle-one", "middle-two", "middle-three"]),
    ...overrides,
  });
}

test("reinsert requires zero, one, and two; three intervening submitted occurrences are eligible", () => {
  assert.deepEqual(decide({ submittedOccurrenceIds: new Set(["source-occurrence"]) }), {
    kind: "no_reinsert", persistentReviewEffect: "unchanged", reason: "insufficient_intervening_submissions", sourceOccurrenceId: "source-occurrence",
  });
  assert.equal(decide({ submittedOccurrenceIds: new Set(["source-occurrence", "middle-one"]) }).kind, "no_reinsert");
  assert.equal(decide({ submittedOccurrenceIds: new Set(["source-occurrence", "middle-one", "middle-two"]) }).kind, "no_reinsert");
  const three = decide();
  assert.equal(three.kind, "scheduled");
  if (three.kind === "scheduled") assert.equal(three.targetOccurrence.occurrenceId, "variant-occurrence");
});

test("reinsert accepts incorrect or partial sources but not a correct source", () => {
  assert.equal(decide({ sourceResult: "incorrect" }).kind, "scheduled");
  assert.equal(decide({ sourceResult: "partial" }).kind, "scheduled");
  assert.deepEqual(decide({ sourceResult: "correct" }), {
    kind: "no_reinsert", persistentReviewEffect: "unchanged", reason: "ineligible_source_result", sourceOccurrenceId: "source-occurrence",
  });
});

test("reinsert prefers a reviewed variant and uses exact content only without one in the remaining plan", () => {
  const preferred = decide();
  assert.equal(preferred.kind, "scheduled");
  if (preferred.kind === "scheduled") assert.equal(preferred.targetOccurrence.occurrenceId, "variant-occurrence");

  const planWithoutVariant = variantPlan.filter((item) => item.occurrenceId !== "variant-occurrence");
  const exact = decide({ plan: planWithoutVariant });
  assert.equal(exact.kind, "scheduled");
  if (exact.kind === "scheduled") assert.equal(exact.targetOccurrence.occurrenceId, "exact-occurrence");
});

test("reinsert preference applies only among occurrences that satisfy the spacing contract", () => {
  const plan = [
    occurrence("source-occurrence", "source"),
    occurrence("early-variant", "variant"),
    occurrence("middle-one", "other-one"),
    occurrence("middle-two", "other-two"),
    occurrence("middle-three", "other-three"),
    occurrence("late-exact", "source"),
  ] as const;
  const decision = decide({
    plan,
    submittedOccurrenceIds: new Set(["source-occurrence", "middle-one", "middle-two", "middle-three"]),
  });
  assert.equal(decision.kind, "scheduled");
  if (decision.kind === "scheduled") assert.equal(decision.targetOccurrence.occurrenceId, "late-exact");
});

test("reinsert excludes unreviewed compatible variants and shortens to exact fallback", () => {
  const decision = decide({ reviewedItemRefs: [] });
  assert.equal(decision.kind, "scheduled");
  if (decision.kind === "scheduled") assert.equal(decision.targetOccurrence.occurrenceId, "exact-occurrence");
});

test("reinsert is maximum once and disabled outside Guided Practice or sourced Weak Area Review", () => {
  assert.deepEqual(decide({ reinsertedSourceOccurrenceIds: new Set(["source-occurrence"]) }), {
    kind: "no_reinsert", persistentReviewEffect: "unchanged", reason: "already_reinserted", sourceOccurrenceId: "source-occurrence",
  });
  const disabledModes = [
    ALGORITHM_MODE_IDS.learnApproach,
    ALGORITHM_MODE_IDS.recognizePatterns,
    ALGORITHM_MODE_IDS.contrastPractice,
    ALGORITHM_MODE_IDS.independentPractice,
    ALGORITHM_MODE_IDS.interviewSimulation,
  ];
  for (const mode of disabledModes) assert.equal(decide({ mode }).kind, "no_reinsert");
  assert.equal(decide({ mode: ALGORITHM_MODE_IDS.weakAreaReview }).kind, "no_reinsert");
  assert.equal(decide({ mode: ALGORITHM_MODE_IDS.weakAreaReview, reviewSource: "due_queue" }).kind, "scheduled");
  assert.equal(decide({ mode: ALGORITHM_MODE_IDS.weakAreaReview, reviewSource: "session_misses" }).kind, "scheduled");
});

test("reinsert leaves the immutable plan unchanged and cannot resolve persistent review", () => {
  const before = structuredClone(variantPlan);
  const decision = decide();
  assert.deepEqual(variantPlan, before);
  assert.equal(decision.persistentReviewEffect, "unchanged");
  assert.equal("resolvesPersistentReview" in decision, false);
  assert.equal(decision.kind, "scheduled");
  if (decision.kind === "scheduled") assert.equal(decision.sameSessionCorrection, true);
});

test("reinsert skips explicitly when no compatible planned occurrence exists", () => {
  const plan = variantPlan.filter((item) => item.item.itemId !== "source" && item.item.itemId !== "variant");
  const sourceFirstPlan = [occurrence("source-occurrence", "source"), ...plan];
  const decision = decide({ plan: sourceFirstPlan });
  assert.deepEqual(decision, {
    kind: "no_reinsert", persistentReviewEffect: "unchanged", reason: "no_compatible_planned_occurrence", sourceOccurrenceId: "source-occurrence",
  });
});

test("reinsert rejects stale-version, cross-track, and missing occurrence refs", () => {
  const staleSource = [...variantPlan];
  staleSource[0] = { occurrenceId: "source-occurrence", item: ref("source", "v0") };
  assert.throws(() => decide({ plan: staleSource }), /source item source has stale content version v0/);

  const crossTrackCandidate = [...variantPlan];
  crossTrackCandidate[3] = { occurrenceId: "exact-occurrence", item: ref("source", "v1", "cloud-certification") };
  assert.throws(() => decide({ plan: crossTrackCandidate }), /candidate occurrence exact-occurrence belongs to track cloud-certification/);

  const missingCandidate = [...variantPlan];
  missingCandidate[3] = { occurrenceId: "exact-occurrence", item: ref("missing") };
  assert.throws(() => decide({ plan: missingCandidate }), /candidate item missing is unavailable in the active catalog/);
});
