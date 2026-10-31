import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import i18n from "../i18n";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  updateAppSettings,
  updateApproachChallengeSettings,
  type AppearancePreference,
  type LanguagePreference,
  type Settings,
} from "../application/appPreferences";
import { onKeyValueStorageReady } from "../infrastructure/storage/mmkvClient";
import { captureProfileReadFence } from "../application/profileReadFence";
import { CorruptStoredRecordError, UnsupportedStoredRecordError } from "../storage/errors";
import { AppPreferencesPresentationProvider, deriveAppPreferencesPresentation, type AppPreferencesContextValue } from "./appPreferencesContext";
export { useAppPreferences, useThemedStyles, type AppLocale } from "./appPreferencesContext";

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  const [settings, setSettings] = useState<Settings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);
  const [settingsUnavailable, setSettingsUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    let loading = false;
    const load = () => {
      if (loading) return;
      loading = true;
      const assertProfile = captureProfileReadFence();
      void loadAppSettings()
        .then((stored) => { assertProfile(); if (active) { setSettings(stored); setSettingsUnavailable(false); } })
        .catch(() => { if (active) setSettingsUnavailable(true); })
        .finally(() => { loading = false; if (active) setReady(true); });
    };
    const unsubscribe = onKeyValueStorageReady(load);
    return () => { active = false; unsubscribe(); };
  }, []);

  const persist = useCallback(async (patch: Partial<Settings>) => {
    const assertProfile = captureProfileReadFence();
    try {
      const next = await updateAppSettings(patch);
      assertProfile();
      setSettings(next);
      setSettingsUnavailable(false);
    } catch (error) {
      if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStoredRecordError) setSettingsUnavailable(true);
      throw error;
    }
  }, []);

  const setAppearance = useCallback(async (appearance: AppearancePreference) => { await persist({ appearance }); }, [persist]);

  const setLanguage = useCallback(async (language: LanguagePreference) => { await persist({ language }); }, [persist]);
  const setApproachChallengeSettings = useCallback(async (value: NonNullable<Settings["approachChallenge"]>) => {
    const assertProfile = captureProfileReadFence();
    try { const stored = await updateApproachChallengeSettings(value); assertProfile(); setSettings(stored); setSettingsUnavailable(false); }
    catch (error) { if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStoredRecordError) setSettingsUnavailable(true); throw error; }
  }, []);

  const presentation = useMemo(() => deriveAppPreferencesPresentation(settings.appearance, settings.language, systemColorScheme, systemLocale),
    [settings.appearance, settings.language, systemColorScheme, systemLocale]);
  const { locale } = presentation;

  useEffect(() => {
    void i18n.changeLanguage(locale);
  }, [locale]);

  const value = useMemo<AppPreferencesContextValue>(() => ({ ...presentation, settings, ready, settingsUnavailable, setAppearance, setLanguage, setApproachChallengeSettings }),
    [presentation, settings, ready, settingsUnavailable, setAppearance, setLanguage, setApproachChallengeSettings]);

  return <AppPreferencesPresentationProvider value={value}>{children}</AppPreferencesPresentationProvider>;
}
