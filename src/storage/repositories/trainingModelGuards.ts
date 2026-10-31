import { isLegacyReviewUnitProof } from "../../domain/learning/mentalUnitEvidence";
import { isCaseAttemptEvidence, CASE_TRACK_ID } from "../../domain/learning/caseEvidence";
import { REVIEW_REASONS, REVIEW_CYCLE_STAGES, isManualRequestId, type ReviewQueueEntry } from "../../domain/learning/reviewQueueEntry";
import { createAttemptResult, type AttemptResultComponent } from "../../domain/learning/attemptResult";
import { isApproachChallengeTrainingAttempt } from "../../tracks/coding-interview/domain/algorithmModes";
import { createTrainingSession, type TrainingSession } from "../../domain/learning/trainingSession";
import { createTrainingSessionDraft, type AcceptedSimulationFinalization, type TrainingSessionDraft, type TrainingSessionDraftResponse } from "../../domain/learning/trainingSessionDraft";
import { createTrainingSessionResult, type TrainingSessionResult } from "../../domain/learning/sessionResult";
import { createForegroundTimerState, type ForegroundTimerState } from "../../domain/learning/foregroundTimerState";
import { isArtifactSha256 } from "../../domain/learning/contentItemRef";
import { isResolvedContentRef, type ResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import type { EvidenceRef } from "../../domain/learning/reviewEvidence";
import type { TrainingAttempt } from "../../domain/learning/trainingAttempt";
import { isTrackAdmitted, type TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";
import { resolvedContentRefsEqual } from "../../domain/learning/resolvedContentRef";

export function isTrainingSessionArray(value: unknown, admission: TrackAdmissionContext): value is TrainingSession[] {
  return Array.isArray(value) && value.every((entry) => isTrainingSession(entry, admission));
}

export function isTrainingSessionResult(value: unknown, admission: TrackAdmissionContext): value is TrainingSessionResult {
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "sessionId", "trackId", "totalOccurrences", "answeredOccurrenceIds", "unansweredOccurrenceIds", "completedAt", "evidence"])) return false;
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.sessionId) || typeof value.trackId !== "string" || !isTrackAdmitted(admission, value.trackId) ||
    typeof value.totalOccurrences !== "number" || !Array.isArray(value.answeredOccurrenceIds) || !value.answeredOccurrenceIds.every(isNonEmptyString) ||
    !Array.isArray(value.unansweredOccurrenceIds) || !value.unansweredOccurrenceIds.every(isNonEmptyString) || !isTimestamp(value.completedAt) || !isRecord(value.evidence)) return false;
  try {
    createTrainingSessionResult({ id: value.id, sessionId: value.sessionId, trackId: value.trackId, totalOccurrences: value.totalOccurrences, answeredOccurrenceIds: value.answeredOccurrenceIds, unansweredOccurrenceIds: value.unansweredOccurrenceIds, completedAt: value.completedAt, evidence: value.evidence as TrainingSessionResult["evidence"] });
    return true;
  } catch { return false; }
}

export function isTrainingSessionDraft(value: unknown, admission: TrackAdmissionContext): value is TrainingSessionDraft {
  if (!isRecord(value) || !hasOnlyKeys(value, ["schemaVersion", "familyId", "draftVersion", "revision", "sessionId", "trackId", "responsesByOccurrenceId", "flaggedOccurrenceIds", "updatedAt"])) return false;
  if (value.schemaVersion !== 1 || value.draftVersion !== 1 || !isNonEmptyString(value.familyId) || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0 ||
    !isNonEmptyString(value.sessionId) || typeof value.trackId !== "string" || !isTrackAdmitted(admission, value.trackId) ||
    !isTimestamp(value.updatedAt) || !isDraftResponseRecord(value.responsesByOccurrenceId) || !Array.isArray(value.flaggedOccurrenceIds) || value.flaggedOccurrenceIds.some((occurrenceId) => !isNonEmptyString(occurrenceId)) || new Set(value.flaggedOccurrenceIds).size !== value.flaggedOccurrenceIds.length) return false;
  try {
    createTrainingSessionDraft({
      schemaVersion: value.schemaVersion,
      familyId: value.familyId,
      draftVersion: value.draftVersion,
      revision: value.revision as number,
      sessionId: value.sessionId,
      trackId: value.trackId,
      responsesByOccurrenceId: value.responsesByOccurrenceId,
      flaggedOccurrenceIds: value.flaggedOccurrenceIds,
      updatedAt: value.updatedAt,
    });
    return true;
  } catch {
    return false;
  }
}

