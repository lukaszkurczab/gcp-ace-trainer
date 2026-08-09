import {
  createTrainingSession,
  type ContentItemRef,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionConditionalReinsertBranch,
  type TrainingSessionConditionalReinsertSlot,
  type TrainingSessionItemOccurrence,
} from "../../domain";
import type { AlgorithmQuestionEntry } from "./algorithmItems";
import type { PublishedAlgorithmsCompatibilitySet } from "../../content/contracts";
import { ALGORITHM_MODE_IDS, type AlgorithmModeId } from "./domain/algorithmModes";
import type { AlgorithmReviewSource } from "./algorithmReviewSelection";

const REINSERT_RESOLUTION_RULE = "incorrect_or_partial_after_three_materialized_submissions" as const;

export type AlgorithmsConditionalReinsertPlanInput = Readonly<{
  entries: readonly AlgorithmQuestionEntry[];
  mode: AlgorithmModeId;
  reviewedItemRefs: readonly ContentItemRef[];
  reviewSource?: AlgorithmReviewSource;
  session: TrainingSession;
  /** Prepared deterministic option orders for catalog items used only in alternate branches. */
  optionOrderByItemId: Readonly<Record<string, readonly string[]>>;
  compatibilitySets: readonly PublishedAlgorithmsCompatibilitySet[];
}>;

export type AlgorithmsConditionalReinsertResolution = Readonly<{
  itemOrder: readonly TrainingSessionItemOccurrence[];
  optionOrderByOccurrence: Readonly<Record<string, readonly string[]>>;
  persistentReviewEffect: "unchanged";
  slots: readonly AlgorithmsResolvedConditionalReinsertSlot[];
}>;

export type AlgorithmsResolvedConditionalReinsertSlot = Readonly<{
  branch: "ordinary" | "reviewed_variant" | "exact_source";
  occurrence: TrainingSessionItemOccurrence;
  optionOrder: readonly string[];
  slotId: string;
  sourceOccurrenceId: string;
}>;

/**
 * Reserves every possible reinsert branch before a session starts. No state is
 * written here: application lifecycle code persists the returned session once.
 */
