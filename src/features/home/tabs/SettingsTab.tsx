import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon, IconTile, InfoBlock, ListRow, ScreenHeader, SettingsGroup, SkeletonShape, useSkeletonGlassMotion, type IconName } from "../../../components";
import type { AccountCommandResult } from "../../../application/account/AccountSessionProvider";
import type { StorageIssue } from "../../../application/learningReadModels";
import { useAppPreferences, useThemedStyles, type AppLocale } from "../../../preferences";
import { radius, spacing, typography, type AppColors } from "../../../theme";
import { hasPremiumTestingAccess, setPremiumTestingAccess } from "../../../application/premiumTesting";
import { isPatternlyBackendE2eConfigured } from "../../../infrastructure/clients/patternlyBackendRuntime";
import { isPatternlyPremiumTestingRuntime } from "../../../infrastructure/runtime/runtimeMode";
import packageJson from "../../../../package.json";
import { useAccountCommand } from "../../account/useAccountCommand";
import type { SettingsAccountPresentation } from "./settingsAccountPresentation";
import { LANGUAGE_SETTINGS_OPTIONS } from "../languageSettingsModel";

type SettingsTabProps = {
  account: SettingsAccountPresentation;
  onOpenAppearance: () => void;
  onOpenAccount: () => void;
  onOpenBackendDiagnostics: () => void;
  onOpenLanguage: () => void;
  onOpenLegalInformation: () => void;
  onOpenNotifications: () => void;
  onOpenPracticeSettings: () => void;
  onOpenYourData: () => void;
  onSignOut: () => Promise<AccountCommandResult>;
  storageIssues: readonly StorageIssue[];
};

