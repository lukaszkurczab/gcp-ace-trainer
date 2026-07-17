import type { ContentItemRef, ReviewQueueEntry } from "../../domain";
import type { AlgorithmContentCatalog } from "./algorithmContentCatalog";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
export type AlgorithmReviewSource = "due_queue" | "session_misses";
export type AlgorithmReviewSelectionSource = Readonly<{ kind: "due_queue"; now: string; reviewQueueItems: readonly ReviewQueueEntry[] }> | Readonly<{ itemRefs: readonly ContentItemRef[]; kind: "session_misses" }>;
export type AlgorithmReviewSelection = Readonly<{ actualLength: number; items: readonly AlgorithmQuestion[]; requestedLength: number }>;
/** Compatibility is explicit in the installed bank; same-node and same-skill inference is forbidden. */
export function selectAlgorithmReviewItems(input: Readonly<{ catalog: AlgorithmContentCatalog; reviewedItemRefs: readonly ContentItemRef[]; requestedLength: number; source: AlgorithmReviewSelectionSource }>): AlgorithmReviewSelection {
  const source = input.source;
  const refs = source.kind === "session_misses"
    ? source.itemRefs
    : [...source.reviewQueueItems]
      .filter((entry) => entry.dueAt <= source.now)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id))
      .map((entry) => entry.sourceItem);
  const selected: AlgorithmQuestion[] = [];
  const selectedIds = new Set<string>();
  const add = (item: AlgorithmQuestion) => { if (!selectedIds.has(item.id) && selected.length < input.requestedLength) { selected.push(item); selectedIds.add(item.id); } };
  for (const ref of refs) { if (ref.trackId !== "algorithms" || ref.contentVersion !== input.catalog.getContentVersion()) throw new Error("Algorithms review source is not in the active exact bank."); add(input.catalog.getItemById(ref.itemId)); }
  const reviewed = new Set(input.reviewedItemRefs.filter((ref) => ref.trackId === "algorithms" && ref.contentVersion === input.catalog.getContentVersion()).map((ref) => ref.itemId));
  for (const source of [...selected]) for (const membership of source.compatibilityMemberships) { const relation = input.catalog.getCompatibilitySet(membership); if (!relation) throw new Error(`Algorithms item ${source.id} references an unknown compatibility set.`); const candidates = relation.direction === "directed" ? relation.targetItemIds : [...relation.sourceItemIds, ...relation.targetItemIds]; for (const id of candidates) if (id !== source.id && reviewed.has(id)) add(input.catalog.getItemById(id)); }
  return Object.freeze({ actualLength: selected.length, items: Object.freeze(selected), requestedLength: input.requestedLength }); }
