import type { ContentItemRef } from "./contentItemRef";
import { InvalidTrainingSessionError } from "./errors";
import type { TrackId } from "./trackIdentity";

export type TrainingSessionStatus = "active" | "completed" | "abandoned";
export type TrainingSessionConfigurationValue = string | number | boolean | readonly string[];
export type TrainingSessionConfigurationSnapshot = Readonly<Record<string, TrainingSessionConfigurationValue>>;
export type TrainingSessionItemOccurrence = Readonly<{
  occurrenceId: string;
  item: ContentItemRef;
}>;

/** A branch is prepared with the session, never created while a session runs. */
export type TrainingSessionConditionalReinsertBranch = Readonly<{
  occurrence: TrainingSessionItemOccurrence;
  optionOrder: readonly string[];
}>;

/**
 * An immutable position in a prepared session plan. `ordinaryBranch` is the
 * occurrence already present in itemOrder; exactly one alternative branch is
 * reserved in advance for an eligible Algorithms reinsert.
 */
export type TrainingSessionConditionalReinsertSlot = Readonly<{
  slotId: string;
  sourceOccurrenceId: string;
  ordinaryBranch: TrainingSessionConditionalReinsertBranch;
  reviewedVariantBranch?: TrainingSessionConditionalReinsertBranch;
  exactSourceBranch?: TrainingSessionConditionalReinsertBranch;
  resolutionRule: "incorrect_or_partial_after_three_materialized_submissions";
}>;

export type TrainingSession = Readonly<{
  id: string;
  trackId: TrackId;
  modeId: string;
  configurationSnapshot: TrainingSessionConfigurationSnapshot;
  requestedLength: number;
  actualLength: number;
  currentItemIndex: number;
  itemOrder: readonly TrainingSessionItemOccurrence[];
  optionOrderByOccurrence: Readonly<Record<string, readonly string[]>>;
  conditionalReinsertSlots?: readonly TrainingSessionConditionalReinsertSlot[];
  activeForegroundMs: number;
  contentVersion: string;
  /** Required for resumability against a bundled artifact; old records remain explicitly unavailable. */
  taxonomyVersion?: string;
  planFingerprint?: string;
  status: TrainingSessionStatus;
  startedAt: string;
  completedAt?: string;
}>;

export type ActiveTrainingSession = TrainingSession & Readonly<{ status: "active"; completedAt?: never }>;
export type CompletedTrainingSession = TrainingSession & Readonly<{ status: "completed"; completedAt: string }>;
export type AbandonedTrainingSession = TrainingSession & Readonly<{ status: "abandoned" }>;

export function isActiveTrainingSession(session: TrainingSession): session is ActiveTrainingSession { return session.status === "active"; }
export function isCompletedTrainingSession(session: TrainingSession): session is CompletedTrainingSession { return session.status === "completed"; }
export function isAbandonedTrainingSession(session: TrainingSession): session is AbandonedTrainingSession { return session.status === "abandoned"; }

