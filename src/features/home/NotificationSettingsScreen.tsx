import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, Card, Icon, InfoBlock, Screen, ScreenHeader } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useNotificationSettings, useThemedStyles } from "../../preferences";
import type { LearningPlanReminderFailure } from "../../application/notificationPreferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { getTrackDisplay, type GoalDay } from "../../domain";
import { radius, spacing, typography, type AppColors } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.NOTIFICATION_SETTINGS>;

const ERROR_COPY: Readonly<Record<LearningPlanReminderFailure, Readonly<{ title: string; detail: string }>>> = {
  missing_track: { title: "missingTrackTitle", detail: "missingTrackDetail" },
  missing_goal: { title: "missingGoalTitle", detail: "missingGoalDetail" },
  missing_plan: { title: "missingPlanTitle", detail: "missingPlanDetail" },
  identity_mismatch: { title: "identityMismatchTitle", detail: "identityMismatchDetail" },
  goal_paused: { title: "goalPausedTitle", detail: "goalPausedDetail" },
  plan_paused: { title: "planPausedTitle", detail: "planPausedDetail" },
  plan_completed: { title: "planCompletedTitle", detail: "planCompletedDetail" },
  no_slots: { title: "noSlotsTitle", detail: "noSlotsDetail" },
  timezone_mismatch: { title: "timezoneMismatchTitle", detail: "timezoneMismatchDetail" },
  permission_denied: { title: "permissionDeniedTitle", detail: "permissionDeniedDetail" },
  scheduler_failure: { title: "schedulerFailureTitle", detail: "schedulerFailureDetail" },
  concurrent_change: { title: "concurrentChangeTitle", detail: "concurrentChangeDetail" },
};

export function NotificationSettingsScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();
  const { t } = useTranslation("notifications");
  const source = route.params?.source === "goal" ? "goal" : "settings";
  const context = source === "goal" ? t("goal") : t("settings");
  const backLabel = source === "goal" ? t("backToGoal") : t("backToSettings");
  const copy = useMemo(() => ({ body: t("notificationBody"), title: t("notificationTitle") }), [t]);
  const notifications = useNotificationSettings(copy);
  const [openSettingsError, setOpenSettingsError] = useState(false);
  const dayLabels: Readonly<Record<GoalDay, string>> = {
    mon: t("dayMon"), tue: t("dayTue"), wed: t("dayWed"), thu: t("dayThu"), fri: t("dayFri"), sat: t("daySat"), sun: t("daySun"),
  };

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (route.params?.source === "goal") {
      navigation.replace(ROUTES.GOAL_CADENCE, { returnTo: route.params.returnToGoal, trackId: route.params.trackId });
    } else {
      navigation.replace(ROUTES.HOME, { initialTab: "settings" });
    }
  }, [navigation, route.params]);

  const openDeviceSettings = useCallback(async () => {
    setOpenSettingsError(false);
    try { await Linking.openSettings(); } catch { setOpenSettingsError(true); }
  }, []);

  const errorCopy = notifications.error ? ERROR_COPY[notifications.error] : null;
  const activeTrack = notifications.trackId ? getTrackDisplay(notifications.trackId) : null;
  const canAct = !notifications.loading && !notifications.busy;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader backAction={{ accessibilityLabel: backLabel, onPress: handleBack }} context={context} contextTone="primary" title={t("reminders")} />
      <View style={styles.content} testID={runtimeSelectors.notifications.root()}>
        {notifications.loading ? <InfoBlock body={t("loadingDetail")} title={t("loading")} testID={runtimeSelectors.notifications.state("loading")} /> : null}
        {errorCopy && notifications.error ? (
          <View style={styles.errorGroup}>
            <InfoBlock accessibilityAlert body={t(errorCopy.detail)} title={t(errorCopy.title)} testID={runtimeSelectors.notifications.error(notifications.error)} tone="warning" />
            <Button disabled={!canAct} loading={notifications.busyOperation === "retry"} onPress={() => { void notifications.retryReminders(); }} testID={runtimeSelectors.notifications.retry()} variant="secondary">{t("retry")}</Button>
            {notifications.permission === "denied" ? <Pressable accessibilityRole="button" onPress={() => { void openDeviceSettings(); }}><Text style={styles.link}>{t("openDeviceSettings")}</Text></Pressable> : null}
          </View>
        ) : null}
        {openSettingsError ? <InfoBlock accessibilityAlert body={t("openSettingsErrorDetail")} title={t("openSettingsErrorTitle")} testID={runtimeSelectors.notifications.openSettingsError()} tone="warning" /> : null}
        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{t("permissionSection")}</Text>
        <PermissionCard colors={colors} detail={notifications.permission === "granted" ? t("permissionGrantedDetail") : notifications.permission === "denied" ? t("permissionDeniedDetail") : notifications.permission === null ? t("permissionCheckingDetail") : t("permissionUndeterminedDetail")} onOpenSettings={notifications.permission === "denied" ? openDeviceSettings : undefined} openSettingsLabel={t("openDeviceSettings")} permission={notifications.permission} />
        <Card testID={runtimeSelectors.notifications.planSchedule()}>
          <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("planSchedule")}</Text>
          {activeTrack ? <Text maxFontSizeMultiplier={2} style={styles.track}>{t(activeTrack.shortTitle, { ns: "common" })}</Text> : null}
          {notifications.planSlots.length > 0 ? notifications.planSlots.map((slot) => (
            <View key={slot.slotId} style={styles.slotRow} testID={runtimeSelectors.notifications.slot(slot.slotId)}>
              <Text maxFontSizeMultiplier={2} style={styles.slotDay}>{dayLabels[slot.day]}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.slotTime}>{slot.localTime}</Text>
            </View>
          )) : <Text maxFontSizeMultiplier={2} style={styles.body}>{t("planScheduleEmpty")}</Text>}
        </Card>
        {notifications.pending ? <InfoBlock body={t("pendingDetail")} title={t("pendingTitle")} testID={runtimeSelectors.notifications.pending()} tone="warning" /> : null}
        {notifications.enabled ? (
          <Button disabled={!canAct} loading={notifications.busyOperation === "disable"} onPress={() => { void notifications.disableReminders(); }} testID={runtimeSelectors.notifications.disable()} variant="secondary">{t("disableReminder")}</Button>
        ) : (
          <Button disabled={!canAct} loading={notifications.busyOperation === "enable"} onPress={() => { void notifications.enableReminders(); }} testID={runtimeSelectors.notifications.enable()}>{t("enableReminder")}</Button>
        )}
      </View>
    </Screen>
  );
}

