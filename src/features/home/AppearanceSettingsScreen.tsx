import { PreferenceSelectionScreen } from "./PreferenceSelectionScreen";
import { useAppPreferences, type AppLocale } from "../../preferences";
import type { AppearancePreference } from "../../application/appPreferences";

const copy = {
  en: {
    intro: "Choose how Patternly looks on this device.",
    options: "Appearance",
  },
  pl: {
    intro: "Wybierz wygląd Patternly na tym urządzeniu.",
    options: "Wygląd",
  },
} as const;

const options: readonly { detail: Record<AppLocale, string>; label: Record<AppLocale, string>; value: AppearancePreference }[] = [
  { detail: { en: "Follow your device appearance.", pl: "Użyj wyglądu urządzenia." }, label: { en: "System", pl: "System" }, value: "system" },
  { detail: { en: "Always use the light theme.", pl: "Zawsze używaj jasnego motywu." }, label: { en: "Light", pl: "Jasny" }, value: "light" },
  { detail: { en: "Always use the dark theme.", pl: "Zawsze używaj ciemnego motywu." }, label: { en: "Dark", pl: "Ciemny" }, value: "dark" },
];

export function AppearanceSettingsScreen() {
  const preferences = useAppPreferences();
  const text = copy[preferences.locale];
  return (
    <PreferenceSelectionScreen
      currentValue={preferences.appearance}
      intro={text.intro}
      onSelect={(value) => preferences.setAppearance(value as AppearancePreference)}
      options={options.map((option) => ({ appearancePreview: option.value, detail: option.detail[preferences.locale], label: option.label[preferences.locale], value: option.value }))}
      sectionTitle={text.options}
    />
  );
}