export function prepareAlgorithmsConditionalReinsertPlan(input: AlgorithmsConditionalReinsertPlanInput): TrainingSession {
  if (!Object.values(ALGORITHM_MODE_IDS).includes(input.mode)) throw new Error(`Unknown Algorithms reinsert mode: ${input.mode}`);
  if (input.session.modeId !== input.mode) throw new Error("Algorithms conditional reinsert mode must match the immutable session mode.");
  if ((input.session.conditionalReinsertSlots?.length ?? 0) > 0) {
    throw new Error("Algorithms conditional reinsert slots must be prepared before the session starts and cannot be replaced.");
  }
  if (input.mode === ALGORITHM_MODE_IDS.weakAreaReview && !input.reviewSource) {
    throw new Error("Algorithms Weak Area Review reinsert preparation requires due_queue or session_misses source.");
  }
  if (!isReinsertEnabled(input.mode, input.reviewSource)) return createTrainingSession({ ...input.session, conditionalReinsertSlots: [] });

  const entryByItemId = new Map(input.entries.map((entry) => [entry.question.id, entry]));
  const planItemIds = new Set<string>();
  for (const occurrence of input.session.itemOrder) {
    const entry = getValidatedEntry(occurrence, entryByItemId, "planned");
    if (planItemIds.has(entry.question.id)) throw new Error("Algorithms reinsert-capable plans cannot duplicate ordinary content identities.");
    planItemIds.add(entry.question.id);
  }
  const reviewedKeys = new Set(input.reviewedItemRefs.map(contentItemRefKey));
  const sortedEntries = reviewedKeys.size > 0 ? [...input.entries].sort(compareEntries) : [];
  const reservedReviewedVariantIds = new Set<string>();
  const slots: TrainingSessionConditionalReinsertSlot[] = [];
  for (let sourceIndex = 0; sourceIndex + 4 < input.session.itemOrder.length; sourceIndex += 1) {
    const sourceOccurrence = input.session.itemOrder[sourceIndex]!;
    const ordinaryOccurrence = input.session.itemOrder[sourceIndex + 4]!;
    const sourceEntry = getValidatedEntry(sourceOccurrence, entryByItemId, "source");
    const compatibleIds = new Set(sourceEntry.question.compatibilityMemberships.flatMap((membership) => {
      const relation = input.compatibilitySets.find((entry) => entry.id === membership);
      if (!relation || relation.relation !== "reviewed_variant") return [];
      return relation.direction === "directed" ? relation.targetItemIds : [...relation.sourceItemIds, ...relation.targetItemIds];
    }));
    const reviewedVariant = sortedEntries
      .find((candidate) => candidate.question.id !== sourceEntry.question.id && compatibleIds.has(candidate.question.id) &&
        reviewedKeys.has(contentItemRefKey(toContentItemRef(candidate, input.session.contentVersion))) &&
        !planItemIds.has(candidate.question.id) && !reservedReviewedVariantIds.has(candidate.question.id));
    const slotId = `${input.session.id}:conditional:${sourceIndex + 4}`;
    const ordinaryBranch = branch(ordinaryOccurrence, input.session.optionOrderByOccurrence[ordinaryOccurrence.occurrenceId] ?? []);
    const alternativeOccurrenceId = reviewedVariant ? `${slotId}:reviewed` : `${slotId}:exact`;
    const alternativeBranch = reviewedVariant
      ? branch({ occurrenceId: alternativeOccurrenceId, item: toContentItemRef(reviewedVariant, input.session.contentVersion) }, requiredOptionOrder(reviewedVariant.question.id, input.optionOrderByItemId))
      : branch({ occurrenceId: alternativeOccurrenceId, item: sourceOccurrence.item }, input.session.optionOrderByOccurrence[sourceOccurrence.occurrenceId] ?? []);
    if (reviewedVariant) reservedReviewedVariantIds.add(reviewedVariant.question.id);
    slots.push(Object.freeze({
      slotId,
      sourceOccurrenceId: sourceOccurrence.occurrenceId,
      ordinaryBranch,
      ...(reviewedVariant ? { reviewedVariantBranch: alternativeBranch } : { exactSourceBranch: alternativeBranch }),
      resolutionRule: REINSERT_RESOLUTION_RULE,
    }));
  }
  return createTrainingSession({ ...input.session, conditionalReinsertSlots: slots });
}

/**
 * Resolves already-persisted branches from materialized immutable attempts.
 * Callers must provide only durable submitted attempts; display, failed writes,
 * abandoned items, and in-memory responses have no representation here.
 */
