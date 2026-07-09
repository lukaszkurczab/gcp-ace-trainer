import { isTrackId } from "../../domain";
import type {
  ReviewQueueItem,
  TrainingAttempt,
  TrainingAttemptResponse,
  TrainingSession,
  TrainingSessionItemRef,
  UserProgress,
} from "../../domain/training";

export function isTrainingSessionArray(value: unknown): value is TrainingSession[] {
  return Array.isArray(value) && value.every(isTrainingSession);
}

export function isTrainingAttemptArray(value: unknown): value is TrainingAttempt[] {
  return Array.isArray(value) && value.every(isTrainingAttempt);
}

export function isReviewQueueItemArray(value: unknown): value is ReviewQueueItem[] {
  return Array.isArray(value) && value.every(isReviewQueueItem);
}

export function isUserProgressArray(value: unknown): value is UserProgress[] {
  return Array.isArray(value) && value.every(isUserProgress);
}

function isTrainingSession(value: unknown): value is TrainingSession {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.trackId === "string" &&
    isTrackId(value.trackId) &&
    typeof value.modeId === "string" &&
    isTrainingSessionStatus(value.status) &&
    typeof value.startedAt === "string" &&
    (value.completedAt === undefined || typeof value.completedAt === "string") &&
    typeof value.currentItemIndex === "number" &&
    Array.isArray(value.itemRefs) &&
    value.itemRefs.every(isTrainingSessionItemRef)
  );
}

function isTrainingAttempt(value: unknown): value is TrainingAttempt {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.trackId === "string" &&
    isTrackId(value.trackId) &&
    typeof value.modeId === "string" &&
    typeof value.itemId === "string" &&
    typeof value.itemType === "string" &&
    typeof value.answeredAt === "string" &&
    isTrainingAttemptResponse(value.response)
  );
}

function isReviewQueueItem(value: unknown): value is ReviewQueueItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.trackId === "string" &&
    isTrackId(value.trackId) &&
    typeof value.itemId === "string" &&
    typeof value.sourceAttemptId === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.dueAt === "string" &&
    (value.kind === undefined || value.kind === "remediation" || value.kind === "retention") &&
    (value.retentionPassedAt === undefined || typeof value.retentionPassedAt === "string") &&
    isReviewPriority(value.priority) &&
    Array.isArray(value.reasons) &&
    value.reasons.every(isReviewReason) &&
    (value.lastReviewedAt === undefined || typeof value.lastReviewedAt === "string") &&
    (value.mistakeTypeRefs === undefined || (
      Array.isArray(value.mistakeTypeRefs) &&
      value.mistakeTypeRefs.every(isTrainingItemTaxonomyRef)
    )) &&
    (value.taxonomyRefs === undefined || (
      Array.isArray(value.taxonomyRefs) &&
      value.taxonomyRefs.every(isTrainingItemTaxonomyRef)
    ))
  );
}

function isUserProgress(value: unknown): value is UserProgress {
  return (
    isRecord(value) &&
    typeof value.userId === "string" &&
    typeof value.trackId === "string" &&
    isTrackId(value.trackId) &&
    typeof value.updatedAt === "string" &&
    typeof value.completedSessionCount === "number" &&
    Array.isArray(value.taxonomyProgress) &&
    isRecord(value.reviewQueue) &&
    Array.isArray(value.evidenceSignals)
  );
}

function isTrainingSessionItemRef(value: unknown): value is TrainingSessionItemRef {
  return (
    isRecord(value) &&
    typeof value.itemId === "string" &&
    (value.itemType === undefined || typeof value.itemType === "string") &&
    (value.trackId === undefined || (typeof value.trackId === "string" && isTrackId(value.trackId)))
  );
}

function isTrainingAttemptResponse(value: unknown): value is TrainingAttemptResponse {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return false;
  }

  if (value.kind === "option_selection") {
    return Array.isArray(value.selectedOptionIds);
  }

  if (value.kind === "pattern_selection") {
    return typeof value.selectedPatternId === "string";
  }

  if (value.kind === "strategy_selection") {
    return typeof value.selectedStrategyId === "string";
  }

  if (value.kind === "complexity_check") {
    return isRecord(value.selectedComplexityAnswer);
  }

  if (value.kind === "solution_comparison") {
    return typeof value.selectedSolutionId === "string";
  }

  if (value.kind === "freeform") {
    return typeof value.text === "string";
  }

  return false;
}

function isTrainingSessionStatus(value: unknown): boolean {
  return value === "active" || value === "completed" || value === "abandoned" || value === "expired";
}

function isReviewPriority(value: unknown): boolean {
  return value === "low" || value === "normal" || value === "high" || value === "urgent";
}

function isReviewReason(value: unknown): boolean {
  return (
    value === "incorrect_attempt" ||
    value === "partial_credit" ||
    value === "low_confidence" ||
    value === "repeated_mistake" ||
    value === "manual" ||
    value === "due_spacing"
  );
}

function isTrainingItemTaxonomyRef(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.axisId === "string" &&
    typeof value.nodeId === "string" &&
    (value.role === undefined ||
      value.role === "primary" ||
      value.role === "secondary" ||
      value.role === "prerequisite" ||
      value.role === "mistake_type") &&
    (value.trackId === undefined || (typeof value.trackId === "string" && isTrackId(value.trackId))) &&
    (value.weight === undefined || typeof value.weight === "number")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
