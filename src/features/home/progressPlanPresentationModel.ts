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
import { contentPackagePinsEqual, type PackageCompletionState, type TrackId } from "../../domain";

export type ProgressPlanCompletionPresentation = Readonly<{
  kind: PackageCompletionState["kind"];
  qualifyingAttemptCount: number | null;
  requiredAttemptCount: number | null;
  ratio: number | null;
}>;

export type ProgressPlanReadyPresentation = Readonly<{
  kind: "ready";
  trackId: TrackId;
  guidance: TargetDateGuidancePresentation;
  completion: ProgressPlanCompletionPresentation;
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
    contentPackagePinsEqual(snapshot.plan.contentPackagePin, snapshot.identity.contentPackagePin) &&
    contentPackagePinsEqual(snapshot.planSnapshot.plan.contentPackagePin, snapshot.identity.contentPackagePin) &&
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
  if (value.kind === "completed") {
    if (!isSafeNonNegativeInteger(value.qualifyingAttemptCount)) return null;
    return Object.freeze({
      kind: "completed",
      qualifyingAttemptCount: value.qualifyingAttemptCount,
      requiredAttemptCount: null,
      ratio: 1,
    });
  }
  if (!isSafeNonNegativeInteger(value.qualifyingAttemptCount) || !isSafePositiveInteger(value.requiredAttemptCount)) return null;
  return Object.freeze({
    kind: "in_progress",
    qualifyingAttemptCount: value.qualifyingAttemptCount,
    requiredAttemptCount: value.requiredAttemptCount,
    ratio: clampRatio(value.qualifyingAttemptCount / value.requiredAttemptCount),
  });
}

function unknownCompletion(): ProgressPlanCompletionPresentation {
  return Object.freeze({ kind: "unknown", qualifyingAttemptCount: null, requiredAttemptCount: null, ratio: null });
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
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