function PermissionCard({ colors, detail, onOpenSettings, openSettingsLabel, permission }: Readonly<{
  colors: AppColors;
  detail: string;
  onOpenSettings?: () => void;
  openSettingsLabel: string;
  permission: ReturnType<typeof useNotificationSettings>["permission"];
}>) {
  const styles = useThemedStyles(createPermissionStyles);
  const title = permission === "granted" ? "permissionGranted" : permission === "denied" ? "permissionDenied" : permission === null ? "permissionChecking" : "permissionPending";
  const icon = permission === "granted" ? "shield-check" : permission === "denied" ? "alert-triangle" : "settings";
  return (
    <View style={[styles.permissionCard, permission === "denied" ? styles.permissionWarning : null]} testID={runtimeSelectors.notifications.permission(permission ?? "checking")}>
      <View style={styles.permissionHeader}><Icon color={permission === "granted" ? colors.success : permission === "denied" ? colors.warning : colors.textSecondary} name={icon} size={20} /><View style={styles.permissionCopy}><Text maxFontSizeMultiplier={2} style={styles.permissionTitle}>{useTranslation("notifications").t(title)}</Text><Text maxFontSizeMultiplier={2} style={styles.permissionDetail}>{detail}</Text></View></View>
      {onOpenSettings ? <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.permissionAction}><Text style={styles.permissionActionText}>{openSettingsLabel}</Text></Pressable> : null}
    </View>
  );
}

const createPermissionStyles = (palette: AppColors) => StyleSheet.create({
  permissionCard: { backgroundColor: palette.listRow.surface, borderRadius: radius.button, gap: spacing.md, padding: spacing.lg },
  permissionWarning: { backgroundColor: palette.warningSoft },
  permissionHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  permissionCopy: { flex: 1, gap: spacing.xxs },
  permissionTitle: { color: palette.textPrimary, ...typography.bodyStrong },
  permissionDetail: { color: palette.textSecondary, ...typography.small },
  permissionAction: { minHeight: 44, justifyContent: "center" },
  permissionActionText: { color: palette.warning, ...typography.bodyStrong },
});

const createStyles = (palette: AppColors) => StyleSheet.create({
  content: { gap: spacing.lg },
  errorGroup: { gap: spacing.sm },
  sectionLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, lineHeight: 13, textTransform: "uppercase" },
  cardTitle: { ...typography.bodyStrong, color: palette.textPrimary, marginBottom: spacing.sm },
  track: { ...typography.small, color: palette.textSecondary, marginBottom: spacing.sm },
  body: { ...typography.body, color: palette.textSecondary },
  slotRow: { alignItems: "center", borderTopColor: palette.effects.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  slotDay: { ...typography.bodyStrong, color: palette.textPrimary },
  slotTime: { ...typography.body, color: palette.textSecondary },
  link: { ...typography.bodyStrong, color: palette.primary, paddingVertical: spacing.sm },
});
