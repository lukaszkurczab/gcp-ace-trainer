import { StyleSheet, Text, View } from "react-native";

import { Card, Icon, IconTile, ListRow, SettingsGroup, type IconName } from "../../../components";
import type { StorageIssue } from "../../../application/learningReadModels";
import { useAppPreferences, useThemedStyles, type AppLocale } from "../../../preferences";
import type { AppearancePreference, LanguagePreference } from "../../../application/appPreferences";
import { spacing, typography, type AppColors } from "../../../theme";
import { throwSettingsFeatureNotImplemented, type DeferredSettingsFeature } from "../settingsFeatureGate";

type SettingsTabProps = {
  onOpenAppearance: () => void;
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
    appSettings: "App settings",
    data: "Your data",
    dataDetail: "View the local data contract for this app.",
    dataPrivacy: "Data & privacy",
    feedback: "Send feedback",
    feedbackDetail: "Report a problem or suggest an improvement.",
    helpAccount: "Help & account",
    info: "These settings control how Patternly looks and sends reminders on this device.",
    language: "Language",
    languageDetail: "Choose the language used across Patternly.",
    legal: "Legal information",
    legalDetail: "Privacy and study-use information.",
    notifications: "Notifications",
    notificationsDetail: "Set permission and daily practice reminders.",
    preferences: "Preferences",
    storageDegraded: "Local data degraded",
    storageStatus: "Storage status",
    subscription: "Subscription",
    subscriptionDetail: "Manage your Patternly subscription.",
  },
  pl: {
    appearance: "Wygląd",
    appearanceDetail: "Wybierz motyw używany na tym urządzeniu.",
    appSettings: "Ustawienia aplikacji",
    data: "Twoje dane",
    dataDetail: "Zobacz lokalny kontrakt danych tej aplikacji.",
    dataPrivacy: "Dane i prywatność",
    feedback: "Wyślij opinię",
    feedbackDetail: "Zgłoś problem albo zaproponuj usprawnienie.",
    helpAccount: "Pomoc i konto",
    info: "Te ustawienia kontrolują wygląd Patternly i przypomnienia na tym urządzeniu.",
    language: "Język",
    languageDetail: "Wybierz język używany w całym Patternly.",
    legal: "Informacje prawne",
    legalDetail: "Prywatność i informacje o korzystaniu z materiałów.",
    notifications: "Powiadomienia",
    notificationsDetail: "Ustaw zgodę i codzienne przypomnienie o ćwiczeniach.",
    preferences: "Preferencje",
    storageDegraded: "Problem z danymi lokalnymi",
    storageStatus: "Stan danych",
    subscription: "Subskrypcja",
    subscriptionDetail: "Zarządzaj subskrypcją Patternly.",
  },
} as const;

export function SettingsTab({
  onOpenAppearance,
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

  return (
    <>
      <View style={styles.pageIntro} testID="settings-screen">
        <Text style={styles.screenTitle}>{text.appSettings}</Text>
      </View>

      <Card style={styles.infoCard} variant="tonal">
        <IconTile name="settings" tone="primary" />
        <Text style={styles.infoText}>{text.info}</Text>
      </Card>

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

      <SettingsGroup title={text.appearance}>
        <SettingsNavigationRow
          detail={text.appearanceDetail}
          icon="grid"
          onPress={onOpenAppearance}
          title={text.appearance}
          value={appearanceLabel(locale, appearance)}
        />
      </SettingsGroup>

      <SettingsGroup title={text.preferences}>
        <SettingsNavigationRow
          detail={text.languageDetail}
          icon="settings"
          onPress={onOpenLanguage}
          title={text.language}
          value={languageLabel(locale, language)}
        />
        <SettingsNavigationRow
          detail={text.notificationsDetail}
          icon="rotate-ccw"
          onPress={onOpenNotifications}
          title={text.notifications}
        />
      </SettingsGroup>

      <SettingsGroup title={text.dataPrivacy}>
        <SettingsNavigationRow detail={text.dataDetail} icon="database" onPress={onOpenYourData} title={text.data} />
        <SettingsNavigationRow detail={text.legalDetail} icon="shield-check" onPress={onOpenLegalInformation} title={text.legal} />
      </SettingsGroup>

      <SettingsGroup title={text.helpAccount}>
        <DeferredSettingsRow detail={text.feedbackDetail} feature="feedback" icon="alert-triangle" title={text.feedback} />
        <DeferredSettingsRow detail={text.subscriptionDetail} feature="subscription" icon="cloud" title={text.subscription} />
      </SettingsGroup>
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

function SettingsNavigationRow({ detail, icon, onPress, title, value }: Readonly<{
  detail: string;
  icon: IconName;
  onPress: () => void;
  title: string;
  value?: string;
}>) {
  const { colors } = useAppPreferences();
  const styles = useThemedStyles(createStyles);
  return (
    <ListRow
      detail={detail}
      leading={<IconTile name={icon} tone="primary" />}
      onPress={onPress}
      title={title}
      trailing={<View style={styles.preferenceMeta}>{value ? <Text style={styles.preferenceValue}>{value}</Text> : null}<Icon color={colors.textMuted} name="chevron-right" size={18} /></View>}
      variant="grouped"
    />
  );
}

function DeferredSettingsRow({ detail, feature, icon, title }: Readonly<{
  detail: string;
  feature: DeferredSettingsFeature;
  icon: IconName;
  title: string;
}>) {
  const { colors } = useAppPreferences();
  return (
    <ListRow
      detail={detail}
      leading={<IconTile name={icon} tone="muted" />}
      onPress={() => throwSettingsFeatureNotImplemented(feature)}
      title={title}
      trailing={<Icon color={colors.textMuted} name="chevron-right" size={18} />}
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
  infoCard: { alignItems: "center", flexDirection: "row" },
  infoText: { ...typography.small, color: palette.textSecondary, flex: 1 },
  preferenceMeta: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  preferenceValue: { ...typography.caption, color: palette.textMuted },
});
