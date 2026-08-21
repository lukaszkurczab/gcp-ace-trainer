import { StyleSheet, Text, View } from "react-native";

import { Icon, IconTile, ListRow, SettingsGroup, type IconName } from "../../../components";
import type { StorageIssue } from "../../../application/learningReadModels";
import { useAppPreferences, useThemedStyles, type AppLocale } from "../../../preferences";
import type { AppearancePreference, LanguagePreference } from "../../../application/appPreferences";
import { spacing, typography, type AppColors } from "../../../theme";
import { isPatternlyBackendE2eConfigured } from "../../../infrastructure/clients/patternlyBackendRuntime";

type SettingsTabProps = {
  onOpenAppearance: () => void;
  onOpenBackendDiagnostics: () => void;
  onOpenLanguage: () => void;
  onOpenLegalInformation: () => void;
  onOpenNotifications: () => void;
  onOpenYourData: () => void;
  storageIssues: readonly StorageIssue[];
};

const copy = {
  en: {
    appearance: "Appearance",
    appearanceDetail: "Choose the theme used on this device.",
    appSettings: "Settings",
    app: "App",
    data: "Your data",
    dataDetail: "View the local data contract for this app.",
    dataPrivacy: "Data & privacy",
    developerVerification: "Developer verification",
    backendDiagnostics: "Backend diagnostics",
    backendDiagnosticsDetail: "Run every local backend path on this simulator.",
    learning: "Learning",
    language: "Language",
    languageDetail: "Choose the language used across Patternly.",
    legal: "Legal information",
    legalDetail: "Privacy and study-use information.",
    notifications: "Notifications",
    notificationsDetail: "Set permission and daily practice reminders.",
    storageDegraded: "Local data degraded",
    storageStatus: "Storage status",
  },
  pl: {
    appearance: "Wygląd",
    appearanceDetail: "Wybierz motyw używany na tym urządzeniu.",
    appSettings: "Ustawienia",
    app: "Aplikacja",
    data: "Twoje dane",
    dataDetail: "Zobacz lokalny kontrakt danych tej aplikacji.",
    dataPrivacy: "Dane i prywatność",
    developerVerification: "Weryfikacja deweloperska",
    backendDiagnostics: "Diagnostyka backendu",
    backendDiagnosticsDetail: "Uruchom wszystkie lokalne ścieżki backendu na tym symulatorze.",
    learning: "Nauka",
    language: "Język",
    languageDetail: "Wybierz język używany w całym Patternly.",
    legal: "Informacje prawne",
    legalDetail: "Prywatność i informacje o korzystaniu z materiałów.",
    notifications: "Powiadomienia",
    notificationsDetail: "Ustaw zgodę i codzienne przypomnienie o ćwiczeniach.",
    storageDegraded: "Problem z danymi lokalnymi",
    storageStatus: "Stan danych",
  },
} as const;

