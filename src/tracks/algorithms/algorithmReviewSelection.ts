import type { ContentItemRef, ReviewQueueEntry } from "../../domain";
import type { AlgorithmQuestionEntry } from "./algorithmItems";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";

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

  if (selectedEntries.length < requestedLength && selectedEntries.length > 0) {
    const sourceRoadmapNodeIds = new Set(selectedEntries.map((entry) => entry.group.roadmapNodeId));
    const sourceSkillAtomIds = new Set(selectedEntries.map((entry) => entry.question.primarySkillAtomId));
    for (const entry of input.entries) {
      if (selectedItemIds.has(entry.question.id)) continue;
      // The catalog has no implicit family-wide relation: same mental unit or
      // same mechanism is the entire approved repair/contrast boundary.
      if (!sourceRoadmapNodeIds.has(entry.group.roadmapNodeId) && !sourceSkillAtomIds.has(entry.question.primarySkillAtomId)) continue;
      selectedEntries.push(entry);
      selectedItemIds.add(entry.question.id);
      if (selectedEntries.length === requestedLength) break;
    }
  }

  const items = Object.freeze(selectedEntries.map((entry) => entry.question));
  return Object.freeze({ actualLength: items.length, items, requestedLength });
}

function compareReviewQueueItems(left: ReviewQueueEntry, right: ReviewQueueEntry): number {
  return left.dueAt.localeCompare(right.dueAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id);
}

function contentItemRefKey(ref: ContentItemRef): string {
  return `${ref.trackId}:${ref.contentVersion}:${ref.itemId}`;
}