export function isAcceptedSimulationFinalization(value: unknown, admission: TrackAdmissionContext): value is AcceptedSimulationFinalization {
  if (!isRecord(value) || !hasOnlyKeys(value, ["kind", "version", "responseDraft", "acceptance"]) ||
    value.kind !== "accepted_simulation_finalization" || value.version !== 1 || !isTrainingSessionDraft(value.responseDraft, admission) || !isRecord(value.acceptance) ||
    !hasOnlyKeys(value.acceptance, ["commandId", "sessionId", "trackId", "familyId", "trigger", "capturedAt", "semanticsVersion", "sessionRevision", "sessionDigest", "priorDraftEnvelopeRevision", "priorDraftEnvelopeDigest", "reviewProofs"])) return false;
  const acceptance = value.acceptance;
  if (!isSha256(acceptance.commandId) || !isNonEmptyString(acceptance.sessionId) || typeof acceptance.trackId !== "string" || !isTrackAdmitted(admission, acceptance.trackId) ||
    !isNonEmptyString(acceptance.familyId) || !["manual", "countdown-expiry", "absolute-deadline"].includes(String(acceptance.trigger)) ||
    !isTimestamp(acceptance.capturedAt) || acceptance.semanticsVersion !== "simulation-finalization-v1" ||
    !isPositiveSafeInteger(acceptance.sessionRevision) || !isSha256(acceptance.sessionDigest) ||
    !isPositiveSafeInteger(acceptance.priorDraftEnvelopeRevision) || !isSha256(acceptance.priorDraftEnvelopeDigest) ||
    !Array.isArray(acceptance.reviewProofs) || !acceptance.reviewProofs.every(isAcceptedSimulationReviewProof) ||
    new Set(acceptance.reviewProofs.map((proof) => proof.id)).size !== acceptance.reviewProofs.length ||
    acceptance.sessionId !== value.responseDraft.sessionId || acceptance.trackId !== value.responseDraft.trackId) return false;
  return true;
}

export function isTrainingSessionDraftState(value: unknown, admission: TrackAdmissionContext): value is TrainingSessionDraft | AcceptedSimulationFinalization {
  return isTrainingSessionDraft(value, admission) || isAcceptedSimulationFinalization(value, admission);
}

function isAcceptedSimulationReviewProof(value: unknown): value is AcceptedSimulationFinalization["acceptance"]["reviewProofs"][number] {
  return isRecord(value) && hasOnlyKeys(value, ["id", "revision", "digest"]) && isNonEmptyString(value.id) && isPositiveSafeInteger(value.revision) && isSha256(value.digest);
}

function isPositiveSafeInteger(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) > 0; }
function isSha256(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }

