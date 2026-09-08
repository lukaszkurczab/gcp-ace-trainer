import { isRegisteredTrackId } from "../../domain/tracks/trackRegistry";
import type { TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";

type GoalOnboardingPreferences = Readonly<{
  dismissedTrackIds: readonly TrackId[];
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

export function dismissGoalOnboarding(trackId: TrackId): void {
  const current = readCanonicalJson(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, isGoalOnboardingPreferences);
  if (current?.dismissedTrackIds.includes(trackId)) return;
  writeCanonicalJson(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, {
    dismissedTrackIds: [...(current?.dismissedTrackIds ?? []), trackId],
  });
}
