import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, readCanonicalJson, removeCanonicalValue, withCanonicalWriteLocks, writeCanonicalJson, writeCanonicalJsonUnlocked } from "./canonicalRecordCodec";
import { captureActiveProfileStorageLease, isActiveProfileStorageLeaseCurrent } from "./profileStorageRepository";
import { algorithmTaxonomyStructure } from "../../tracks/coding-interview/generated/algorithmTaxonomyStructure.generated";
export type LanguagePreference = "system" | "en" | "pl" | "de" | "fr" | "es" | "it" | "et";
export type AppearancePreference = "system" | "light" | "dark";
export type Settings = Readonly<{
  appearance: AppearancePreference;
  language: LanguagePreference;
  approachChallenge?: Readonly<{ mode: "auto" | "manual"; requestedProblemCount: 5 | 10 | 20; difficulties: readonly ("easy" | "medium" | "hard")[]; selectedFamilyIds: readonly string[] }>;
}>;

const languagePreferences: readonly LanguagePreference[] = ["system", "en", "pl", "de", "fr", "es", "it", "et"];
const appearancePreferences: readonly AppearancePreference[] = ["system", "light", "dark"];
const approachChallengeFamilyIds = new Set<string>(algorithmTaxonomyStructure.patternFamilies.map(({ id }) => id));

const isSettings = (value: unknown): value is Settings => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  return keys.every((key) => key === "appearance" || key === "language" || key === "approachChallenge") && keys.includes("appearance") && keys.includes("language") &&
    languagePreferences.includes(record.language as LanguagePreference) &&
    appearancePreferences.includes(record.appearance as AppearancePreference) &&
    (record.approachChallenge === undefined || isApproachChallengeSettings(record.approachChallenge));
};
function isApproachChallengeSettings(value: unknown): value is NonNullable<Settings["approachChallenge"]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return Object.keys(candidate).length === 4 && (candidate.mode === "auto" || candidate.mode === "manual") &&
    (candidate.requestedProblemCount === 5 || candidate.requestedProblemCount === 10 || candidate.requestedProblemCount === 20) &&
    Array.isArray(candidate.difficulties) && candidate.difficulties.length > 0 && candidate.difficulties.every((item) => item === "easy" || item === "medium" || item === "hard") &&
    new Set(candidate.difficulties).size === candidate.difficulties.length && Array.isArray(candidate.selectedFamilyIds) &&
    candidate.selectedFamilyIds.every((item) => typeof item === "string" && approachChallengeFamilyIds.has(item)) && new Set(candidate.selectedFamilyIds).size === candidate.selectedFamilyIds.length;
}
export function readSettings(): Settings | null { return readCanonicalJson(STORAGE_KEYS.SETTINGS, isSettings); }
export async function getSettings(): Promise<Settings | null> { return readSettings(); }
export async function saveSettings(settings: Settings): Promise<void> { writeCanonicalJson(STORAGE_KEYS.SETTINGS, settings); }
/** Atomic field patch: retain unrelated provider settings and verify the active profile before publishing. */
export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  const key = STORAGE_KEYS.SETTINGS;
  const lease = captureActiveProfileStorageLease();
  if (lease && !isActiveProfileStorageLeaseCurrent(lease)) throw new Error("settings_profile_changed");
  return withCanonicalWriteLocks([key], () => {
    const current = readCanonicalEnvelope(key, isSettings);
    if (lease && !isActiveProfileStorageLeaseCurrent(lease)) throw new Error("settings_profile_changed");
    const base = current?.payload ?? { appearance: "system", language: "en" } as const;
    const next = Object.freeze({ ...base, ...patch, ...(patch.approachChallenge ? { approachChallenge: Object.freeze({ ...patch.approachChallenge, difficulties: Object.freeze([...patch.approachChallenge.difficulties]), selectedFamilyIds: Object.freeze([...patch.approachChallenge.selectedFamilyIds]) }) } : {}) });
    if (!isSettings(next)) throw new Error("settings_invalid_patch");
    writeCanonicalJsonUnlocked(key, next, current?.revision ?? null);
    if (lease && !isActiveProfileStorageLeaseCurrent(lease)) throw new Error("settings_profile_changed");
    return next;
  });
}
export async function clearSettings(): Promise<void> { removeCanonicalValue(STORAGE_KEYS.SETTINGS); }