export function isForegroundTimerState(value: unknown, admission: TrackAdmissionContext): value is ForegroundTimerState {
  if (!isRecord(value) || !hasOnlyKeys(value, ["schemaVersion", "timerVersion", "familyId", "sessionId", "trackId", "accumulatedForegroundMs", "checkpointRevision", "lastCheckpointAt", "running"])) return false;
  if (value.schemaVersion !== 1 || value.timerVersion !== 1 || !isNonEmptyString(value.familyId) || !isNonEmptyString(value.sessionId) ||
    typeof value.trackId !== "string" || !isTrackAdmitted(admission, value.trackId) || !Number.isSafeInteger(value.accumulatedForegroundMs) || Number(value.accumulatedForegroundMs) < 0 ||
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

export function isTrainingAttemptArray(value: unknown, admission: TrackAdmissionContext): value is TrainingAttempt<unknown>[] {
  return Array.isArray(value) && value.every((entry) => isTrainingAttempt(entry, admission));
}

export function isReviewQueueEntryArray(value: unknown, admission: TrackAdmissionContext): value is ReviewQueueEntry[] {
  return Array.isArray(value) && value.every((entry) => isReviewQueueEntry(entry, admission));
}

export function isTrainingSession(value: unknown, admission: TrackAdmissionContext): value is TrainingSession {
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ["id", "trackId", "modeId", "configurationSnapshot", "requestedLength", "actualLength", "currentItemIndex", "itemOrder", "optionOrderByOccurrence", "conditionalReinsertSlots", "caseState", "caseStates", "activeForegroundMs", "contentVersion", "artifactSha256", "taxonomyVersion", "planFingerprint", "status", "startedAt", "completedAt"])) return false;
  if ("itemRefs" in value || value.status === "expired") return false;
  if (!(isNonEmptyString(value.id) && typeof value.trackId === "string" && isTrackAdmitted(admission, value.trackId) &&
    isNonEmptyString(value.modeId) && isConfigurationSnapshot(value.configurationSnapshot) && typeof value.requestedLength === "number" &&
    typeof value.actualLength === "number" && typeof value.currentItemIndex === "number" && isTimestamp(value.startedAt) &&
    (value.completedAt === undefined || isTimestamp(value.completedAt)) &&
    isOptionOrderByOccurrence(value.optionOrderByOccurrence) && Array.isArray(value.conditionalReinsertSlots) && value.conditionalReinsertSlots.every(isConditionalReinsertSlot) && typeof value.activeForegroundMs === "number" &&
    typeof value.contentVersion === "string" && isArtifactSha256(value.artifactSha256) && (value.taxonomyVersion === undefined || isNonEmptyString(value.taxonomyVersion)) &&
    (value.planFingerprint === undefined || (typeof value.planFingerprint === "string" && /^[a-f0-9]{64}$/.test(value.planFingerprint))) &&
    (value.status === "active" || value.status === "completed" || value.status === "abandoned") &&
    Array.isArray(value.itemOrder) && value.itemOrder.every(isSessionItemOccurrence))) return false;
  try {
    createTrainingSession({
      id: value.id,
      trackId: value.trackId,
      modeId: value.modeId,
      ...(value.caseState === undefined ? {} : { caseState: value.caseState as TrainingSession["caseState"] }),
      ...(value.caseStates === undefined ? {} : { caseStates: value.caseStates as TrainingSession["caseStates"] }),
      configurationSnapshot: value.configurationSnapshot,
      requestedLength: value.requestedLength,
      actualLength: value.actualLength,
      currentItemIndex: value.currentItemIndex,
      itemOrder: value.itemOrder,
      optionOrderByOccurrence: value.optionOrderByOccurrence,
      conditionalReinsertSlots: value.conditionalReinsertSlots,
      activeForegroundMs: value.activeForegroundMs,
      contentVersion: value.contentVersion,
      artifactSha256: value.artifactSha256,
      taxonomyVersion: value.taxonomyVersion,
      planFingerprint: typeof value.planFingerprint === "string" ? value.planFingerprint : undefined,
      status: value.status,
      startedAt: value.startedAt,
      completedAt: value.completedAt,
    });
    return true;
  } catch {
    return false;
  }
}

export function isTrainingAttempt(value: unknown, admission: TrackAdmissionContext): value is TrainingAttempt<unknown> {
  if (!isRecord(value) || "confidence" in value || "itemType" in value) return false;
  if (!hasOnlyKeys(value, ["id", "sessionId", "trackId", "modeId", "occurrenceId", "item", "response", "result", "reviewEvidence", "answeredAt", "committedAt", "durationMs"])) return false;
  if (!(isNonEmptyString(value.id) && isNonEmptyString(value.sessionId) && typeof value.trackId === "string" &&
    isTrackAdmitted(admission, value.trackId) && isNonEmptyString(value.modeId) && isNonEmptyString(value.occurrenceId) && isResolvedContentRef(value.item) &&
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
    }, { allowZeroPointPartial: isApproachChallengeTrainingAttempt(value.trackId, value.modeId) });
    return value.item.trackId === value.trackId &&
      value.reviewEvidence.sourceItem.trackId === value.trackId &&
      resolvedContentRefsEqual(value.reviewEvidence.sourceItem, value.item);
  } catch {
    return false;
  }
}

