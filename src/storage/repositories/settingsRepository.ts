import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
export type LanguagePreference = "system" | "en" | "pl";
export type AppearancePreference = "system" | "light" | "dark";
export type Settings = Readonly<{
  appearance: AppearancePreference;
  language: LanguagePreference;
}>;

const languagePreferences: readonly LanguagePreference[] = ["system", "en", "pl"];
const appearancePreferences: readonly AppearancePreference[] = ["system", "light", "dark"];

const isSettings = (value: unknown): value is Settings => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2 &&
    languagePreferences.includes(record.language as LanguagePreference) &&
    appearancePreferences.includes(record.appearance as AppearancePreference);
};
export async function getSettings(): Promise<Settings | null> { return readCanonicalJson(STORAGE_KEYS.SETTINGS, isSettings); }
export async function saveSettings(settings: Settings): Promise<void> { writeCanonicalJson(STORAGE_KEYS.SETTINGS, settings); }
export async function clearSettings(): Promise<void> { removeCanonicalValue(STORAGE_KEYS.SETTINGS); }
