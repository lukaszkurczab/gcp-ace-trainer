import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppearancePreference, LanguagePreference } from "../application/appPreferences";
import { colors, type AppColors, type ColorMode } from "../theme/tokens";
import { resolveLocale, type AvailableLocale, type LocaleResolution } from "./localeResolver";

export type AppLocale = AvailableLocale;

export type AppPreferencesContextValue = Readonly<{
  appearance: AppearancePreference;
  colorMode: ColorMode;
  colors: AppColors;
  deviceLocale: AppLocale;
  language: LanguagePreference;
  locale: AppLocale;
  localeResolution: LocaleResolution;
  systemLocaleResolution: LocaleResolution;
  ready: boolean;
  setAppearance: (appearance: AppearancePreference) => Promise<void>;
  setLanguage: (language: LanguagePreference) => Promise<void>;
}>;

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesPresentationProvider({ children, value }: Readonly<{ children: ReactNode; value: AppPreferencesContextValue }>) {
  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

/** Presentation derivation shared by persisted settings and isolated UI measurements. */
export function deriveAppPreferencesPresentation(appearance: AppearancePreference, language: LanguagePreference, systemColorScheme: string | null | undefined, systemLocale: string) {
  const systemLocaleResolution = resolveLocale("system", systemLocale);
  const localeResolution = language === "system" ? systemLocaleResolution : resolveLocale(language, systemLocale);
  const colorMode: ColorMode = appearance === "system" ? systemColorScheme === "dark" ? "dark" : "light" : appearance;
  return { appearance, colorMode, colors: colors[colorMode] as AppColors, deviceLocale: systemLocaleResolution.effectiveLocale,
    language, locale: localeResolution.effectiveLocale, localeResolution, systemLocaleResolution };
}

export function useAppPreferences(): AppPreferencesContextValue {
  const context = useContext(AppPreferencesContext);
  if (!context) throw new Error("App preferences must be read within AppPreferencesProvider.");
  return context;
}

export function useThemedStyles<T>(factory: (colors: AppColors) => T): T {
  const preferences = useAppPreferences();
  return useMemo(() => factory(preferences.colors), [factory, preferences.colors]);
}