export function resolveAlgorithmsConditionalReinsertPlan(input: Readonly<{
  materializedAttempts: readonly TrainingAttempt[];
  session: TrainingSession;
}>): AlgorithmsConditionalReinsertResolution {
  const slots = input.session.conditionalReinsertSlots ?? [];
  const slotByOrdinaryOccurrenceId = new Map(slots.map((slot) => [slot.ordinaryBranch.occurrence.occurrenceId, slot]));
  const indexByOccurrenceId = new Map<string, number>();
  input.session.itemOrder.forEach((occurrence, index) => indexByOccurrenceId.set(occurrence.occurrenceId, index));
  for (const slot of slots) {
    indexByOccurrenceId.set(slot.reviewedVariantBranch?.occurrence.occurrenceId ?? slot.exactSourceBranch!.occurrence.occurrenceId, indexByOccurrenceId.get(slot.ordinaryBranch.occurrence.occurrenceId)!);
  }
  const attemptsByOccurrenceId = materializedAttemptsByOccurrence(input.materializedAttempts, input.session, indexByOccurrenceId);
  const resolvedSlots = slots.map((slot) => resolveSlot(slot, input.session, attemptsByOccurrenceId, indexByOccurrenceId));
  const resolutionBySlotId = new Map(resolvedSlots.map((resolved) => [resolved.slotId, resolved]));
  const itemOrder = input.session.itemOrder.map((ordinaryOccurrence) => {
    const slot = slotByOrdinaryOccurrenceId.get(ordinaryOccurrence.occurrenceId);
    return slot ? resolutionBySlotId.get(slot.slotId)!.occurrence : ordinaryOccurrence;
  });
  const optionOrderByOccurrence = Object.fromEntries(itemOrder.map((occurrence) => {
    const slot = slotByOrdinaryOccurrenceId.get(occurrence.occurrenceId);
    const resolved = slot ? resolutionBySlotId.get(slot.slotId)! : undefined;
    return [occurrence.occurrenceId, resolved?.optionOrder ?? input.session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []];
  }));
  return Object.freeze({
    itemOrder: Object.freeze(itemOrder.map(freezeOccurrence)),
    optionOrderByOccurrence: Object.freeze(Object.fromEntries(Object.entries(optionOrderByOccurrence).map(([id, order]) => [id, Object.freeze([...order])]))),
    persistentReviewEffect: "unchanged",
    slots: Object.freeze(resolvedSlots),
  });
}

function resolveSlot(
  slot: TrainingSessionConditionalReinsertSlot,
  session: TrainingSession,
  attemptsByOccurrenceId: ReadonlyMap<string, TrainingAttempt>,
  indexByOccurrenceId: ReadonlyMap<string, number>,
): AlgorithmsResolvedConditionalReinsertSlot {
  const alternative = slot.reviewedVariantBranch ?? slot.exactSourceBranch!;
  const attemptedBranch = attemptsByOccurrenceId.get(slot.ordinaryBranch.occurrence.occurrenceId)
    ? "ordinary"
    : attemptsByOccurrenceId.get(alternative.occurrence.occurrenceId)
      ? (slot.reviewedVariantBranch ? "reviewed_variant" : "exact_source")
      : undefined;
  if (attemptedBranch) return resolvedSlot(slot, attemptedBranch);
  const sourceAttempt = attemptsByOccurrenceId.get(slot.sourceOccurrenceId);
  if (!sourceAttempt || (sourceAttempt.result.kind !== "incorrect" && sourceAttempt.result.kind !== "partial")) return resolvedSlot(slot, "ordinary");
  const sourceIndex = indexByOccurrenceId.get(slot.sourceOccurrenceId)!;
  const targetIndex = indexByOccurrenceId.get(slot.ordinaryBranch.occurrence.occurrenceId)!;
  const interveningDurableSubmissions = [...attemptsByOccurrenceId.values()].filter((attempt) => {
    const index = indexByOccurrenceId.get(attempt.occurrenceId);
    return index !== undefined && index > sourceIndex && index < targetIndex;
  }).length;
  if (interveningDurableSubmissions < 3) return resolvedSlot(slot, "ordinary");
  return resolvedSlot(slot, slot.reviewedVariantBranch ? "reviewed_variant" : "exact_source");
}

function resolvedSlot(slot: TrainingSessionConditionalReinsertSlot, branchKind: AlgorithmsResolvedConditionalReinsertSlot["branch"]): AlgorithmsResolvedConditionalReinsertSlot {
  const branch = branchKind === "ordinary"
    ? slot.ordinaryBranch
    : branchKind === "reviewed_variant"
      ? slot.reviewedVariantBranch!
      : slot.exactSourceBranch!;
  return Object.freeze({ branch: branchKind, occurrence: freezeOccurrence(branch.occurrence), optionOrder: Object.freeze([...branch.optionOrder]), slotId: slot.slotId, sourceOccurrenceId: slot.sourceOccurrenceId });
}