export function isReviewQueueEntry(value: unknown, admission: TrackAdmissionContext): value is ReviewQueueEntry {
  return isRecord(value) && !("kind" in value) && !("priority" in value) && !("retentionPassedAt" in value) &&
    hasOnlyKeys(value, ["id", "trackId", "sourceAttemptId", "sourceSessionId", "sourceItem", "taxonomyOrSkillRefs", "reasons", "dueAt", "createdAt", "consecutiveAfterDueSuccesses", "persistent", "lastReviewedAt", "policyVersion", "stage", "manualRequestId", "status", "completedAt", "completedByAttemptId"]) &&
    isNonEmptyString(value.id) && typeof value.trackId === "string" &&
    isTrackAdmitted(admission, value.trackId) && isNonEmptyString(value.sourceAttemptId) && isNonEmptyString(value.sourceSessionId) &&
    isReviewEvidence(value) && Array.isArray(value.reasons) && value.reasons.every((reason) =>
      typeof reason === "string" && (REVIEW_REASONS as readonly string[]).includes(reason)) &&
    isTimestamp(value.createdAt) &&
    Number.isInteger(value.consecutiveAfterDueSuccesses) && Number(value.consecutiveAfterDueSuccesses) >= 0 &&
    typeof value.persistent === "boolean" && (value.lastReviewedAt === undefined || isTimestamp(value.lastReviewedAt)) &&
    isValidReviewCycleState(value);
}

function isValidReviewCycleState(value: Record<string, unknown>): boolean {
  if (!Array.isArray(value.reasons)) return false;
  const reasons = value.reasons;
  const hasPolicy = Object.hasOwn(value, "policyVersion");
  const hasStage = Object.hasOwn(value, "stage");
  const hasStatus = Object.hasOwn(value, "status");
  const hasCompletion = Object.hasOwn(value, "completedAt") || Object.hasOwn(value, "completedByAttemptId");
  const hasManualRequestId = Object.hasOwn(value, "manualRequestId");
  if (hasManualRequestId && (!isManualRequestId(value.manualRequestId) || !reasons.includes("manual_mark"))) return false;
  if (!hasPolicy && !hasStage && !hasStatus && !hasCompletion) {
    return isTimestamp(value.dueAt) && Number(value.consecutiveAfterDueSuccesses) <= 1 &&
      ((value.persistent === true && reasons.length === 1 && (reasons[0] === "incorrect" || reasons[0] === "partial")) ||
        (value.persistent === true && reasons.length === 1 && reasons[0] === "manual_mark") ||
        (value.persistent === true && reasons.length === 2 && reasons.includes("manual_mark") && reasons.some((reason) => reason === "incorrect" || reason === "partial" || reason === "scheduled_retrieval")) ||
        (value.persistent === false && hasManualRequestId && reasons.length === 2 && reasons.includes("manual_mark") && reasons.includes("scheduled_retrieval")) ||
        (value.persistent === false && reasons.length === 1 && reasons[0] === "scheduled_retrieval"));
  }
  if (!hasPolicy || !hasStage || !hasStatus || value.policyVersion !== "bizq04-v1" || !REVIEW_CYCLE_STAGES.includes(value.stage as (typeof REVIEW_CYCLE_STAGES)[number])) return false;
  const reasonSet = new Set(reasons);
  if (reasonSet.size !== reasons.length) return false;
  const exactly = (...expected: string[]) => reasons.length === expected.length && expected.every((reason) => reasonSet.has(reason));
  const hasManualReason = reasonSet.has("manual_mark");
  if (hasManualRequestId !== hasManualReason) return false;
  if (value.status === "active") {
    if (hasCompletion || !isTimestamp(value.dueAt)) return false;
    switch (value.stage) {
      case "repair24":
        return value.persistent === true && value.consecutiveAfterDueSuccesses === 0 &&
          (exactly("incorrect") || exactly("partial") || (hasManualReason && (exactly("incorrect", "manual_mark") || exactly("partial", "manual_mark"))));
      case "repair7":
        return value.persistent === true && value.consecutiveAfterDueSuccesses === 1 &&
          (exactly("incorrect") || exactly("partial") || (hasManualReason && (exactly("incorrect", "manual_mark") || exactly("partial", "manual_mark"))));
      case "manual_requested":
        return value.persistent === true && value.consecutiveAfterDueSuccesses === 0 && exactly("manual_mark") && hasManualRequestId;
      case "retention7":
      case "retention14":
      case "retention28":
        return value.persistent === false && value.consecutiveAfterDueSuccesses === 0 &&
          (exactly("scheduled_retrieval") || (hasManualReason && exactly("scheduled_retrieval", "manual_mark")));
    }
  }
  if (value.status === "completed") return !Object.hasOwn(value, "dueAt") && isTimestamp(value.completedAt) &&
    isNonEmptyString(value.completedByAttemptId) && value.stage === "retention28" && value.persistent === false &&
    value.consecutiveAfterDueSuccesses === 0 && !hasManualRequestId && exactly("scheduled_retrieval");
  return false;
}

