import { isRegisteredTrackId } from "../../domain/tracks/trackRegistry";
import type { TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";

type GoalOnboardingPreferences = Readonly<{
  dismissedTrackIds: readonly TrackId[];
}>;

export type GoalOnboardingPreferencesForExport = Readonly<{
  revision: number | null;
  dismissedTrackIds: readonly TrackId[] | null;
}>;

function isGoalOnboardingPreferences(value: unknown): value is GoalOnboardingPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || !Array.isArray(record.dismissedTrackIds)) return false;
  return record.dismissedTrackIds.every((trackId) => typeof trackId === "string" && isRegisteredTrackId(trackId))
    && new Set(record.dismissedTrackIds).size === record.dismissedTrackIds.length;
}

export function isGoalOnboardingDismissed(trackId: TrackId): boolean {
  const preferences = readCanonicalJson(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, isGoalOnboardingPreferences);
  return preferences?.dismissedTrackIds.includes(trackId) ?? false;
}

/** Pure export projection: preserve the canonical revision for snapshot validation. */
export function readGoalOnboardingPreferencesForExport(): GoalOnboardingPreferencesForExport {
  const envelope = readCanonicalEnvelope(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, isGoalOnboardingPreferences);
  return Object.freeze({
    revision: envelope?.revision ?? null,
    dismissedTrackIds: envelope ? Object.freeze([...envelope.payload.dismissedTrackIds]) : null,
  });
}

export function dismissGoalOnboarding(trackId: TrackId): void {
  const current = readCanonicalJson(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, isGoalOnboardingPreferences);
  if (current?.dismissedTrackIds.includes(trackId)) return;
  writeCanonicalJson(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, {
    dismissedTrackIds: [...(current?.dismissedTrackIds ?? []), trackId],
  });
}
