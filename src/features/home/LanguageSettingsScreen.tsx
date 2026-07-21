import { PreferenceSelectionScreen } from "./PreferenceSelectionScreen";
import { useAppPreferences, type AppLocale } from "../../preferences";
import type { LanguagePreference } from "../../application/appPreferences";

const copy = {
  en: {
    intro: "Choose the language used across Patternly.",
    options: "Available languages",
  },
  pl: {
    intro: "Wybierz język używany w całym Patternly.",
    options: "Dostępne języki",
  },
} as const;

const options: readonly { detail: Record<AppLocale, string>; label: Record<AppLocale, string>; value: LanguagePreference }[] = [
  { detail: { en: "Use your device language.", pl: "Użyj języka urządzenia." }, label: { en: "System", pl: "System" }, value: "system" },
  { detail: { en: "Use English across the app.", pl: "Użyj języka angielskiego w całej aplikacji." }, label: { en: "English", pl: "Angielski" }, value: "en" },
  { detail: { en: "Use Polish across the app.", pl: "Użyj języka polskiego w całej aplikacji." }, label: { en: "Polish", pl: "Polski" }, value: "pl" },
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
