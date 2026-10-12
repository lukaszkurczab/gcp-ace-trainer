import { createTrainingSession } from "../../domain/learning/trainingSession";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createResolvedContentRef, resolvedContentRefsEqual, type ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import type { ReviewSourceSnapshot, TrainingSession } from "../../domain";
import { isCanonicalOptionOrder, prepareCanonicalOptionOrder } from "./canonicalOptionOrder";
import type { TrainingCatalog, TrainingInteractionPort } from "../trainingLifecycle/contracts";

export const CANONICAL_TRAINING_RELEASE = "canonical-content-v1";

export type CanonicalOrderedPlanItem = Readonly<{
  item: ResolvedContentRef;
  reviewSourceSnapshot?: ReviewSourceSnapshot;
}>;

export type CanonicalSessionPlanInput = Readonly<{
  sessionId: string;
  modeId: string;
  configurationSnapshot: TrainingSession["configurationSnapshot"];
  requestedLength: number;
  preparedOccurrences: CanonicalPreparedOccurrences;
  conditionalReinsertSlots: NonNullable<TrainingSession["conditionalReinsertSlots"]>;
  startedAt: string;
}>;

export type CanonicalPreparedOccurrences = Readonly<{
  itemOrder: TrainingSession["itemOrder"];
  optionOrderByOccurrence: TrainingSession["optionOrderByOccurrence"];
}>;

export type CanonicalPlanReplacement = Readonly<{
  targetOccurrenceId: string;
  occurrenceId: string;
  item: ResolvedContentRef;
  optionOrder: readonly string[];
}>;

/** Builds an immutable plan only from a family's already ordered and qualified exact questions. */
export function prepareCanonicalPlanOccurrences(catalog: TrainingCatalog, interactions: TrainingInteractionPort, sessionId: string, orderedItems: readonly CanonicalOrderedPlanItem[]): CanonicalPreparedOccurrences {
  if (!sessionId.trim() || orderedItems.length === 0) throw new Error("Canonical plan occurrences are invalid.");
  const questions = orderedItems.map(({ item }) => {
    const question = catalog.getQuestion(item.questionId);
    const exact = createResolvedContentRef({ trackId: catalog.trackId, questionId: item.questionId, contentVersion: catalog.contentVersion, artifactSha256: catalog.artifactSha256 });
    if (!question || !resolvedContentRefsEqual(item, exact)) throw new Error("Canonical session plan reference is not owned by the exact catalog.");
    return question;
  });
  const items = orderedItems.map(({ item, reviewSourceSnapshot }, index) => {
    return Object.freeze({ occurrenceId: `${sessionId}:occurrence:${index}`, item, ...(reviewSourceSnapshot ? { reviewSourceSnapshot } : {}) });
  });
  const optionOrderByOccurrence = Object.fromEntries(items.map((occurrence, index) => [occurrence.occurrenceId, prepareCanonicalOptionOrder(questions[index]!, occurrence.occurrenceId, occurrence.item, interactions)]));
  return Object.freeze({ itemOrder: Object.freeze(items), optionOrderByOccurrence: Object.freeze(optionOrderByOccurrence) });
}

export async function buildCanonicalSessionPlan(catalog: TrainingCatalog, input: CanonicalSessionPlanInput): Promise<TrainingSession> {
  if (!input.sessionId.trim() || !input.modeId.trim() || !Number.isSafeInteger(input.requestedLength) || input.requestedLength <= 0 || input.preparedOccurrences.itemOrder.length === 0 || input.preparedOccurrences.itemOrder.length > input.requestedLength || !Number.isFinite(Date.parse(input.startedAt))) {
    throw new Error("Canonical session plan inputs are invalid.");
  }
  const base = {
    id: input.sessionId,
    trackId: catalog.trackId,
    modeId: input.modeId,
    configurationSnapshot: input.configurationSnapshot,
    requestedLength: input.requestedLength,
    actualLength: input.preparedOccurrences.itemOrder.length,
    currentItemIndex: 0,
    itemOrder: input.preparedOccurrences.itemOrder,
    optionOrderByOccurrence: input.preparedOccurrences.optionOrderByOccurrence,
    conditionalReinsertSlots: input.conditionalReinsertSlots,
    activeForegroundMs: 0,
    contentVersion: catalog.contentVersion,
    artifactSha256: catalog.artifactSha256,
    taxonomyVersion: CANONICAL_TRAINING_RELEASE,
    status: "active" as const,
    startedAt: input.startedAt,
  };
  return createTrainingSession({ ...base, planFingerprint: await createContentSessionPlanFingerprint(base as TrainingSession & { taxonomyVersion: string }) });
}

