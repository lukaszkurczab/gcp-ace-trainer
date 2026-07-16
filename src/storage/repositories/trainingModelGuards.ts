import {
  REVIEW_REASONS,
  createAttemptResult,
  createTrainingSession,
  createTrainingSessionDraft,
  createForegroundTimerState,
  type AttemptResultComponent,
  isRegisteredTrackId,
  type ContentItemRef,
  type EvidenceRef,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionDraft,
  type TrainingSessionDraftResponse,
  type ForegroundTimerState,
} from "../../domain";

export function isTrainingSessionArray(value: unknown): value is TrainingSession[] {
  return Array.isArray(value) && value.every(isTrainingSession);
}

export function isTrainingSessionDraft(value: unknown): value is TrainingSessionDraft {
  if (!isRecord(value) || !hasOnlyKeys(value, ["schemaVersion", "familyId", "draftVersion", "revision", "sessionId", "trackId", "responsesByOccurrenceId", "updatedAt"])) return false;
  if (value.schemaVersion !== 1 || value.draftVersion !== 1 || !isNonEmptyString(value.familyId) || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0 ||
    !isNonEmptyString(value.sessionId) || typeof value.trackId !== "string" || !isRegisteredTrackId(value.trackId) ||
    !isTimestamp(value.updatedAt) || !isDraftResponseRecord(value.responsesByOccurrenceId)) return false;
  try {
    createTrainingSessionDraft({
      schemaVersion: value.schemaVersion,
      familyId: value.familyId,
      draftVersion: value.draftVersion,
      revision: value.revision as number,
      sessionId: value.sessionId,
      trackId: value.trackId,
      responsesByOccurrenceId: value.responsesByOccurrenceId,
      updatedAt: value.updatedAt,
    });
    return true;
  } catch {
    return false;
  }
}

export function isForegroundTimerState(value: unknown): value is ForegroundTimerState {
  if (!isRecord(value) || !hasOnlyKeys(value, ["schemaVersion", "timerVersion", "familyId", "sessionId", "trackId", "accumulatedForegroundMs", "checkpointRevision", "lastCheckpointAt", "running"])) return false;
  if (value.schemaVersion !== 1 || value.timerVersion !== 1 || !isNonEmptyString(value.familyId) || !isNonEmptyString(value.sessionId) ||
    typeof value.trackId !== "string" || !isRegisteredTrackId(value.trackId) || !Number.isSafeInteger(value.accumulatedForegroundMs) || Number(value.accumulatedForegroundMs) < 0 ||
    !Number.isSafeInteger(value.checkpointRevision) || Number(value.checkpointRevision) < 1 || !isTimestamp(value.lastCheckpointAt) || typeof value.running !== "boolean") return false;
  try {
    createForegroundTimerState({
      schemaVersion: value.schemaVersion,
      timerVersion: value.timerVersion,
      familyId: value.familyId,
      sessionId: value.sessionId,
      trackId: value.trackId,
      accumulatedForegroundMs: value.accumulatedForegroundMs as number,
      checkpointRevision: value.checkpointRevision as number,
      lastCheckpointAt: value.lastCheckpointAt,
      running: value.running,
    });
    return true;
  } catch {
    return false;
  }
}

export function isTrainingAttemptArray(value: unknown): value is TrainingAttempt<unknown>[] {
  return Array.isArray(value) && value.every(isTrainingAttempt);
}

export function isReviewQueueEntryArray(value: unknown): value is ReviewQueueEntry[] {
  return Array.isArray(value) && value.every(isReviewQueueEntry);
}

