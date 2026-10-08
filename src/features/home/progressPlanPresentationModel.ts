import type {
  GuidanceAction,
  TargetDateGuidancePresentation,
  TargetDateGuidanceLocale,
} from "../../application/learningPlan";
import { presentTargetDateGuidance } from "../../application/learningPlan";
import type {
  HomePlanReady,
  HomePlanSnapshot,
  HomePlanUnavailableReason,
} from "../../application/homePlanSnapshotReader";
import type { PackageCompletionState, TrackId } from "../../domain";
import { minimumAttemptsForMentalUnits } from "../../domain/learning/packageCompletionRule";

export type ProgressPlanCompletionPresentation = PackageCompletionState;

export type ProgressPlanReadyPresentation = Readonly<{
  kind: "ready";
  trackId: TrackId;
  guidance: TargetDateGuidancePresentation;
  completion: ProgressPlanCompletionPresentation;
  chapterAccess: HomePlanReady["chapterAccess"];
  day: HomePlanReady["day"];
  activeSession: HomePlanReady["activeSession"];
  session: HomePlanReady["session"];
  primaryAction: GuidanceAction | null;
  secondaryAction: GuidanceAction | null;
}>;

export type ProgressPlanNonePresentation = Readonly<{
  kind: "none";
  trackId: TrackId;
  guidance: TargetDateGuidancePresentation;
  completion: ProgressPlanCompletionPresentation;
  primaryAction: GuidanceAction | null;
  secondaryAction: null;
}>;

export type ProgressPlanUnavailablePresentation = Readonly<{
  kind: "unavailable";
  trackId: TrackId;
  reason: HomePlanUnavailableReason;
}>;

export type ProgressPlanPresentationModel =
  | ProgressPlanReadyPresentation
  | ProgressPlanNonePresentation
  | ProgressPlanUnavailablePresentation;

export type ProgressPlanPresentationInput = Readonly<{
  activeTrackId: TrackId;
  locale: TargetDateGuidanceLocale;
  snapshot: HomePlanSnapshot | null;
}>;

/**
 * Builds the Progress plan section from the already verified Home snapshot.
 * This model intentionally presents canonical guidance; it never recalculates
 * target status or pace and it fails closed when the snapshot identity is not
 * the active track.
 */
export function buildProgressPlanPresentationModel(input: ProgressPlanPresentationInput): ProgressPlanPresentationModel {
  if (input.snapshot === null) return unavailable(input.activeTrackId, "invalid_request");
  if (input.snapshot.trackId !== input.activeTrackId) return unavailable(input.activeTrackId, "identity_mismatch");

  if (input.snapshot.kind === "unavailable") {
    return Object.freeze({ kind: "unavailable", trackId: input.activeTrackId, reason: input.snapshot.reason });
  }

  try {
    const guidance = presentTargetDateGuidance({
      guidance: input.snapshot.guidance,
      locale: input.locale,
      timezone: input.snapshot.kind === "ready" ? input.snapshot.plan.timezone : "UTC",
    });
    const actions = progressActions(
      input.snapshot.guidance.progress.primary,
      input.snapshot.guidance.progress.secondary,
      input.snapshot.kind === "ready" && input.snapshot.activeSession !== null,
    );
    if (input.snapshot.kind === "none") {
      return Object.freeze({
        kind: "none",
        trackId: input.activeTrackId,
        guidance,
        completion: unknownCompletion(),
        primaryAction: actions.primary,
        secondaryAction: null,
      });
    }

    if (!identityMatches(input.snapshot, input.activeTrackId)) {
      return unavailable(input.activeTrackId, "identity_mismatch");
    }
    const completion = presentCompletion(input.snapshot.completion);
    if (completion === null) return unavailable(input.activeTrackId, "calculation_error");
    return Object.freeze({
      kind: "ready",
      trackId: input.activeTrackId,
      guidance,
      completion,
      chapterAccess: input.snapshot.chapterAccess,
      day: input.snapshot.day,
      activeSession: input.snapshot.activeSession,
      session: input.snapshot.session,
      primaryAction: actions.primary,
      secondaryAction: actions.secondary,
    });
  } catch {
    return unavailable(input.activeTrackId, "calculation_error");
  }
}

