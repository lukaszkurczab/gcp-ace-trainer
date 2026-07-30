import { PreferenceSelectionScreen } from "./PreferenceSelectionScreen";
import { useAppPreferences, type AppLocale } from "../../preferences";
import type { LanguagePreference } from "../../application/appPreferences";

const copy = {
  en: {
    intro: "Patternly currently uses English for both the interface and learning content.",
    options: "Current language",
  },
  pl: {
    intro: "Patternly currently uses English for both the interface and learning content.",
    options: "Current language",
  },
} as const;

const options: readonly { detail: Record<AppLocale, string>; label: Record<AppLocale, string>; value: LanguagePreference }[] = [
  { detail: { en: "English is used across the app and all learning content.", pl: "English is used across the app and all learning content." }, label: { en: "English", pl: "English" }, value: "en" },
];

export function LanguageSettingsScreen() {
  const preferences = useAppPreferences();
  const text = copy[preferences.locale];
  return (
    <PreferenceSelectionScreen
      currentValue={preferences.language}
      intro={text.intro}
      onSelect={(value) => preferences.setLanguage(value as LanguagePreference)}
      options={options.map((option) => ({ detail: option.detail[preferences.locale], label: option.label[preferences.locale], value: option.value }))}
      sectionTitle={text.options}
    />
  );
}
