import assert from "node:assert/strict";
import test from "node:test";

import type { ContentItemRef, ReviewQueueEntry } from "../src/domain";
import { AlgorithmContentCatalog } from "../src/tracks/algorithms/algorithmContentCatalog";
import {
  ALGORITHM_MODE_IDS,
  selectAlgorithmReviewItems,
  selectAlgorithmSessionItems,
  type AlgorithmContentGroup,
  type AlgorithmQuestion,
  type AlgorithmQuestionEntry,
} from "../src/tracks/algorithms";

function question(id: string, primarySkillAtomId: string): AlgorithmQuestion {
  return {
    contentVersion: "v1", difficulty: "core", id, learningStage: "guided_application", primarySkillAtomId, prompt: id, type: "single_choice",
    feedbackModel: { decisionSignal: "signal", mentalModelCorrection: "correction", mistakeTypes: [], nextAction: "next", result: "diagnostic" },
    options: [{ id: `${id}-correct`, isCorrect: true, text: "Correct" }, { id: `${id}-wrong`, isCorrect: false, text: "Wrong" }],
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
  return { consecutiveAfterDueSuccesses: 0, createdAt: "2026-07-14T09:00:00.000Z", dueAt, id: `review:${itemId}`, persistent: true, reasons: ["incorrect"], sourceAttemptId: `attempt:${itemId}`, sourceItem: ref(itemId), sourceSessionId: "prior-session", taxonomyOrSkillRefs: [], trackId: "algorithms" };
}

function ref(itemId: string, contentVersion = "v1", trackId = "algorithms"): ContentItemRef {
  return { contentVersion, itemId, trackId } as ContentItemRef;
}

test("review selects source first, fills only compatible content, and shortens exactly", () => {
  const result = selectAlgorithmReviewItems({ entries: entries(), reviewedItemRefs: [ref("source"), ref("skill-peer")], requestedLength: 5, source: { itemRefs: [ref("source")], kind: "session_misses" } });
  assert.deepEqual(result.items.map((item) => item.id), ["source", "skill-peer", "category-peer"]);
  assert.equal(result.actualLength, 3);
  assert.equal(result.items.some((item) => item.id === "unrelated"), false);
});

test("due review preserves due priority before compatible fill", () => {
  const result = selectAlgorithmReviewItems({
    entries: entries(), reviewedItemRefs: [ref("source"), ref("category-peer"), ref("skill-peer")], requestedLength: 3,
    source: { kind: "due_queue", now: "2026-07-15T10:00:00.000Z", reviewQueueItems: [review("source", "2026-07-15T08:00:00.000Z")] },
  });
  assert.deepEqual(result.items.map((item) => item.id), ["source", "category-peer", "skill-peer"]);
});

test("selection keeps review sources as sources and excludes other tracks", () => {
  const questions = Array.from({ length: 30 }, (_, index) => question(`adapter-${index}`, `skill-${index}`));
  const group = { id: "arrays_and_strings", questions, roadmapNodeId: "arrays_and_strings" } as const satisfies AlgorithmContentGroup;
  const catalog = new AlgorithmContentCatalog([group]);
  const selected = selectAlgorithmSessionItems({
    contentCatalog: catalog, mode: ALGORITHM_MODE_IDS.weakAreaReview, now: "2026-07-15T10:00:00.000Z", reviewSource: "due_queue", sessionLength: 10,
    reviewQueueItems: [review(questions[0]!.id), { ...review("cloud-item"), sourceItem: ref("cloud-item", "v1", "cloud-certification"), trackId: "cloud-certification" } as ReviewQueueEntry],
  });
  assert.equal(selected[0]?.id, questions[0]!.id);
  assert.equal(selected.some((item) => item.id === "cloud-item"), false);
});

test("review rejects missing, stale, and cross-track source refs", () => {
  const base = { entries: entries(), requestedLength: 3, reviewedItemRefs: [] };
  assert.throws(() => selectAlgorithmReviewItems({ ...base, source: { itemRefs: [ref("missing")], kind: "session_misses" } }), /unavailable in the active catalog/);
  assert.throws(() => selectAlgorithmReviewItems({ ...base, source: { itemRefs: [ref("source", "v0")], kind: "session_misses" } }), /stale content version v0/);
  assert.throws(() => selectAlgorithmReviewItems({ ...base, source: { itemRefs: [ref("source", "v1", "cloud-certification")], kind: "session_misses" } }), /belongs to track cloud-certification/);
});
