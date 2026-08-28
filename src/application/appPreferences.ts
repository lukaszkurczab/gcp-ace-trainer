import {
  getSettings,
  saveSettings,
  type AppearancePreference,
  type LanguagePreference,
  type Settings,
} from "../storage/repositories";

export type { AppearancePreference, LanguagePreference, Settings };

export const DEFAULT_APP_SETTINGS: Settings = Object.freeze({
  appearance: "system",
  language: "en",
});

export async function loadAppSettings(): Promise<Settings> {
  const stored = await getSettings();
  if (!stored) return DEFAULT_APP_SETTINGS;
  return stored;
}

export async function updateAppSettings(settings: Settings): Promise<void> {
  await saveSettings(settings);
}