export function SettingsTab({
  onOpenAppearance,
  onOpenBackendDiagnostics,
  onOpenLanguage,
  onOpenLegalInformation,
  onOpenNotifications,
  onOpenYourData,
  storageIssues,
}: SettingsTabProps) {
  const styles = useThemedStyles(createStyles);
  const { appearance, language, locale } = useAppPreferences();
  const text = copy[locale];
  const latestStorageIssue = storageIssues[0] ?? null;
  const backendDiagnosticsConfigured = isPatternlyBackendE2eConfigured();

  return (
    <>
      <View style={styles.pageIntro} testID="settings-screen">
        <Text style={styles.screenTitle}>{text.appSettings}</Text>
      </View>

      {latestStorageIssue ? (
        <SettingsGroup title={text.storageStatus}>
          <ListRow
            detail={formatStorageIssue(latestStorageIssue, locale)}
            leading={<IconTile name="alert-triangle" tone="warning" />}
            title={text.storageDegraded}
            variant="grouped"
          />
        </SettingsGroup>
      ) : null}

      <SettingsGroup title={text.app}>
        <SettingsNavigationRow
          detail={text.appearanceDetail}
          icon="grid"
          onPress={onOpenAppearance}
          testID="settings-appearance"
          title={text.appearance}
          value={appearanceLabel(locale, appearance)}
        />
      </SettingsGroup>

      <SettingsGroup title={text.learning}>
        <SettingsNavigationRow
          detail={text.languageDetail}
          icon="settings"
          onPress={onOpenLanguage}
          testID="settings-language"
          title={text.language}
          value={languageLabel(locale, language)}
        />
        <SettingsNavigationRow
          detail={text.notificationsDetail}
          icon="rotate-ccw"
          onPress={onOpenNotifications}
          testID="settings-notifications"
          title={text.notifications}
        />
      </SettingsGroup>

      <SettingsGroup title={text.dataPrivacy}>
        <SettingsNavigationRow detail={text.dataDetail} icon="database" onPress={onOpenYourData} testID="settings-your-data" title={text.data} />
        <SettingsNavigationRow detail={text.legalDetail} icon="shield-check" onPress={onOpenLegalInformation} testID="settings-legal-information" title={text.legal} />
      </SettingsGroup>

      {backendDiagnosticsConfigured ? (
        <SettingsGroup title={text.developerVerification}>
          <SettingsNavigationRow
            detail={text.backendDiagnosticsDetail}
            icon="server-stack"
            onPress={onOpenBackendDiagnostics}
            testID="settings-backend-diagnostics"
            title={text.backendDiagnostics}
          />
        </SettingsGroup>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Patternly</Text>
        <Text style={styles.footerText}>{`Version 0.1.0 · Build 1`}</Text>
      </View>
    </>
  );
}

function appearanceLabel(locale: AppLocale, appearance: AppearancePreference): string {
  const labels: Record<AppLocale, Record<AppearancePreference, string>> = {
    en: { dark: "Dark", light: "Light", system: "System" },
    pl: { dark: "Ciemny", light: "Jasny", system: "System" },
  };
  return labels[locale][appearance];
}

function languageLabel(locale: AppLocale, language: LanguagePreference): string {
  const labels: Record<AppLocale, Record<LanguagePreference, string>> = {
    en: { en: "English", pl: "Polish", system: "System" },
    pl: { en: "Angielski", pl: "Polski", system: "System" },
  };
  return labels[locale][language];
}

function SettingsNavigationRow({ detail, icon, onPress, testID, title, value }: Readonly<{
  detail: string;
  icon: IconName;
  onPress: () => void;
  testID: string;
  title: string;
  value?: string;
}>) {
  const { colors } = useAppPreferences();
  const styles = useThemedStyles(createStyles);
  return (
    <ListRow
      detail={detail}
      leading={<IconTile name={icon} size={32} tone="settings" />}
      onPress={onPress}
      testID={testID}
      title={title}
      trailing={<View style={styles.preferenceMeta}>{value ? <Text style={styles.preferenceValue}>{value}</Text> : null}<Icon color={colors.listRow.icon} name="chevron-right" size={20} /></View>}
      variant="grouped"
    />
  );
}

function formatStorageIssue(issue: StorageIssue, locale: AppLocale): string {
  const action = { parse: "read", read: "read", remove: "clear", write: "save" }[issue.operation];
  if (locale === "pl") return `Nie udało się wykonać operacji „${action}” na danych lokalnych [LOCAL_OPERATION_FAILED].`;
  return `Could not ${action} local data [LOCAL_OPERATION_FAILED].`;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  pageIntro: { gap: spacing.md },
  screenTitle: { ...typography.heading, color: palette.textPrimary },
  preferenceMeta: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  preferenceValue: { ...typography.caption, color: palette.textMuted },
  footer: { alignItems: "center", gap: spacing.xxs, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  footerTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  footerText: { ...typography.caption, color: palette.textMuted },
});