export function isTrainingSession(value: unknown): value is TrainingSession {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ["id", "trackId", "modeId", "configurationSnapshot", "requestedLength", "actualLength", "currentItemIndex", "itemOrder", "optionOrderByOccurrence", "conditionalReinsertSlots", "flaggedOccurrenceIds", "activeForegroundMs", "contentVersion", "status", "startedAt", "completedAt"])) return false;
  if ("itemRefs" in value || value.status === "expired") return false;
  if (!(isNonEmptyString(value.id) && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) &&
    isNonEmptyString(value.modeId) && isConfigurationSnapshot(value.configurationSnapshot) && typeof value.requestedLength === "number" &&
    typeof value.actualLength === "number" && typeof value.currentItemIndex === "number" && isTimestamp(value.startedAt) &&
    (value.completedAt === undefined || isTimestamp(value.completedAt)) &&
    isOptionOrderByOccurrence(value.optionOrderByOccurrence) && Array.isArray(value.conditionalReinsertSlots) && value.conditionalReinsertSlots.every(isConditionalReinsertSlot) && Array.isArray(value.flaggedOccurrenceIds) && value.flaggedOccurrenceIds.every(isNonEmptyString) && typeof value.activeForegroundMs === "number" &&
    typeof value.contentVersion === "string" &&
    (value.status === "active" || value.status === "completed" || value.status === "abandoned") &&
    Array.isArray(value.itemOrder) && value.itemOrder.every(isSessionItemOccurrence))) return false;
  try {
    createTrainingSession({
      id: value.id,
      trackId: value.trackId,
      modeId: value.modeId,
      configurationSnapshot: value.configurationSnapshot,
      requestedLength: value.requestedLength,
      actualLength: value.actualLength,
      currentItemIndex: value.currentItemIndex,
      itemOrder: value.itemOrder,
      optionOrderByOccurrence: value.optionOrderByOccurrence,
      conditionalReinsertSlots: value.conditionalReinsertSlots,
      flaggedOccurrenceIds: value.flaggedOccurrenceIds,
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
  if (!hasOnlyKeys(value, ["id", "sessionId", "trackId", "modeId", "occurrenceId", "item", "response", "result", "reviewEvidence", "answeredAt", "committedAt", "durationMs"])) return false;
  if (!(isNonEmptyString(value.id) && isNonEmptyString(value.sessionId) && typeof value.trackId === "string" &&
    isRegisteredTrackId(value.trackId) && isNonEmptyString(value.modeId) && isNonEmptyString(value.occurrenceId) && isContentItemRef(value.item) &&
    isTimestamp(value.answeredAt) && isTimestamp(value.committedAt) && isJsonValue(value.response) &&
    (value.durationMs === undefined || (Number.isFinite(value.durationMs) && Number(value.durationMs) >= 0)) && isExactReviewEvidence(value.reviewEvidence))) return false;
  if (!isRecord(value.result) ||
    !hasOnlyKeys(value.result, ["kind", "earnedPoints", "maxPoints", "components"]) ||
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
    return value.item.trackId === value.trackId &&
      value.reviewEvidence.sourceItem.trackId === value.trackId &&
      value.reviewEvidence.sourceItem.itemId === value.item.itemId &&
      value.reviewEvidence.sourceItem.contentVersion === value.item.contentVersion;
  } catch {
    return false;
  }
}

export function isReviewQueueEntry(value: unknown): value is ReviewQueueEntry {
  return isRecord(value) && !("kind" in value) && !("priority" in value) && !("retentionPassedAt" in value) &&
    hasOnlyKeys(value, ["id", "trackId", "sourceAttemptId", "sourceSessionId", "sourceItem", "taxonomyOrSkillRefs", "reasons", "dueAt", "createdAt", "consecutiveAfterDueSuccesses", "persistent", "lastReviewedAt"]) &&
    !("itemId" in value) && isNonEmptyString(value.id) && typeof value.trackId === "string" &&
    isRegisteredTrackId(value.trackId) && isNonEmptyString(value.sourceAttemptId) && isNonEmptyString(value.sourceSessionId) &&
    isReviewEvidence(value) && Array.isArray(value.reasons) && value.reasons.every((reason) =>
      typeof reason === "string" && (REVIEW_REASONS as readonly string[]).includes(reason)) &&
    isTimestamp(value.dueAt) && isTimestamp(value.createdAt) &&
    Number.isInteger(value.consecutiveAfterDueSuccesses) && Number(value.consecutiveAfterDueSuccesses) >= 0 &&
    typeof value.persistent === "boolean" && (value.lastReviewedAt === undefined || isTimestamp(value.lastReviewedAt));
}

function isExactReviewEvidence(value: unknown): value is { sourceItem: ContentItemRef; taxonomyOrSkillRefs: EvidenceRef[] } {
  return isRecord(value) && hasOnlyKeys(value, ["sourceItem", "taxonomyOrSkillRefs"]) && isContentItemRef(value.sourceItem) && Array.isArray(value.taxonomyOrSkillRefs) && value.taxonomyOrSkillRefs.every(isEvidenceRef);
}

function isReviewEvidence(value: unknown): boolean {
  return isRecord(value) && isContentItemRef(value.sourceItem) && Array.isArray(value.taxonomyOrSkillRefs) &&
    value.taxonomyOrSkillRefs.every(isEvidenceRef);
}

function isContentItemRef(value: unknown): value is ContentItemRef {
  return isRecord(value) && hasOnlyKeys(value, ["trackId", "itemId", "contentVersion"]) && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) &&
    isNonEmptyString(value.itemId) && isNonEmptyString(value.contentVersion);
}

function isEvidenceRef(value: unknown): value is EvidenceRef {
  return isRecord(value) && hasOnlyKeys(value, ["axisId", "nodeId", "role"]) && isNonEmptyString(value.axisId) && isNonEmptyString(value.nodeId) &&
    (value.role === undefined || isNonEmptyString(value.role));
}

function isSessionItemOccurrence(value: unknown): value is { occurrenceId: string; item: ContentItemRef } {
  return isRecord(value) && hasOnlyKeys(value, ["occurrenceId", "item"]) && isNonEmptyString(value.occurrenceId) && isContentItemRef(value.item);
}

function isConditionalReinsertSlot(value: unknown): boolean {
  return isRecord(value) && hasOnlyKeys(value, ["slotId", "sourceOccurrenceId", "ordinaryBranch", "reviewedVariantBranch", "exactSourceBranch", "resolutionRule"]) &&
    isNonEmptyString(value.slotId) && isNonEmptyString(value.sourceOccurrenceId) && isConditionalReinsertBranch(value.ordinaryBranch) &&
    (value.reviewedVariantBranch === undefined || isConditionalReinsertBranch(value.reviewedVariantBranch)) &&
    (value.exactSourceBranch === undefined || isConditionalReinsertBranch(value.exactSourceBranch)) &&
    value.resolutionRule === "incorrect_or_partial_after_three_materialized_submissions";
}

function isConditionalReinsertBranch(value: unknown): boolean {
  return isRecord(value) && hasOnlyKeys(value, ["occurrence", "optionOrder"]) && isSessionItemOccurrence(value.occurrence) &&
    Array.isArray(value.optionOrder) && value.optionOrder.every(isNonEmptyString) && new Set(value.optionOrder).size === value.optionOrder.length;
}

function isOptionOrderByOccurrence(value: unknown): value is Record<string, readonly string[]> {
  return isRecord(value) && Object.values(value).every((optionIds) =>
    Array.isArray(optionIds) && optionIds.every(isNonEmptyString) && new Set(optionIds).size === optionIds.length);
}

function isConfigurationSnapshot(value: unknown): value is Record<string, string | number | boolean | readonly string[]> {
  return isRecord(value) && Object.keys(value).length > 0 && Object.values(value).every((entry) =>
    typeof entry === "string" || typeof entry === "boolean" || (typeof entry === "number" && Number.isFinite(entry)) ||
    (Array.isArray(entry) && entry.every((item) => typeof item === "string")));
}

function isAttemptResultComponents(value: unknown): value is AttemptResultComponent[] {
  return Array.isArray(value) && value.every((component) => isRecord(component) &&
    hasOnlyKeys(component, ["id", "earnedPoints", "maxPoints"]) &&
    isNonEmptyString(component.id) && typeof component.earnedPoints === "number" &&
    typeof component.maxPoints === "number");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isTimestamp(value: unknown): value is string { return isNonEmptyString(value) && !Number.isNaN(Date.parse(value)); }

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function isDraftResponseRecord(value: unknown): value is Record<string, TrainingSessionDraftResponse> {
  return isRecord(value) && Object.keys(value).every(isNonEmptyString) && Object.values(value).every(isJsonValue);
}