export function createTrainingSession(session: TrainingSession): TrainingSession {
  if (session.status !== "active" && session.status !== "completed" && session.status !== "abandoned") {
    throw new InvalidTrainingSessionError("Training session status is unsupported.");
  }
  if (!Number.isInteger(session.requestedLength) || session.requestedLength < 0) {
    throw new InvalidTrainingSessionError("requestedLength must be a non-negative integer.");
  }
  if (!isConfigurationSnapshot(session.configurationSnapshot)) {
    throw new InvalidTrainingSessionError("configurationSnapshot must be a non-empty canonical configuration object.");
  }
  if (!Number.isFinite(session.activeForegroundMs) || session.activeForegroundMs < 0) {
    throw new InvalidTrainingSessionError("activeForegroundMs must be a non-negative finite number.");
  }
  if (!Number.isInteger(session.actualLength) || session.actualLength <= 0) {
    throw new InvalidTrainingSessionError("actualLength must be a positive integer.");
  }
  if (session.requestedLength < session.actualLength) {
    throw new InvalidTrainingSessionError("requestedLength cannot be smaller than actualLength.");
  }
  if (session.actualLength !== session.itemOrder.length) {
    throw new InvalidTrainingSessionError("actualLength must equal itemOrder length.");
  }
  if (!Number.isInteger(session.currentItemIndex) || session.currentItemIndex < 0 || session.currentItemIndex >= session.actualLength) {
    throw new InvalidTrainingSessionError("currentItemIndex must identify an item in itemOrder.");
  }
  if (session.status === "completed" && session.currentItemIndex !== session.actualLength - 1) {
    throw new InvalidTrainingSessionError("A completed session must remain positioned at its final item.");
  }
  if (session.itemOrder.some((occurrence) => !occurrence.occurrenceId.trim() || occurrence.item.trackId !== session.trackId || occurrence.item.contentVersion !== session.contentVersion)) {
    throw new InvalidTrainingSessionError("Every item reference must match the session track and content version.");
  }
  if ((session.taxonomyVersion === undefined) !== (session.planFingerprint === undefined) || (session.taxonomyVersion !== undefined && !session.taxonomyVersion.trim()) || (session.planFingerprint !== undefined && !/^[a-f0-9]{64}$/.test(session.planFingerprint))) {
    throw new InvalidTrainingSessionError("Session content identity must contain a taxonomy version and SHA-256 plan fingerprint.");
  }
  const occurrenceIds = new Set(session.itemOrder.map((occurrence) => occurrence.occurrenceId));
  if (occurrenceIds.size !== session.itemOrder.length) {
    throw new InvalidTrainingSessionError("Session occurrence identities must be unique.");
  }
  if (Object.keys(session.optionOrderByOccurrence).some((occurrenceId) => !occurrenceIds.has(occurrenceId))) {
    throw new InvalidTrainingSessionError("Option order cannot reference an occurrence outside the session.");
  }
  if (Object.values(session.optionOrderByOccurrence).some((optionIds) => new Set(optionIds).size !== optionIds.length)) {
    throw new InvalidTrainingSessionError("Option order cannot contain duplicate option IDs.");
  }
  const conditionalReinsertSlots = session.conditionalReinsertSlots ?? [];
  validateConditionalReinsertSlots(session, conditionalReinsertSlots, occurrenceIds);
  return Object.freeze({
    ...session,
    configurationSnapshot: freezeConfigurationSnapshot(session.configurationSnapshot),
    itemOrder: Object.freeze(session.itemOrder.map((occurrence) => Object.freeze({ ...occurrence, item: Object.freeze({ ...occurrence.item }) }))),
    optionOrderByOccurrence: Object.freeze(Object.fromEntries(Object.entries(session.optionOrderByOccurrence).map(([occurrenceId, optionIds]) => [occurrenceId, Object.freeze([...optionIds])]))),
    conditionalReinsertSlots: Object.freeze(conditionalReinsertSlots.map(freezeConditionalReinsertSlot)),
  });
}

export function accumulateTrainingSessionForegroundTime(session: TrainingSession, elapsedMs: number): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can accumulate foreground time.");
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new InvalidTrainingSessionError("Foreground elapsed time must be non-negative and finite.");
  return createTrainingSession({ ...session, activeForegroundMs: session.activeForegroundMs + elapsedMs });
}

export function areTrainingSessionConfigurationsEqual(left: TrainingSessionConfigurationSnapshot, right: TrainingSessionConfigurationSnapshot): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => JSON.stringify(left[key]) === JSON.stringify(right[key]));
}

export function getCurrentSessionItem(session: TrainingSession): ContentItemRef {
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new InvalidTrainingSessionError("The current session item is unavailable.");
  return occurrence.item;
}

export function moveTrainingSessionToIndex(session: TrainingSession, currentItemIndex: number): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can change position.");
  return createTrainingSession({ ...session, currentItemIndex });
}