/** Structural pinned-record check; family owners perform mode/scope admission first. */
export async function validateCanonicalSessionPlan(catalog: TrainingCatalog, interactions: TrainingInteractionPort, session: TrainingSession): Promise<void> {
  if (session.trackId !== catalog.trackId || session.contentVersion !== catalog.contentVersion || session.artifactSha256 !== catalog.artifactSha256 || session.taxonomyVersion !== CANONICAL_TRAINING_RELEASE || !session.planFingerprint) throw new Error("Canonical session content identity is unavailable.");
  if (session.actualLength !== session.itemOrder.length || session.actualLength > session.requestedLength) throw new Error("Canonical session item plan length is invalid.");
  const occurrenceIds = new Set<string>();
  if (session.itemOrder.some((occurrence) => {
    const question = catalog.getQuestion(occurrence.item.questionId);
    if (!occurrence.occurrenceId.trim() || occurrenceIds.has(occurrence.occurrenceId) || !question || question.trackId !== occurrence.item.trackId || occurrence.item.trackId !== catalog.trackId || occurrence.item.contentVersion !== catalog.contentVersion || occurrence.item.artifactSha256 !== catalog.artifactSha256) return true;
    occurrenceIds.add(occurrence.occurrenceId);
    return false;
  })) throw new Error("Canonical session item reference is unavailable.");
  const orders = session.optionOrderByOccurrence;
  if (Object.keys(orders).length !== session.itemOrder.length || Object.keys(orders).some((id) => !session.itemOrder.some((occurrence) => occurrence.occurrenceId === id))) throw new Error("Canonical session option-order identities are invalid.");
  const validOrder = (item: ResolvedContentRef, order: unknown) => {
    const question = catalog.getQuestion(item.questionId);
    return item.trackId === catalog.trackId && item.contentVersion === catalog.contentVersion && item.artifactSha256 === catalog.artifactSha256 && Boolean(question && isCanonicalOptionOrder(question, order, interactions));
  };
  if (session.itemOrder.some((occurrence) => !validOrder(occurrence.item, orders[occurrence.occurrenceId]))) throw new Error("Canonical session option order is invalid.");
  for (const slot of session.conditionalReinsertSlots ?? []) {
    if (!validOrder(slot.ordinaryBranch.occurrence.item, slot.ordinaryBranch.optionOrder) || JSON.stringify(slot.ordinaryBranch.optionOrder) !== JSON.stringify(orders[slot.ordinaryBranch.occurrence.occurrenceId])) throw new Error("Canonical ordinary reinsertion branch is invalid.");
    if (slot.exactSourceBranch && (!validOrder(slot.exactSourceBranch.occurrence.item, slot.exactSourceBranch.optionOrder) || JSON.stringify(slot.exactSourceBranch.optionOrder) !== JSON.stringify(orders[slot.sourceOccurrenceId]))) throw new Error("Canonical exact-source reinsertion branch is invalid.");
    if (slot.reviewedVariantBranch && !validOrder(slot.reviewedVariantBranch.occurrence.item, slot.reviewedVariantBranch.optionOrder)) throw new Error("Canonical reviewed reinsertion branch is invalid.");
  }
  if (await createContentSessionPlanFingerprint(session as TrainingSession & { taxonomyVersion: string }) !== session.planFingerprint) throw new Error("Canonical session plan fingerprint is invalid.");
}

/** Applies replacements already approved by a family policy; trigger/threshold evaluation stays outside. */
export async function applyCanonicalPlanReplacements(
  session: TrainingSession,
  replacements: readonly CanonicalPlanReplacement[],
  remainingSlots: NonNullable<TrainingSession["conditionalReinsertSlots"]>,
): Promise<TrainingSession> {
  if (replacements.length === 0) return session;
  const itemOrder = [...session.itemOrder];
  const orders = { ...session.optionOrderByOccurrence };
  const targets = new Set<string>();
  const inserted = new Set<string>();
  for (const replacement of replacements) {
    if (targets.has(replacement.targetOccurrenceId) || inserted.has(replacement.occurrenceId)) throw new Error("Canonical family replacement identities are duplicated.");
    if (replacement.item.trackId !== session.trackId || replacement.item.contentVersion !== session.contentVersion || replacement.item.artifactSha256 !== session.artifactSha256 || !replacement.occurrenceId.trim() || replacement.optionOrder.length === 0) throw new Error("Canonical family replacement is outside the exact session pin.");
    targets.add(replacement.targetOccurrenceId);
    inserted.add(replacement.occurrenceId);
    const targetIndex = itemOrder.findIndex((occurrence) => occurrence.occurrenceId === replacement.targetOccurrenceId);
    if (targetIndex < 0 || itemOrder.some((occurrence) => occurrence.occurrenceId === replacement.occurrenceId)) throw new Error("Canonical family replacement does not match the current plan.");
    itemOrder[targetIndex] = Object.freeze({ occurrenceId: replacement.occurrenceId, item: replacement.item });
    delete orders[replacement.targetOccurrenceId];
    orders[replacement.occurrenceId] = replacement.optionOrder;
  }
  const candidate = createTrainingSession({ ...session, itemOrder, optionOrderByOccurrence: orders, conditionalReinsertSlots: remainingSlots, planFingerprint: undefined, taxonomyVersion: undefined });
  return createTrainingSession({ ...candidate, taxonomyVersion: CANONICAL_TRAINING_RELEASE, planFingerprint: await createContentSessionPlanFingerprint({ ...candidate, taxonomyVersion: CANONICAL_TRAINING_RELEASE }) });
}
