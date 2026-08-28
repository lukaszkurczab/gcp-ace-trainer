import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import i18n from "../i18n";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  updateAppSettings,
  type AppearancePreference,
  type LanguagePreference,
  type Settings,
} from "../application/appPreferences";
import { colors, type AppColors, type ColorMode } from "../theme";

export type AppLocale = "en" | "pl";

type AppPreferencesContextValue = Readonly<{
  appearance: AppearancePreference;
  colorMode: ColorMode;
  colors: AppColors;
  language: LanguagePreference;
  locale: AppLocale;
  ready: boolean;
  setAppearance: (appearance: AppearancePreference) => Promise<void>;
  setLanguage: (language: LanguagePreference) => Promise<void>;
}>;

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

function resolveSystemLocale(): AppLocale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith("pl") ? "pl" : "en";
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void loadAppSettings()
      .then((stored) => { if (active) setSettings(stored); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const persist = useCallback(async (next: Settings) => {
    await updateAppSettings(next);
    setSettings(next);
  }, []);

  const setAppearance = useCallback(async (appearance: AppearancePreference) => {
    await persist({ ...settings, appearance });
  }, [persist, settings]);

  const setLanguage = useCallback(async (language: LanguagePreference) => {
    await persist({ ...settings, language });
  }, [persist, settings]);

  const colorMode: ColorMode = settings.appearance === "system"
    ? systemColorScheme === "dark" ? "dark" : "light"
    : settings.appearance;
  const locale: AppLocale = settings.language === "system" ? resolveSystemLocale() : settings.language;

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  const value = useMemo<AppPreferencesContextValue>(() => ({
    appearance: settings.appearance,
    colorMode,
    colors: colors[colorMode] as AppColors,
    language: settings.language,
    locale,
    ready,
    setAppearance,
    setLanguage,
  }), [colorMode, locale, ready, setAppearance, setLanguage, settings.appearance, settings.language]);

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
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