export function advanceTrainingSession(session: TrainingSession): TrainingSession {
  if (session.currentItemIndex >= session.actualLength - 1) {
    throw new InvalidTrainingSessionError("The session is already positioned at its final item.");
  }
  return moveTrainingSessionToIndex(session, session.currentItemIndex + 1);
}

export function completeTrainingSession(session: TrainingSession, completedAt: string): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can be completed.");
  return createTrainingSession({ ...session, currentItemIndex: session.actualLength - 1, status: "completed", completedAt });
}

export function abandonTrainingSession(session: TrainingSession, completedAt?: string): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can be abandoned.");
  return createTrainingSession({ ...session, status: "abandoned", completedAt });
}

function isConfigurationSnapshot(value: unknown): value is TrainingSessionConfigurationSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length === 0) return false;
  return Object.entries(value).every(([key, entry]) => key.length > 0 && (
    typeof entry === "string" || typeof entry === "boolean" ||
    (typeof entry === "number" && Number.isFinite(entry)) ||
    (Array.isArray(entry) && entry.every((item) => typeof item === "string"))
  ));
}

function freezeConfigurationSnapshot(snapshot: TrainingSessionConfigurationSnapshot): TrainingSessionConfigurationSnapshot {
  return Object.freeze(Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key, Array.isArray(value) ? Object.freeze([...value]) : value])));
}

function validateConditionalReinsertSlots(
  session: TrainingSession,
  slots: readonly TrainingSessionConditionalReinsertSlot[],
  occurrenceIds: ReadonlySet<string>,
): void {
  const slotIds = new Set<string>();
  const sourceOccurrenceIds = new Set<string>();
  const ordinaryOccurrenceIds = new Set<string>();
  const alternateOccurrenceIds = new Set<string>();
  const itemOrderIndexByOccurrenceId = new Map(session.itemOrder.map((occurrence, index) => [occurrence.occurrenceId, index]));
  for (const slot of slots) {
    if (!slot.slotId.trim() || slotIds.has(slot.slotId)) throw new InvalidTrainingSessionError("Conditional reinsert slot IDs must be unique non-empty strings.");
    slotIds.add(slot.slotId);
    if (!slot.sourceOccurrenceId.trim() || sourceOccurrenceIds.has(slot.sourceOccurrenceId) || !occurrenceIds.has(slot.sourceOccurrenceId)) {
      throw new InvalidTrainingSessionError("A conditional reinsert source must be a unique immutable session occurrence.");
    }
    sourceOccurrenceIds.add(slot.sourceOccurrenceId);
    if (slot.resolutionRule !== "incorrect_or_partial_after_three_materialized_submissions") {
      throw new InvalidTrainingSessionError("Conditional reinsert slots must use the canonical resolution rule.");
    }
    const ordinary = slot.ordinaryBranch;
    const targetIndex = itemOrderIndexByOccurrenceId.get(ordinary.occurrence.occurrenceId);
    const sourceIndex = itemOrderIndexByOccurrenceId.get(slot.sourceOccurrenceId);
    if (targetIndex === undefined || sourceIndex === undefined || targetIndex - sourceIndex < 4 || ordinaryOccurrenceIds.has(ordinary.occurrence.occurrenceId)) {
      throw new InvalidTrainingSessionError("A conditional reinsert slot must reserve one later ordinary plan position after three intervening positions.");
    }
    ordinaryOccurrenceIds.add(ordinary.occurrence.occurrenceId);
    const planOccurrence = session.itemOrder[targetIndex];
    if (!planOccurrence || !sameOccurrence(planOccurrence, ordinary.occurrence) || !sameOptionOrder(session.optionOrderByOccurrence[ordinary.occurrence.occurrenceId] ?? [], ordinary.optionOrder)) {
      throw new InvalidTrainingSessionError("A conditional reinsert ordinary branch must exactly match its persisted plan occurrence and option order.");
    }
    assertBranchMatchesSession(slot.ordinaryBranch, session, false, alternateOccurrenceIds);
    const alternatives = [slot.reviewedVariantBranch, slot.exactSourceBranch].filter((branch): branch is TrainingSessionConditionalReinsertBranch => branch !== undefined);
    if (alternatives.length !== 1) throw new InvalidTrainingSessionError("A conditional reinsert slot must reserve exactly one reviewed-variant or exact-source branch.");
    const sourceOccurrence = session.itemOrder[sourceIndex]!;
    if (slot.reviewedVariantBranch) {
      if (sameContentItem(slot.reviewedVariantBranch.occurrence.item, sourceOccurrence.item)) {
        throw new InvalidTrainingSessionError("A reviewed reinsert branch must not duplicate the exact source item.");
      }
      assertBranchMatchesSession(slot.reviewedVariantBranch, session, true, alternateOccurrenceIds);
    }
    if (slot.exactSourceBranch) {
      if (!sameContentItem(slot.exactSourceBranch.occurrence.item, sourceOccurrence.item)) {
        throw new InvalidTrainingSessionError("An exact-source reinsert branch must reference the source item.");
      }
      assertBranchMatchesSession(slot.exactSourceBranch, session, true, alternateOccurrenceIds);
    }
  }
}