function isExactReviewEvidence(value: unknown): value is { sourceItem: ResolvedContentRef; taxonomyOrSkillRefs: EvidenceRef[] } {
  return isRecord(value) && hasOnlyKeys(value, ["sourceItem", "taxonomyOrSkillRefs", "evidence"]) && isResolvedContentRef(value.sourceItem) && Array.isArray(value.taxonomyOrSkillRefs) && value.taxonomyOrSkillRefs.every(isEvidenceRef) && (value.evidence === undefined || (value.sourceItem.trackId === CASE_TRACK_ID && isRecord(value.evidence) && hasOnlyKeys(value.evidence, ["familyId", "details"]) && value.evidence.familyId === "certification" && isCaseAttemptEvidence(value.evidence.details)));
}

function isReviewEvidence(value: unknown): boolean {
  return isRecord(value) && isResolvedContentRef(value.sourceItem) && Array.isArray(value.taxonomyOrSkillRefs) &&
    value.taxonomyOrSkillRefs.every(isEvidenceRef);
}

function isEvidenceRef(value: unknown): value is EvidenceRef {
  return isRecord(value) && hasOnlyKeys(value, ["axisId", "nodeId", "role"]) && isNonEmptyString(value.axisId) && isNonEmptyString(value.nodeId) &&
    (value.role === undefined || isNonEmptyString(value.role));
}

function isSessionItemOccurrence(value: unknown): value is { occurrenceId: string; item: ResolvedContentRef } {
  return isRecord(value) && hasOnlyKeys(value, ["occurrenceId", "item", "reviewSourceSnapshot"]) && isNonEmptyString(value.occurrenceId) && isResolvedContentRef(value.item) &&
    (value.reviewSourceSnapshot === undefined || isReviewSourceSnapshot(value.reviewSourceSnapshot));
}

function isReviewSourceSnapshot(value: unknown): boolean {
  if (!isRecord(value) || !hasOnlyKeys(value, ["source", "reviewEntryId", "sourceAttemptId", "manualRequestId", "legacyUnitProof", "dueAt", "policyVersion", "stage"])) return false;
  const exactKeys = ["source", "reviewEntryId", "sourceAttemptId", "dueAt", "policyVersion", "stage", ...(Object.hasOwn(value, "manualRequestId") ? ["manualRequestId"] : []), ...(Object.hasOwn(value, "legacyUnitProof") ? ["legacyUnitProof"] : [])].sort();
  if (Object.keys(value).sort().join("\0") !== exactKeys.join("\0")) return false;
  return (!Object.hasOwn(value, "legacyUnitProof") || isLegacyReviewUnitProof(value.legacyUnitProof)) &&
    (value.source === "due_queue" || value.source === "manual_request") &&
    (value.source !== "manual_request" || isManualRequestId(value.manualRequestId)) &&
    (value.manualRequestId === undefined || isManualRequestId(value.manualRequestId)) && isNonEmptyString(value.reviewEntryId) && isNonEmptyString(value.sourceAttemptId) &&
    isTimestamp(value.dueAt) && isNonEmptyString(value.policyVersion) &&
    ["repair24", "repair7", "manual_requested", "retention7", "retention14", "retention28", "legacy_active_unqualified"].includes(String(value.stage));
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
