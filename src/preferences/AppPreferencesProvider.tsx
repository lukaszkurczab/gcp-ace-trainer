import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { onKeyValueStorageReady } from "../infrastructure/storage/mmkvClient";
import { AppPreferencesPresentationProvider, deriveAppPreferencesPresentation, type AppPreferencesContextValue } from "./appPreferencesContext";
export { useAppPreferences, useThemedStyles, type AppLocale } from "./appPreferencesContext";

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  const [settings, setSettings] = useState<Settings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let loading = false;
    const load = () => {
      if (loading) return;
      loading = true;
      void loadAppSettings()
        .then((stored) => { if (active) setSettings(stored); })
        .finally(() => { loading = false; if (active) setReady(true); });
    };
    const unsubscribe = onKeyValueStorageReady(load);
    return () => { active = false; unsubscribe(); };
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

  const presentation = useMemo(() => deriveAppPreferencesPresentation(settings.appearance, settings.language, systemColorScheme, systemLocale),
    [settings.appearance, settings.language, systemColorScheme, systemLocale]);
  const { locale } = presentation;

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  const value = useMemo<AppPreferencesContextValue>(() => ({ ...presentation, ready, setAppearance, setLanguage }),
    [presentation, ready, setAppearance, setLanguage]);

  return <AppPreferencesPresentationProvider value={value}>{children}</AppPreferencesPresentationProvider>;
}
