import type { LanguagePreference } from "../../application/appPreferences";

export type LanguageSettingsOption = Readonly<{
  detailKey?: string;
  labelKey: string;
  value: LanguagePreference;
}>;

export const LANGUAGE_SETTINGS_OPTIONS: readonly LanguageSettingsOption[] = [
  { detailKey: "languageSystemDetail", labelKey: "languageSystem", value: "system" },
  { labelKey: "languageEnglish", value: "en" },
  { labelKey: "languagePolish", value: "pl" },
];
