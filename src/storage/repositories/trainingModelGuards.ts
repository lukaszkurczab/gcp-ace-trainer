import {
  REVIEW_REASONS,
  createAttemptResult,
  createTrainingSession,
  type AttemptResultComponent,
  isRegisteredTrackId,
  type ContentItemRef,
  type EvidenceRef,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
} from "../../domain";

export function isTrainingSessionArray(value: unknown): value is TrainingSession[] {
  return Array.isArray(value) && value.every(isTrainingSession);
}

export function isTrainingAttemptArray(value: unknown): value is TrainingAttempt<unknown>[] {
  return Array.isArray(value) && value.every(isTrainingAttempt);
}

export function isReviewQueueEntryArray(value: unknown): value is ReviewQueueEntry[] {
  return Array.isArray(value) && value.every(isReviewQueueEntry);
}

export function isTrainingSession(value: unknown): value is TrainingSession {
  if (!isRecord(value)) return false;
  if ("itemRefs" in value || value.status === "expired") return false;
  if (!(typeof value.id === "string" && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) &&
    typeof value.modeId === "string" && typeof value.requestedLength === "number" &&
    typeof value.actualLength === "number" && typeof value.currentItemIndex === "number" && typeof value.startedAt === "string" &&
    (value.completedAt === undefined || typeof value.completedAt === "string") &&
    isOptionOrderByItem(value.optionOrderByItem) && typeof value.activeForegroundMs === "number" &&
    typeof value.contentVersion === "string" &&
    (value.status === "active" || value.status === "completed" || value.status === "abandoned") &&
    Array.isArray(value.itemOrder) && value.itemOrder.every(isContentItemRef))) return false;
  try {
    createTrainingSession({
      id: value.id,
      trackId: value.trackId,
      modeId: value.modeId,
      requestedLength: value.requestedLength,
      actualLength: value.actualLength,
      currentItemIndex: value.currentItemIndex,
      itemOrder: value.itemOrder,
      optionOrderByItem: value.optionOrderByItem,
      activeForegroundMs: value.activeForegroundMs,
      contentVersion: value.contentVersion,
      status: value.status,
      startedAt: value.startedAt,
      completedAt: value.completedAt,
    });
    return true;
  } catch {
    return false;
  }
}

export function isTrainingAttempt(value: unknown): value is TrainingAttempt<unknown> {
  if (!isRecord(value) || "confidence" in value || "itemId" in value || "itemType" in value) return false;
  if (!(typeof value.id === "string" && typeof value.sessionId === "string" && typeof value.trackId === "string" &&
    isRegisteredTrackId(value.trackId) && typeof value.modeId === "string" && isContentItemRef(value.item) &&
    typeof value.answeredAt === "string" && typeof value.committedAt === "string" && isReviewEvidence(value.reviewEvidence))) return false;
  if (!isRecord(value.result) ||
    (value.result.kind !== "correct" && value.result.kind !== "partial" && value.result.kind !== "incorrect") ||
    typeof value.result.earnedPoints !== "number" || typeof value.result.maxPoints !== "number" ||
    (value.result.components !== undefined && !isAttemptResultComponents(value.result.components))) return false;
  try {
    createAttemptResult({
      kind: value.result.kind,
      earnedPoints: value.result.earnedPoints,
      maxPoints: value.result.maxPoints,
      components: value.result.components,
    });
    return true;
  } catch {
    return false;
  }
}

export function isReviewQueueEntry(value: unknown): value is ReviewQueueEntry {
  return isRecord(value) && !("kind" in value) && !("priority" in value) && !("retentionPassedAt" in value) &&
    !("itemId" in value) && typeof value.id === "string" && typeof value.trackId === "string" &&
    isRegisteredTrackId(value.trackId) && typeof value.sourceAttemptId === "string" && typeof value.sourceSessionId === "string" &&
    isReviewEvidence(value) && Array.isArray(value.reasons) && value.reasons.every((reason) =>
      typeof reason === "string" && (REVIEW_REASONS as readonly string[]).includes(reason)) &&
    typeof value.dueAt === "string" && typeof value.createdAt === "string" &&
    Number.isInteger(value.consecutiveAfterDueSuccesses) && Number(value.consecutiveAfterDueSuccesses) >= 0 &&
    typeof value.persistent === "boolean" && (value.lastReviewedAt === undefined || typeof value.lastReviewedAt === "string");
}

function isReviewEvidence(value: unknown): boolean {
  return isRecord(value) && isContentItemRef(value.sourceItem) && Array.isArray(value.taxonomyOrSkillRefs) &&
    value.taxonomyOrSkillRefs.every(isEvidenceRef);
}

function isContentItemRef(value: unknown): value is ContentItemRef {
  return isRecord(value) && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) &&
    typeof value.itemId === "string" && typeof value.contentVersion === "string";
}

function isEvidenceRef(value: unknown): value is EvidenceRef {
  return isRecord(value) && typeof value.axisId === "string" && typeof value.nodeId === "string" &&
    (value.role === undefined || typeof value.role === "string");
}

function isOptionOrderByItem(value: unknown): value is Record<string, readonly string[]> {
  return isRecord(value) && Object.values(value).every((optionIds) =>
    Array.isArray(optionIds) && optionIds.every((optionId) => typeof optionId === "string"));
}

function isAttemptResultComponents(value: unknown): value is AttemptResultComponent[] {
  return Array.isArray(value) && value.every((component) => isRecord(component) &&
    typeof component.id === "string" && typeof component.earnedPoints === "number" &&
    typeof component.maxPoints === "number");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