function assertBranchMatchesSession(
  branch: TrainingSessionConditionalReinsertBranch,
  session: TrainingSession,
  alternate: boolean,
  alternateOccurrenceIds: Set<string>,
): void {
  if (!branch.occurrence.occurrenceId.trim() || branch.occurrence.item.trackId !== session.trackId || branch.occurrence.item.contentVersion !== session.contentVersion ||
    new Set(branch.optionOrder).size !== branch.optionOrder.length || branch.optionOrder.some((id) => !id.trim())) {
    throw new InvalidTrainingSessionError("A conditional reinsert branch must contain a valid session-versioned occurrence and unique option order.");
  }
  if (alternate) {
    const planOccurrenceIds = new Set(session.itemOrder.map((occurrence) => occurrence.occurrenceId));
    if (planOccurrenceIds.has(branch.occurrence.occurrenceId) || alternateOccurrenceIds.has(branch.occurrence.occurrenceId)) {
      throw new InvalidTrainingSessionError("Conditional reinsert alternative occurrences must be preallocated unique identities outside ordinary plan occurrences.");
    }
    alternateOccurrenceIds.add(branch.occurrence.occurrenceId);
  }
}

function sameOccurrence(left: TrainingSessionItemOccurrence, right: TrainingSessionItemOccurrence): boolean {
  return left.occurrenceId === right.occurrenceId && sameContentItem(left.item, right.item);
}

function sameContentItem(left: ContentItemRef, right: ContentItemRef): boolean {
  return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion;
}

function sameOptionOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function freezeConditionalReinsertSlot(slot: TrainingSessionConditionalReinsertSlot): TrainingSessionConditionalReinsertSlot {
  return Object.freeze({
    ...slot,
    ordinaryBranch: freezeConditionalReinsertBranch(slot.ordinaryBranch),
    ...(slot.reviewedVariantBranch ? { reviewedVariantBranch: freezeConditionalReinsertBranch(slot.reviewedVariantBranch) } : {}),
    ...(slot.exactSourceBranch ? { exactSourceBranch: freezeConditionalReinsertBranch(slot.exactSourceBranch) } : {}),
  });
}

function freezeConditionalReinsertBranch(branch: TrainingSessionConditionalReinsertBranch): TrainingSessionConditionalReinsertBranch {
  return Object.freeze({
    occurrence: Object.freeze({ ...branch.occurrence, item: Object.freeze({ ...branch.occurrence.item }) }),
    optionOrder: Object.freeze([...branch.optionOrder]),
  });
}
