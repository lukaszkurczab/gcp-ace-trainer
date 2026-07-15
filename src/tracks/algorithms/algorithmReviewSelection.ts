import type { ContentItemRef, ReviewQueueEntry, TrainingSessionItemOccurrence } from "../../domain";
import type { AlgorithmQuestionEntry } from "./algorithmItems";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import { ALGORITHM_MODE_IDS, type AlgorithmModeId } from "./domain/algorithmModes";

export type AlgorithmReviewSource = "due_queue" | "session_misses";

export type AlgorithmReviewSelectionSource =
  | Readonly<{ kind: "due_queue"; now: string; reviewQueueItems: readonly ReviewQueueEntry[] }>
  | Readonly<{ itemRefs: readonly ContentItemRef[]; kind: "session_misses" }>;

export type AlgorithmReviewSelection = Readonly<{
  actualLength: number;
  items: readonly AlgorithmQuestion[];
  requestedLength: number;
}>;

export function selectAlgorithmReviewItems(input: {
  entries: readonly AlgorithmQuestionEntry[];
  reviewedItemRefs: readonly ContentItemRef[];
  requestedLength: number;
  source: AlgorithmReviewSelectionSource;
}): AlgorithmReviewSelection {
  const requestedLength = Number.isFinite(input.requestedLength) && input.requestedLength > 0
    ? Math.floor(input.requestedLength)
    : 0;
  const entryByItemId = new Map(input.entries.map((entry) => [entry.question.id, entry]));
  let sourceItems: readonly ContentItemRef[];
  if (input.source.kind === "session_misses") {
    sourceItems = input.source.itemRefs;
  } else {
    const now = input.source.now;
    sourceItems = [...input.source.reviewQueueItems]
      .filter((entry) => entry.dueAt <= now)
      .sort(compareReviewQueueItems)
      .map((entry) => entry.sourceItem);
  }
  const validatedSourceEntries = sourceItems.map((sourceItem) => {
    if (sourceItem.trackId !== "algorithms") {
      throw new Error(`Algorithms review source ${sourceItem.itemId} belongs to track ${sourceItem.trackId}.`);
    }
    const entry = entryByItemId.get(sourceItem.itemId);
    if (!entry) throw new Error(`Algorithms review source ${sourceItem.itemId} is unavailable in the active catalog.`);
    if (sourceItem.contentVersion !== entry.question.contentVersion) {
      throw new Error(`Algorithms review source ${sourceItem.itemId} has stale content version ${sourceItem.contentVersion}.`);
    }
    return entry;
  });
  if (requestedLength === 0) return Object.freeze({ actualLength: 0, items: Object.freeze([]), requestedLength });
  const selectedEntries: AlgorithmQuestionEntry[] = [];
  const selectedItemIds = new Set<string>();
  const reviewedItemRefKeys = new Set(input.reviewedItemRefs.map(contentItemRefKey));

  for (const entry of validatedSourceEntries) {
    if (selectedItemIds.has(entry.question.id)) continue;
    selectedEntries.push(entry);
    selectedItemIds.add(entry.question.id);
    if (selectedEntries.length === requestedLength) break;
  }

  if (selectedEntries.length < requestedLength && selectedEntries.length > 0) {
    const sourceRoadmapNodeIds = new Set(selectedEntries.map((entry) => entry.group.roadmapNodeId));
    const sourceSkillAtomIds = new Set(selectedEntries.map((entry) => entry.question.primarySkillAtomId));
    for (const entry of input.entries) {
      if (selectedItemIds.has(entry.question.id)) continue;
      if (!sourceRoadmapNodeIds.has(entry.group.roadmapNodeId) && !sourceSkillAtomIds.has(entry.question.primarySkillAtomId)) continue;
      if (!reviewedItemRefKeys.has(contentItemRefKey({
        contentVersion: entry.question.contentVersion,
        itemId: entry.question.id,
        trackId: "algorithms",
      }))) continue;
      selectedEntries.push(entry);
      selectedItemIds.add(entry.question.id);
      if (selectedEntries.length === requestedLength) break;
    }
  }

  const items = Object.freeze(selectedEntries.map((entry) => entry.question));
  return Object.freeze({ actualLength: items.length, items, requestedLength });
}

export type AlgorithmReinsertNoResultReason =
  | "disabled_mode"
  | "ineligible_source_result"
  | "already_reinserted"
  | "source_occurrence_missing"
  | "no_compatible_planned_occurrence"
  | "insufficient_intervening_submissions";

export type AlgorithmReinsertDecision =
  | Readonly<{
      kind: "scheduled";
      persistentReviewEffect: "unchanged";
      sameSessionCorrection: true;
      sourceOccurrenceId: string;
      targetOccurrence: TrainingSessionItemOccurrence;
    }>
  | Readonly<{
      kind: "no_reinsert";
      persistentReviewEffect: "unchanged";
      reason: AlgorithmReinsertNoResultReason;
      sourceOccurrenceId: string;
    }>;