function materializedAttemptsByOccurrence(
  attempts: readonly TrainingAttempt[],
  session: TrainingSession,
  indexByOccurrenceId: ReadonlyMap<string, number>,
): ReadonlyMap<string, TrainingAttempt> {
  const result = new Map<string, TrainingAttempt>();
  for (const attempt of attempts) {
    if (attempt.sessionId !== session.id) continue;
    if (attempt.trackId !== session.trackId || !indexByOccurrenceId.has(attempt.occurrenceId)) {
      throw new Error(`Materialized attempt ${attempt.id} is not a valid occurrence in this immutable Algorithms session plan.`);
    }
    if (result.has(attempt.occurrenceId)) throw new Error(`Immutable session occurrence ${attempt.occurrenceId} has more than one materialized attempt.`);
    result.set(attempt.occurrenceId, attempt);
  }
  return result;
}

function isReinsertEnabled(mode: AlgorithmModeId, reviewSource: AlgorithmReviewSource | undefined): boolean {
  return mode === ALGORITHM_MODE_IDS.guidedPractice || mode === ALGORITHM_MODE_IDS.customPractice ||
    (mode === ALGORITHM_MODE_IDS.weakAreaReview && (reviewSource === "due_queue" || reviewSource === "session_misses"));
}

function getValidatedEntry(
  occurrence: TrainingSessionItemOccurrence,
  entryByItemId: ReadonlyMap<string, AlgorithmQuestionEntry>,
  role: "planned" | "source",
): AlgorithmQuestionEntry {
  if (occurrence.item.trackId !== "coding-interview-dsa-problem-solving") throw new Error(`Algorithms reinsert ${role} occurrence ${occurrence.occurrenceId} belongs to track ${occurrence.item.trackId}.`);
  const entry = entryByItemId.get(occurrence.item.itemId);
  if (!entry) throw new Error(`Algorithms reinsert ${role} item ${occurrence.item.itemId} is unavailable in the active catalog.`);
  if (occurrence.item.contentVersion === "") throw new Error(`Algorithms reinsert ${role} item ${occurrence.item.itemId} has no content version.`);
  return entry;
}

function requiredOptionOrder(itemId: string, optionOrderByItemId: Readonly<Record<string, readonly string[]>>): readonly string[] {
  const optionOrder = optionOrderByItemId[itemId];
  if (!optionOrder) throw new Error(`Algorithms reviewed reinsert branch ${itemId} is missing its prepared option order.`);
  if (new Set(optionOrder).size !== optionOrder.length || optionOrder.some((id) => !id.trim())) throw new Error(`Algorithms reviewed reinsert branch ${itemId} has an invalid prepared option order.`);
  return optionOrder;
}

function branch(occurrence: TrainingSessionItemOccurrence, optionOrder: readonly string[]): TrainingSessionConditionalReinsertBranch {
  return Object.freeze({ occurrence: freezeOccurrence(occurrence), optionOrder: Object.freeze([...optionOrder]) });
}

function toContentItemRef(entry: AlgorithmQuestionEntry, contentVersion: string): ContentItemRef {
  return Object.freeze({ contentVersion, itemId: entry.question.id, trackId: "coding-interview-dsa-problem-solving" });
}

function contentItemRefKey(ref: ContentItemRef): string {
  return `${ref.trackId}:${ref.contentVersion}:${ref.itemId}`;
}

function compareEntries(left: AlgorithmQuestionEntry, right: AlgorithmQuestionEntry): number {
  return left.roadmapNodeId.localeCompare(right.roadmapNodeId) || left.question.id.localeCompare(right.question.id);
}

function freezeOccurrence(occurrence: TrainingSessionItemOccurrence): TrainingSessionItemOccurrence {
  return Object.freeze({ occurrenceId: occurrence.occurrenceId, item: Object.freeze({ ...occurrence.item }) });
}
