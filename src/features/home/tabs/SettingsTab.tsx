import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon, IconTile, ListRow, ScreenHeader, SettingsGroup, type IconName } from "../../../components";
import type { StorageIssue } from "../../../application/learningReadModels";
import { useAppPreferences, useThemedStyles, type AppLocale } from "../../../preferences";
import type { AppearancePreference } from "../../../application/appPreferences";
import { spacing, typography, type AppColors } from "../../../theme";
import { isPatternlyBackendE2eConfigured } from "../../../infrastructure/clients/patternlyBackendRuntime";

type SettingsTabProps = {
  onOpenAppearance: () => void;
  onOpenAccount: () => void;
  onOpenBackendDiagnostics: () => void;
  onOpenLegalInformation: () => void;
  onOpenNotifications: () => void;
  onOpenPracticeSettings: () => void;
  onOpenYourData: () => void;
  storageIssues: readonly StorageIssue[];
};



export function SettingsTab({
  onOpenAppearance,
  onOpenAccount,
  onOpenBackendDiagnostics,
  onOpenLegalInformation,
  onOpenNotifications,
  onOpenPracticeSettings,
  onOpenYourData,
  storageIssues,
}: SettingsTabProps) {
  const styles = useThemedStyles(createStyles);
  const { appearance, locale } = useAppPreferences();
  const { t } = useTranslation("settings");
  const text = {
  appearance: t("appearance"),
  appearanceDetail: t("appearanceDetail"),
  account: t("account"),
  accountDetail: t("accountDetail"),
  appSettings: t("appSettings"),
  settingsDescription: t("settingsDescription"),
  app: t("app"),
  data: t("data"),
  dataDetail: t("dataDetail"),
  dataPrivacy: t("dataPrivacy"),
  developerVerification: t("developerVerification"),
  backendDiagnostics: t("backendDiagnostics"),
  backendDiagnosticsDetail: t("backendDiagnosticsDetail"),
  learning: t("learning"),
  legal: t("legal"),
  legalDetail: t("legalDetail"),
  notifications: t("notifications"),
  notificationsDetail: t("notificationsDetail"),
  practiceSettings: t("practiceSettings"),
  practiceSettingsDetail: t("practiceSettingsDetail"),
  storageDegraded: t("storageDegraded"),
  storageStatus: t("storageStatus"),
  };
  const latestStorageIssue = storageIssues[0] ?? null;
  const backendDiagnosticsConfigured = isPatternlyBackendE2eConfigured();

  return (
    <View style={styles.page} testID="settings-screen">
      <ScreenHeader description={text.settingsDescription} title={text.appSettings} />

      {latestStorageIssue ? (
        <SettingsGroup dividers title={text.storageStatus}>
          <ListRow
            detail={formatStorageIssue(latestStorageIssue, locale)}
            leading={<IconTile name="alert-triangle" tone="warning" />}
            title={text.storageDegraded}
            variant="grouped"
          />
        </SettingsGroup>
      ) : null}

      <View style={styles.content}>
        <SettingsGroup dividers title={text.app} titleGap={0}>
          <SettingsNavigationRow detail={text.accountDetail} icon="user" onPress={onOpenAccount} testID="settings-account" title={text.account} />
          <SettingsNavigationRow
            detail={text.appearanceDetail}
            icon="moon-half"
            onPress={onOpenAppearance}
            testID="settings-appearance"
            title={text.appearance}
            value={appearanceLabel(locale, appearance)}
          />
        </SettingsGroup>

        <SettingsGroup dividers title={text.learning} titleGap={0}>
          <SettingsNavigationRow
            detail={text.practiceSettingsDetail}
            icon="settings"
            onPress={onOpenPracticeSettings}
            testID="settings-practice"
            title={text.practiceSettings}
          />
          <SettingsNavigationRow
            detail={text.notificationsDetail}
            icon="bell"
            onPress={onOpenNotifications}
            testID="settings-notifications"
            title={text.notifications}
          />
        </SettingsGroup>

        <SettingsGroup dividers title={text.dataPrivacy} titleGap={0}>
          <SettingsNavigationRow detail={text.dataDetail} icon="shield" onPress={onOpenYourData} testID="settings-your-data" title={text.data} />
          <SettingsNavigationRow detail={text.legalDetail} icon="shield-check" onPress={onOpenLegalInformation} testID="settings-legal-information" title={text.legal} />
        </SettingsGroup>

        {backendDiagnosticsConfigured ? (
          <SettingsGroup dividers title={text.developerVerification}>
            <SettingsNavigationRow
              detail={text.backendDiagnosticsDetail}
              icon="server-stack"
              onPress={onOpenBackendDiagnostics}
              testID="settings-backend-diagnostics"
              title={text.backendDiagnostics}
            />
          </SettingsGroup>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text maxFontSizeMultiplier={2} style={styles.footerTitle}>Patternly</Text>
        <Text maxFontSizeMultiplier={2} style={styles.footerText}>{`Version 0.1.0 · Build 1`}</Text>
      </View>
    </View>
  );
}

function appearanceLabel(locale: AppLocale, appearance: AppearancePreference): string {
  const labels: Record<AppLocale, Record<AppearancePreference, string>> = {
    en: { dark: "Dark", light: "Light", system: "System" },
    pl: { dark: "Ciemny", light: "Jasny", system: "System" },
  };
  return labels[locale][appearance];
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
      leading={<IconTile iconSize={24} name={icon} size={32} tone="settings" />}
      onPress={onPress}
      testID={testID}
      title={title}
        trailing={<View style={styles.preferenceMeta}>{value ? <Text maxFontSizeMultiplier={2} style={styles.preferenceValue}>{value}</Text> : null}<Icon color={colors.listRow.icon} name="chevron-right" size={20} /></View>}
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
  page: { gap: spacing.xl },
  content: { gap: spacing.xl },
  preferenceMeta: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  preferenceValue: { ...typography.caption, color: palette.textMuted },
  footer: { alignItems: "center", gap: spacing.xxs, paddingHorizontal: spacing.lg },
  footerTitle: { color: palette.textPrimary, fontSize: 13, fontWeight: "600", lineHeight: 16 },
  footerText: { color: palette.textMuted, fontSize: 11, fontWeight: "400", lineHeight: 15 },
});