export function decideAlgorithmReinsert(input: {
  entries: readonly AlgorithmQuestionEntry[];
  mode: AlgorithmModeId;
  plan: readonly TrainingSessionItemOccurrence[];
  reinsertedSourceOccurrenceIds: ReadonlySet<string>;
  reviewedItemRefs: readonly ContentItemRef[];
  reviewSource?: AlgorithmReviewSource;
  sourceOccurrenceId: string;
  sourceResult: "correct" | "partial" | "incorrect";
  submittedOccurrenceIds: ReadonlySet<string>;
}): AlgorithmReinsertDecision {
  const noReinsert = (reason: AlgorithmReinsertNoResultReason): AlgorithmReinsertDecision => Object.freeze({
    kind: "no_reinsert",
    persistentReviewEffect: "unchanged",
    reason,
    sourceOccurrenceId: input.sourceOccurrenceId,
  });
  const enabled = input.mode === ALGORITHM_MODE_IDS.guidedPractice ||
    (input.mode === ALGORITHM_MODE_IDS.weakAreaReview &&
      (input.reviewSource === "due_queue" || input.reviewSource === "session_misses"));
  if (!enabled) return noReinsert("disabled_mode");
  if (input.sourceResult !== "incorrect" && input.sourceResult !== "partial") return noReinsert("ineligible_source_result");
  if (input.reinsertedSourceOccurrenceIds.has(input.sourceOccurrenceId)) return noReinsert("already_reinserted");

  const sourceIndex = input.plan.findIndex((occurrence) => occurrence.occurrenceId === input.sourceOccurrenceId);
  if (sourceIndex < 0) return noReinsert("source_occurrence_missing");
  const sourceOccurrence = input.plan[sourceIndex]!;
  const entryByItemId = new Map(input.entries.map((entry) => [entry.question.id, entry]));
  const sourceEntry = getValidatedOccurrenceEntry(sourceOccurrence, entryByItemId, "source");
  const reviewedItemRefKeys = new Set(input.reviewedItemRefs.map(contentItemRefKey));

  const remaining = input.plan.slice(sourceIndex + 1).map((occurrence) => ({
    entry: getValidatedOccurrenceEntry(occurrence, entryByItemId, "candidate"),
    occurrence,
  })).filter(({ occurrence }) => !input.submittedOccurrenceIds.has(occurrence.occurrenceId));
  const reviewedVariants = remaining.filter(({ entry, occurrence }) => {
    if (occurrence.item.itemId === sourceOccurrence.item.itemId) return false;
    return entry.question.primarySkillAtomId === sourceEntry.question.primarySkillAtomId &&
      reviewedItemRefKeys.has(contentItemRefKey(occurrence.item));
  });
  const exactCandidates = remaining.filter(({ occurrence }) => occurrence.item.itemId === sourceOccurrence.item.itemId);
  if (reviewedVariants.length === 0 && exactCandidates.length === 0) return noReinsert("no_compatible_planned_occurrence");

  const isSeparatedByTwoSubmissions = (candidate: { occurrence: TrainingSessionItemOccurrence }): boolean => {
    const targetIndex = input.plan.findIndex((occurrence) => occurrence.occurrenceId === candidate.occurrence.occurrenceId);
    const interveningSubmittedCount = input.plan.slice(sourceIndex + 1, targetIndex)
      .filter((occurrence) => input.submittedOccurrenceIds.has(occurrence.occurrenceId)).length;
    return interveningSubmittedCount >= 2;
  };
  const targetOccurrence = (reviewedVariants.find(isSeparatedByTwoSubmissions) ??
    exactCandidates.find(isSeparatedByTwoSubmissions))?.occurrence;
  if (!targetOccurrence) return noReinsert("insufficient_intervening_submissions");

  return Object.freeze({
    kind: "scheduled",
    persistentReviewEffect: "unchanged",
    sameSessionCorrection: true,
    sourceOccurrenceId: input.sourceOccurrenceId,
    targetOccurrence,
  });
}

function getValidatedOccurrenceEntry(
  occurrence: TrainingSessionItemOccurrence,
  entryByItemId: ReadonlyMap<string, AlgorithmQuestionEntry>,
  role: "source" | "candidate",
): AlgorithmQuestionEntry {
  if (occurrence.item.trackId !== "algorithms") {
    throw new Error(`Algorithms reinsert ${role} occurrence ${occurrence.occurrenceId} belongs to track ${occurrence.item.trackId}.`);
  }
  const entry = entryByItemId.get(occurrence.item.itemId);
  if (!entry) throw new Error(`Algorithms reinsert ${role} item ${occurrence.item.itemId} is unavailable in the active catalog.`);
  if (entry.question.contentVersion !== occurrence.item.contentVersion) {
    throw new Error(`Algorithms reinsert ${role} item ${occurrence.item.itemId} has stale content version ${occurrence.item.contentVersion}.`);
  }
  return entry;
}

function compareReviewQueueItems(left: ReviewQueueEntry, right: ReviewQueueEntry): number {
  return left.dueAt.localeCompare(right.dueAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id);
}

function contentItemRefKey(ref: ContentItemRef): string {
  return `${ref.trackId}:${ref.contentVersion}:${ref.itemId}`;
}