export function SettingsLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t: tCommon } = useTranslation("common");
  const { t } = useTranslation("settings");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const motion = useSkeletonGlassMotion();
  const rows = [0, 1, 2, 3, 4, 5];

  return (
    <View
      accessibilityLabel={tCommon("Loading settings")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.settingsLoading}
      testID="settings-loading-skeleton"
    >
      <Text accessible={false} maxFontSizeMultiplier={2} style={styles.settingsLoadingTitle}>{t("appSettings")}</Text>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.settingsLoadingShapes}>
        <SkeletonShape motion={motion} style={[styles.settingsLoadingDescription, { height: 14 * textScale }]} />
        <View style={styles.settingsLoadingGroups}>
          {[0, 1, 2].map((group) => (
            <View key={group} style={styles.settingsLoadingGroup}>
              <SkeletonShape motion={motion} style={[styles.settingsLoadingGroupTitle, { height: 12 * textScale }]} />
              <View style={styles.settingsLoadingCard}>
                {rows.slice(group * 2, group * 2 + 2).map((row) => (
                  <View key={row} style={styles.settingsLoadingRow}>
                    <SkeletonShape motion={motion} style={styles.settingsLoadingIcon} />
                    <View style={styles.settingsLoadingRowCopy}>
                      <SkeletonShape motion={motion} style={[styles.settingsLoadingLine, styles.settingsLoadingRowTitle, { height: 15 * textScale }]} />
                      <SkeletonShape motion={motion} style={[styles.settingsLoadingLine, styles.settingsLoadingRowDetail, { height: 12 * textScale }]} />
                    </View>
                    <SkeletonShape motion={motion} style={styles.settingsLoadingChevron} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}



export function SettingsTab({
  account,
  onOpenAppearance,
  onOpenAccount,
  onOpenBackendDiagnostics,
  onOpenLanguage,
  onOpenLegalInformation,
  onOpenNotifications,
  onOpenPracticeSettings,
  onOpenYourData,
  onSignOut,
  storageIssues,
}: SettingsTabProps) {
  const styles = useThemedStyles(createStyles);
  const { appearance, language, locale } = useAppPreferences();
  const { t } = useTranslation("settings");
  const { t: tAccount } = useTranslation("account");
  const { t: tAppearance } = useTranslation("appearance");
  const [signOutFailure, setSignOutFailure] = useState<string | null>(null);
  const { busyAction, runCommand } = useAccountCommand();
  const text = {
    appearance: t("appearance"),
    appearanceDetail: t("appearanceDetail"),
    language: t("language"),
    languageDetail: t("languageDetail"),
    account: t("account"),
    accountDetail: t("accountDetail"),
    guestAccountDetail: t("guestAccountDetail"),
    signedOutAccount: t("signedOutAccount"),
    signedOutAccountDetail: t("signedOutAccountDetail"),
    accountAttention: t("accountAttention"),
    accountAttentionDetail: t("accountAttentionDetail"),
    verificationPending: t("verificationPending"),
    verificationPendingDetail: t("verificationPendingDetail"),
    guestAccessBlocked: t("guestAccessBlocked"),
    guestAccessBlockedDetail: t("guestAccessBlockedDetail"),
    accountUnavailable: t("accountUnavailable"),
    accountUnavailableDetail: t("accountUnavailableDetail"),
    accountBusyDetail: t("accountBusyDetail"),
    signOut: t("signOut"),
    signOutDetail: t("signOutDetail"),
    signOutErrorTitle: t("signOutErrorTitle"),
    appSettings: t("appSettings"),
    settingsDescription: t("settingsDescription"),
    app: t("app"),
    data: t("data"),
    dataDetail: t("dataDetail"),
    dataPrivacy: t("dataPrivacy"),
    developerVerification: t("developerVerification"),
    backendDiagnostics: t("backendDiagnostics"),
    backendDiagnosticsDetail: t("backendDiagnosticsDetail"),
    premiumTesting: t("premiumTesting"),
    premiumTestingDetail: t("premiumTestingDetail"),
    premiumTestingEnabled: t("premiumTestingEnabled"),
    premiumTestingDisabled: t("premiumTestingDisabled"),
    learning: t("learning"),
    legal: t("legal"),
    legalDetail: t("legalDetail"),
    notifications: t("notifications"),
    notificationsDetail: t("notificationsDetail"),
    practiceSettings: t("practiceSettings"),
    practiceSettingsDetail: t("practiceSettingsDetail"),
    storageDegraded: t("storageDegraded"),
    storageStatus: t("storageStatus"),
    version: t("version"),
  };
  const latestStorageIssue = storageIssues[0] ?? null;
  const backendDiagnosticsConfigured = isPatternlyBackendE2eConfigured();
  const premiumTestingAvailable = isPatternlyPremiumTestingRuntime();
  const [premiumTestingEnabled, setPremiumTestingEnabled] = useState(false);
  const metadata = appMetadata(text.version);

  useEffect(() => {
    if (premiumTestingAvailable) setPremiumTestingEnabled(hasPremiumTestingAccess());
  }, [premiumTestingAvailable]);

  function togglePremiumTestingAccess(): void {
    const next = !premiumTestingEnabled;
    setPremiumTestingAccess(next);
    setPremiumTestingEnabled(next);
  }

  function signOut(): void {
    if (!account.canSignOut) return;
    setSignOutFailure(null);
    runCommand("signOut", onSignOut, (result) => {
      setSignOutFailure(result.kind === "failure" ? result.failure : null);
    });
  }

  const accountTitle = account.status === "guest"
    ? text.signedOutAccount
    : account.status === "signedOut"
      ? text.signedOutAccount
      : account.status === "verificationPending"
        ? text.verificationPending
        : account.status === "guestAccessBlocked"
          ? text.guestAccessBlocked
          : account.status === "attention"
            ? text.accountAttention
            : account.status === "unavailable"
              ? text.accountUnavailable
              : text.account;
  const accountDetail = account.status === "guest"
    ? text.guestAccountDetail
    : account.status === "signedOut"
      ? text.signedOutAccountDetail
      : account.status === "verificationPending"
        ? text.verificationPendingDetail
        : account.status === "guestAccessBlocked"
          ? text.guestAccessBlockedDetail
          : account.status === "attention"
            ? text.accountAttentionDetail
            : account.status === "unavailable"
              ? text.accountUnavailableDetail
              : account.status === "busy"
                ? text.accountBusyDetail
                : text.accountDetail;
  const accountDetailWithIdentity = account.email
    ? `${accountDetail}\n${tAccount("accountSignedInAs")}: ${account.email}`
    : accountDetail;
  const languageValue = t(LANGUAGE_SETTINGS_OPTIONS.find((option) => option.value === language)?.labelKey ?? "languageSystem");

  return (
    <View style={styles.page} testID="settings-screen">
      <ScreenHeader description={text.settingsDescription} title={text.appSettings} />

      {signOutFailure ? <InfoBlock accessibilityAlert body={tAccount(signOutFailure)} title={text.signOutErrorTitle} testID="settings-sign-out-error" tone="warning" /> : null}

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
          <SettingsNavigationRow
            detail={accountDetailWithIdentity}
            disabled={!account.canOpenAccount}
            icon="user"
            onPress={onOpenAccount}
            testID="settings-account"
            title={accountTitle}
          />
          {account.canSignOut ? (
            <SettingsNavigationRow
              detail={text.signOutDetail}
              disabled={busyAction !== null}
              icon="rotate-ccw"
              loading={busyAction === "signOut"}
              onPress={signOut}
              testID="settings-sign-out"
              title={text.signOut}
            />
          ) : null}
          <SettingsNavigationRow
            detail={text.appearanceDetail}
            icon="moon-half"
            onPress={onOpenAppearance}
            testID="settings-appearance"
            title={text.appearance}
            value={tAppearance(appearance)}
          />
          <SettingsNavigationRow
            detail={text.languageDetail}
            icon="device-phone"
            onPress={onOpenLanguage}
            testID="settings-language"
            title={text.language}
            value={languageValue}
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

        {backendDiagnosticsConfigured || premiumTestingAvailable ? (
          <SettingsGroup dividers title={text.developerVerification}>
            {backendDiagnosticsConfigured ? (
              <SettingsNavigationRow
                detail={text.backendDiagnosticsDetail}
                icon="server-stack"
                onPress={onOpenBackendDiagnostics}
                testID="settings-backend-diagnostics"
                title={text.backendDiagnostics}
              />
            ) : null}
            {premiumTestingAvailable ? (
              <SettingsNavigationRow
                detail={text.premiumTestingDetail}
                icon="sparkle"
                onPress={togglePremiumTestingAccess}
                testID="settings-premium-testing"
                title={text.premiumTesting}
                value={premiumTestingEnabled ? text.premiumTestingEnabled : text.premiumTestingDisabled}
              />
            ) : null}
          </SettingsGroup>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text maxFontSizeMultiplier={2} style={styles.footerTitle}>Patternly</Text>
        {metadata ? <Text maxFontSizeMultiplier={2} style={styles.footerText}>{metadata}</Text> : null}
      </View>
    </View>
  );
}

function SettingsNavigationRow({ detail, disabled = false, icon, loading = false, onPress, testID, title, value }: Readonly<{
  detail: string;
  disabled?: boolean;
  icon: IconName;
  loading?: boolean;
  onPress: () => void;
  testID: string;
  title: string;
  value?: string;
}>) {
  const { colors } = useAppPreferences();
  const { fontScale } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const largeText = fontScale >= 1.3;
  const rowDetail = largeText && value ? `${detail}\n${value}` : detail;
  return (
    <ListRow
      detail={rowDetail}
      disabled={disabled}
      leading={<IconTile iconSize={24} name={icon} size={32} tone="settings" />}
      onPress={onPress}
      testID={testID}
      title={title}
      trailing={<View style={styles.preferenceMeta}>{loading ? <ActivityIndicator color={colors.primary} size="small" /> : <>{!largeText && value ? <Text maxFontSizeMultiplier={2} style={styles.preferenceValue}>{value}</Text> : null}<Icon color={colors.listRow.icon} name="chevron-right" size={20} /></>}</View>}
      variant="grouped"
    />
  );
}

function appMetadata(versionLabel: string): string | null {
  const version = typeof packageJson.version === "string" ? packageJson.version.trim() : "";
  return version ? `${versionLabel} ${version}` : null;
}

function formatStorageIssue(issue: StorageIssue, locale: AppLocale): string {
  const action = { parse: "read", read: "read", remove: "clear", write: "save" }[issue.operation];
  if (locale === "pl") return `Nie udało się wykonać operacji „${action}” na danych lokalnych [LOCAL_OPERATION_FAILED].`;
  return `Could not ${action} local data [LOCAL_OPERATION_FAILED].`;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  settingsLoading: {
    gap: spacing.lg,
    width: "100%",
  },
  settingsLoadingTitle: {
    ...typography.title,
    color: palette.textPrimary,
  },
  settingsLoadingShapes: {
    gap: spacing.lg,
    width: "100%",
  },
  settingsLoadingDescription: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
    width: "82%",
  },
  settingsLoadingGroups: {
    gap: spacing.xl,
  },
  settingsLoadingGroup: {
    gap: spacing.sm,
  },
  settingsLoadingGroupTitle: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
    width: "28%",
  },
  settingsLoadingCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingsLoadingRow: {
    alignItems: "center",
    borderBottomColor: palette.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingsLoadingIcon: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.md,
    height: 32,
    width: 32,
  },
  settingsLoadingRowCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  settingsLoadingLine: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
  },
  settingsLoadingRowTitle: {
    width: "62%",
  },
  settingsLoadingRowDetail: {
    width: "86%",
  },
  settingsLoadingChevron: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.pill,
    height: 14,
    width: 14,
  },
  page: { gap: spacing.xl },
  content: { gap: spacing.xl },
  preferenceMeta: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  preferenceValue: { ...typography.caption, color: palette.textMuted },
  footer: { alignItems: "center", gap: spacing.xxs, paddingHorizontal: spacing.lg },
  footerTitle: { color: palette.textPrimary, fontSize: 13, fontWeight: "600", lineHeight: 16 },
  footerText: { color: palette.textMuted, fontSize: 11, fontWeight: "400", lineHeight: 15 },
});
