import type { Settings } from "../../application/appPreferences";
import { APPROACH_CHALLENGE_BLUEPRINT } from "../../application/coding-interview/approachChallengeSelection";
import { algorithmTaxonomyStructure } from "../../tracks/coding-interview/generated/algorithmTaxonomyStructure.generated";

type SavedSettings = NonNullable<Settings["approachChallenge"]>;
export type ApproachChallengeSetupSettings = Omit<SavedSettings, "mode"> & Readonly<{ mode: "manual" }>;
export const ALL_APPROACH_CHALLENGE_FAMILY_IDS = Object.freeze(algorithmTaxonomyStructure.patternFamilies.map(({ id }) => id));
export const DEFAULT_APPROACH_CHALLENGE_SETUP_SETTINGS: ApproachChallengeSetupSettings = Object.freeze({
  mode: "manual", requestedProblemCount: APPROACH_CHALLENGE_BLUEPRINT.defaultRequestedProblemCount, difficulties: APPROACH_CHALLENGE_BLUEPRINT.defaultDifficulties, selectedFamilyIds: ALL_APPROACH_CHALLENGE_FAMILY_IDS,
});

/** Old automatic choices did not use their saved manual IDs. New setup is always manual. */
export function normalizeApproachChallengeSetupSettings(saved?: SavedSettings): ApproachChallengeSetupSettings {
  if (!saved) return DEFAULT_APPROACH_CHALLENGE_SETUP_SETTINGS;
  return Object.freeze({ ...saved, mode: "manual", selectedFamilyIds: saved.mode === "auto" ? ALL_APPROACH_CHALLENGE_FAMILY_IDS : saved.selectedFamilyIds });
}