function identityMatches(snapshot: HomePlanReady, activeTrackId: TrackId): boolean {
  return snapshot.identity.trackId === activeTrackId &&
    snapshot.plan.trackId === activeTrackId &&
    snapshot.goal.record.trackId === activeTrackId &&
    snapshot.goal.revision === snapshot.identity.goalRevision &&
    snapshot.plan.goalRevision === snapshot.identity.goalRevision &&
    snapshot.plan.planId === snapshot.identity.planId &&
    snapshot.plan.planRevision === snapshot.identity.planRevision &&
    snapshot.planSnapshot.revision === snapshot.identity.planStorageRevision &&
    snapshot.planSnapshot.plan.planId === snapshot.identity.planId &&
    snapshot.planSnapshot.plan.planRevision === snapshot.identity.planRevision &&
    snapshot.plan.contentVersion === snapshot.identity.contentVersion &&
    snapshot.planSnapshot.plan.contentVersion === snapshot.identity.contentVersion &&
    snapshot.plan.artifactSha256 === snapshot.identity.artifactSha256 &&
    snapshot.planSnapshot.plan.artifactSha256 === snapshot.identity.artifactSha256 &&
    snapshot.plan.timezone === snapshot.identity.timezone &&
    snapshot.planSnapshot.plan.timezone === snapshot.identity.timezone;
}

function progressActions(primary: GuidanceAction, secondary: GuidanceAction | null, hasActiveSession: boolean): Readonly<{
  primary: GuidanceAction | null;
  secondary: GuidanceAction | null;
}> {
  return Object.freeze({
    // A completed goal already lives on Progress. Never render a self-link.
    primary: primary.kind === "view_progress" || (hasActiveSession && (primary.kind === "continue_plan" || primary.kind === "start_next_session")) ? null : primary,
    secondary,
  });
}

function presentCompletion(value: PackageCompletionState): ProgressPlanCompletionPresentation | null {
  if (value.kind === "unknown") return unknownCompletion();
  if (!Array.isArray(value.chapters) || value.chapters.length === 0 || !isSafeNonNegativeInteger(value.qualifyingAttemptCount) ||
    !isSafePositiveInteger(value.requiredAttemptCount) || !isSafePositiveInteger(value.requiredChapterCount) ||
    !isSafeNonNegativeInteger(value.completedChapterCount) || value.requiredChapterCount !== value.chapters.length ||
    value.qualifyingAttemptCount !== value.chapters.reduce((sum, chapter) => sum + chapter.qualifyingAttemptCount, 0) ||
    value.requiredAttemptCount !== value.chapters.reduce((sum, chapter) => sum + chapter.requiredAttemptCount, 0) ||
    value.completedChapterCount !== value.chapters.filter(chapter => chapter.status === "completed").length ||
    new Set(value.chapters.map(chapter => chapter.nodeId)).size !== value.chapters.length ||
    value.chapters.some(chapter => !chapter.nodeId.trim() || !isSafePositiveInteger(chapter.mentalUnitCount) || !isSafeNonNegativeInteger(chapter.qualifyingAttemptCount) || !isSafePositiveInteger(chapter.requiredAttemptCount) || chapter.requiredAttemptCount !== minimumAttemptsForMentalUnits(chapter.mentalUnitCount) || chapter.rollingWindowSize !== 20 || chapter.qualityThreshold !== 0.8 || !["in_progress", "completed"].includes(chapter.status) || ![null, "minimum_attempts_unmet", "quality_unmet"].includes(chapter.reason) || (chapter.quality !== null && (typeof chapter.quality !== "number" || !Number.isFinite(chapter.quality) || chapter.quality < 0 || chapter.quality > 1)) || (chapter.status === "completed" && (chapter.reason !== null || chapter.quality === null || chapter.qualifyingAttemptCount < chapter.requiredAttemptCount || chapter.quality < 0.8)) || (chapter.status === "in_progress" && chapter.reason === "minimum_attempts_unmet" && chapter.qualifyingAttemptCount >= chapter.requiredAttemptCount) || (chapter.status === "in_progress" && chapter.reason === "quality_unmet" && (chapter.qualifyingAttemptCount < chapter.requiredAttemptCount || chapter.quality === null || chapter.quality >= 0.8)))) return null;
  if (value.kind === "completed") {
    if (value.completedChapterCount !== value.requiredChapterCount || value.remainingAttemptCount !== 0 || value.chapters.some(chapter => chapter.status !== "completed" || chapter.reason !== null || chapter.quality === null || chapter.quality < 0.8)) return null;
    return Object.freeze({ ...value });
  }
  if (value.completedChapterCount >= value.requiredChapterCount || !isSafeNonNegativeInteger(value.remainingAttemptCount) || value.remainingAttemptCount !== value.chapters.reduce((sum, chapter) => sum + Math.max(0, chapter.requiredAttemptCount - chapter.qualifyingAttemptCount), 0)) return null;
  return Object.freeze({ ...value });
}

function unknownCompletion(): ProgressPlanCompletionPresentation {
  return Object.freeze({ kind: "unknown" });
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isSafePositiveInteger(value: unknown): value is number {
  return isSafeNonNegativeInteger(value) && value > 0;
}

function unavailable(trackId: TrackId, reason: HomePlanUnavailableReason): ProgressPlanUnavailablePresentation {
  return Object.freeze({ kind: "unavailable", trackId, reason });
}
