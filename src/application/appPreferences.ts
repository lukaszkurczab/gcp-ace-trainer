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
  language: "system",
});

export async function loadAppSettings(): Promise<Settings> {
  return await getSettings() ?? DEFAULT_APP_SETTINGS;
}

export async function updateAppSettings(settings: Settings): Promise<void> {
  await saveSettings(settings);
}
