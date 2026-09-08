import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import notificationCopy from "../../locales/en/notifications.json";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  Button,
  Icon,
  IconTile,
  InfoBlock,
  ListRow,
  Screen,
  ScreenHeader,
  SettingsBottomSheet,
} from "../../components";
import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import {
  formatDailyReminderTime,
  NotificationPermissionDeniedError,
  parseDailyReminderTime,
} from "../../application/notificationPreferences";
import { useAppPreferences, useNotificationSettings, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { getTrackDisplay, GOAL_DAY_IDS, type GoalDay } from "../../domain";



type NotificationSettingsScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.NOTIFICATION_SETTINGS>;

export function NotificationSettingsScreen({ navigation, route }: NotificationSettingsScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppPreferences();
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [openSettingsError, setOpenSettingsError] = useState(false);
  const { t } = useTranslation("notifications");
  const text = {
  close: t("close"),
  dailyReminder: t("dailyReminder"),
  disableReminder: t("disableReminder"),
  notificationBody: t("notificationBody"),
  notificationTitle: t("notificationTitle"),
  openDeviceSettings: t("openDeviceSettings"),
  permissionDenied: t("permissionDenied"),
  permissionDeniedDetail: t("permissionDeniedDetail"),
  permissionGranted: t("permissionGranted"),
  permissionGrantedDetail: t("permissionGrantedDetail"),
  permissionChecking: t("permissionChecking"),
  permissionCheckingDetail: t("permissionCheckingDetail"),
  permissionPending: t("permissionPending"),
  permissionSection: t("permissionSection"),
  permissionRequest: t("permissionRequest"),
  permissionUndeterminedDetail: t("permissionUndeterminedDetail"),
  reminderOff: t("reminderOff"),
  reminderBlocked: t("reminderBlocked"),
  reminderUnavailable: t("reminderUnavailable"),
  reminderSave: t("reminderSave"),
  reminderSaveErrorTitle: t("reminderSaveErrorTitle"),
  reminderSaveErrorDetail: t("reminderSaveErrorDetail"),
  reminderDisableErrorTitle: t("reminderDisableErrorTitle"),
  reminderDisableErrorDetail: t("reminderDisableErrorDetail"),
  reminderTimeInvalid: t("reminderTimeInvalid"),
  reminderTimePlaceholder: t("reminderTimePlaceholder"),
  reminderNote: t("reminderNote"),
  reminderSection: t("reminderSection"),
  settings: t("settings"),
  goal: t("goal"),
  reminders: t("reminders"),
  backToSettings: t("backToSettings"),
  backToGoal: t("backToGoal"),
  loading: t("loading"),
  loadingDetail: t("loadingDetail"),
  loadErrorTitle: t("loadErrorTitle"),
  loadErrorDetail: t("loadErrorDetail"),
  requestErrorTitle: t("requestErrorTitle"),
  requestErrorDetail: t("requestErrorDetail"),
  openSettingsErrorTitle: t("openSettingsErrorTitle"),
  openSettingsErrorDetail: t("openSettingsErrorDetail"),
  retry: t("retry"),
  sheetIntro: t("sheetIntro"),
  sheetTitle: t("sheetTitle"),
  activeTrack: t("activeTrack"),
  preferredDays: t("preferredDays"),
  goalPaused: t("goalPaused"),
  noActiveGoal: t("noActiveGoal"),
  noActiveTrack: t("noActiveTrack"),
  dayMon: t("dayMon"), dayTue: t("dayTue"), dayWed: t("dayWed"), dayThu: t("dayThu"), dayFri: t("dayFri"), daySat: t("daySat"), daySun: t("daySun"),
  };
  const notification = useMemo(() => ({ body: text.notificationBody, title: text.notificationTitle }), [text.notificationBody, text.notificationTitle]);
  const notifications = useNotificationSettings(notification);
  const source = route.params?.source === "goal" ? "goal" : "settings";
  const context = source === "goal" ? text.goal : text.settings;
  const backLabel = source === "goal" ? text.backToGoal : text.backToSettings;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (route.params?.source === "goal") {
      navigation.replace(ROUTES.GOAL_CADENCE, {
        returnTo: route.params.returnToGoal,
        trackId: route.params.trackId,
      });
      return;
    }
    navigation.replace(ROUTES.HOME, { initialTab: "settings" });
  }, [navigation, route.params]);
  const reminderBlocked = notifications.permission === "denied" && notifications.practiceReminder === null;
  const goalUnavailable = notifications.context.status !== "active";
  const reminderDisabled = notifications.loading || notifications.busy || notifications.permission === null || reminderBlocked || goalUnavailable;
  const activeTrack = notifications.context.trackId ? getTrackDisplay(notifications.context.trackId) : null;
  const dayLabels: Readonly<Record<GoalDay, string>> = {
    mon: text.dayMon, tue: text.dayTue, wed: text.dayWed, thu: text.dayThu, fri: text.dayFri, sat: text.daySat, sun: text.daySun,
  };
  const goalStatusDetail = notifications.context.status === "paused" ? text.goalPaused : notifications.context.status === "missing-track" ? text.noActiveTrack : text.noActiveGoal;

  useEffect(() => {
    if (!reminderSheetVisible && notifications.practiceReminder) setReminderTime(formatDailyReminderTime(notifications.practiceReminder));
  }, [notifications.practiceReminder, reminderSheetVisible]);

  async function requestPermission(): Promise<void> {
    try {
      await notifications.requestPermission();
    } catch {
      // The hook records the operation failure for the visible retry surface.
    }
  }

  function openReminderSheet(): void {
    notifications.clearError();
    setReminderError(null);
    setReminderTime(notifications.practiceReminder ? formatDailyReminderTime(notifications.practiceReminder) : "20:00");
    setReminderSheetVisible(true);
  }

  async function saveReminder(): Promise<void> {
    let time;
    try {
      time = parseDailyReminderTime(reminderTime);
    } catch {
      setReminderError(text.reminderTimeInvalid);
      return;
    }

    try {
      const saved = await notifications.saveReminder(time, notification);
      if (!saved) return;
      setReminderError(null);
      setReminderSheetVisible(false);
    } catch (error) {
      if (error instanceof NotificationPermissionDeniedError) {
        setReminderSheetVisible(false);
      }
      // Hook state keeps save failures visible in the sheet and after it closes.
      if (!(error instanceof NotificationPermissionDeniedError)) {
        return;
      }
    }
  }

  async function disableReminder(): Promise<void> {
    try {
      const disabled = await notifications.disableReminder(notification);
      if (!disabled) return;
      setReminderSheetVisible(false);
    } catch {
      // Hook state keeps the disable failure visible with a retryable action.
    }
  }

  async function openDeviceSettings(): Promise<void> {
    setOpenSettingsError(false);
    try {
      await Linking.openSettings();
    } catch {
      setOpenSettingsError(true);
    }
  }

  const permission = permissionPresentation(notifications.permission, text);
  const operationError = notifications.error === "load"
    ? { body: text.loadErrorDetail, title: text.loadErrorTitle }
    : notifications.error === "request"
      ? { body: text.requestErrorDetail, title: text.requestErrorTitle }
      : notifications.error === "save" && !reminderSheetVisible
        ? { body: text.reminderSaveErrorDetail, title: text.reminderSaveErrorTitle }
        : notifications.error === "disable" && !reminderSheetVisible
          ? { body: text.reminderDisableErrorDetail, title: text.reminderDisableErrorTitle }
      : null;
  const reminderOperationError = notifications.error === "save"
    ? { body: text.reminderSaveErrorDetail, title: text.reminderSaveErrorTitle }
    : notifications.error === "disable"
      ? { body: text.reminderDisableErrorDetail, title: text.reminderDisableErrorTitle }
      : null;

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        backAction={{ accessibilityLabel: backLabel, onPress: handleBack }}
        context={context}
        contextTone="primary"
        title={text.reminders}
      />

      <View style={styles.content}>
        {notifications.loading ? <InfoBlock body={text.loadingDetail} title={text.loading} testID="notification-settings-loading" /> : null}
        {operationError ? (
          <View style={styles.operationError}>
            <InfoBlock accessibilityAlert body={operationError.body} title={operationError.title} testID={`notification-settings-error-${notifications.error}`} tone="warning" />
            {notifications.error === "load" ? <Button disabled={notifications.busy} loading={notifications.loading} onPress={() => { void notifications.refresh(); }} variant="secondary">{text.retry}</Button> : null}
          </View>
        ) : null}
        {openSettingsError ? <InfoBlock accessibilityAlert body={text.openSettingsErrorDetail} title={text.openSettingsErrorTitle} testID="notification-settings-open-settings-error" tone="warning" /> : null}
        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{text.permissionSection}</Text>
        <PermissionCard
          disabled={notifications.loading || notifications.busy}
          detail={permission.detail}
          icon={permission.icon}
          iconColor={permission.iconColor(colors)}
          onOpenSettings={notifications.permission === "denied" ? () => { void openDeviceSettings(); } : undefined}
          testID={`notification-permission-${notifications.permission ?? "checking"}`}
          title={permission.title}
          tone={permission.tone}
          openSettingsLabel={text.openDeviceSettings}
        />

        {notifications.permission === "undetermined" ? (
          <Button disabled={notifications.loading || notifications.busy} loading={notifications.busyOperation === "request"} onPress={() => { void requestPermission(); }}>{text.permissionRequest}</Button>
        ) : null}

        <View style={styles.scheduleContext} testID={`notification-goal-${notifications.context.status}`}>
          <Text maxFontSizeMultiplier={2} style={styles.scheduleContextLabel}>{text.activeTrack}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.scheduleContextValue}>{activeTrack ? t(activeTrack.shortTitle, { ns: "common" }) : text.noActiveTrack}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.scheduleContextLabel}>{text.preferredDays}</Text>
          {notifications.context.status === "active" ? (
            <View style={styles.dayList}>{GOAL_DAY_IDS.filter((day) => notifications.context.preferredDays.includes(day)).map((day) => <Text key={day} maxFontSizeMultiplier={2} style={styles.dayBadge}>{dayLabels[day]}</Text>)}</View>
          ) : <Text maxFontSizeMultiplier={2} style={styles.scheduleUnavailable}>{goalStatusDetail}</Text>}
        </View>

        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{text.reminderSection}</Text>
        <ListRow
          detail={notifications.loading || notifications.permission === null ? text.reminderUnavailable : reminderBlocked ? text.reminderBlocked : goalUnavailable ? goalStatusDetail : notifications.practiceReminder ? formatDailyReminderTime(notifications.practiceReminder) : text.reminderOff}
          disabled={reminderDisabled}
          leading={<IconTile iconSize={20} name="bell" size={32} tone={reminderBlocked ? "muted" : "settings"} />}
          onPress={openReminderSheet}
          testID="notification-practice-reminder"
          title={text.dailyReminder}
          trailing={reminderDisabled ? undefined : <Icon color={colors.listRow.icon} name="chevron-right" size={16} />}
          variant="settings"
        />
        {reminderBlocked ? null : <Text maxFontSizeMultiplier={2} style={styles.note}>{text.reminderNote}</Text>}
      </View>

      <SettingsBottomSheet
        closeLabel={text.close}
        intro={text.sheetIntro}
        onClose={() => setReminderSheetVisible(false)}
        title={text.sheetTitle}
        variant="reminder"
        visible={reminderSheetVisible}
      >
        <TextInput
          accessibilityLabel={text.dailyReminder}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          maxFontSizeMultiplier={2}
          onChangeText={(value) => { setReminderTime(value); setReminderError(null); }}
          placeholder={text.reminderTimePlaceholder}
          placeholderTextColor={colors.textMuted}
          editable={!notifications.loading && !notifications.busy}
          style={styles.reminderTimeInput}
          value={reminderTime}
        />
        {reminderError ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.reminderError}>{reminderError}</Text> : null}
        {reminderOperationError ? <InfoBlock accessibilityAlert body={reminderOperationError.body} title={reminderOperationError.title} testID={`notification-settings-error-${notifications.error}`} tone="warning" /> : null}
        <View style={styles.sheetActions}>
          <Button disabled={notifications.loading || notifications.busy || notifications.permission === "denied"} loading={notifications.busyOperation === "save"} onPress={() => { void saveReminder(); }}>{text.reminderSave}</Button>
          {notifications.practiceReminder ? (
            <Button disabled={notifications.loading || notifications.busy} loading={notifications.busyOperation === "disable"} onPress={() => { void disableReminder(); }} variant="ghost">{text.disableReminder}</Button>
          ) : null}
        </View>
      </SettingsBottomSheet>
    </Screen>
  );
}

function PermissionCard({ detail, disabled = false, icon, iconColor, onOpenSettings, openSettingsLabel, testID, title, tone }: Readonly<{
  detail: string;
  disabled?: boolean;
  icon: "alert-triangle" | "settings" | "shield-check";
  iconColor: string;
  onOpenSettings?: () => void;
  openSettingsLabel: string;
  testID: string;
  title: string;
  tone: "neutral" | "success" | "warning";
}>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.permissionCard, tone === "success" ? styles.permissionGranted : null, tone === "warning" ? styles.permissionWarning : null]} testID={testID}>
      <View style={[styles.permissionHeader, tone === "warning" ? styles.permissionWarningHeader : null]}>
        <View style={[styles.permissionIcon, tone === "success" ? styles.permissionSuccessIcon : tone === "warning" ? styles.permissionWarningIcon : null]}>
          <Icon color={iconColor} name={icon} size={20} />
        </View>
        <View style={styles.permissionCopy}>
          <Text maxFontSizeMultiplier={2} style={[styles.permissionTitle, tone === "warning" ? styles.permissionWarningTitle : null]}>{title}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.permissionDetail}>{detail}</Text>
        </View>
      </View>
      {onOpenSettings ? (
        <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onOpenSettings} style={[styles.permissionAction, disabled ? styles.permissionActionDisabled : null]}>
          <Text maxFontSizeMultiplier={2} style={styles.permissionActionText}>{openSettingsLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function permissionPresentation(
  permission: ReturnType<typeof useNotificationSettings>["permission"],
  text: Record<keyof typeof notificationCopy, string>,
): Readonly<{
  detail: string;
  icon: "alert-triangle" | "settings" | "shield-check";
  iconColor: (colors: AppColors) => string;
  title: string;
  tone: "neutral" | "success" | "warning";
}> {
  if (permission === "granted") return { detail: text.permissionGrantedDetail, icon: "shield-check", iconColor: (colors) => colors.success, title: text.permissionGranted, tone: "success" };
  if (permission === "denied") return { detail: text.permissionDeniedDetail, icon: "alert-triangle", iconColor: (colors) => colors.warning, title: text.permissionDenied, tone: "warning" };
  if (permission === null) return { detail: text.permissionCheckingDetail, icon: "settings", iconColor: (colors) => colors.textSecondary, title: text.permissionChecking, tone: "neutral" };
  return { detail: text.permissionUndeterminedDetail, icon: "settings", iconColor: (colors) => colors.textSecondary, title: text.permissionPending, tone: "neutral" };
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  content: { gap: spacing.xxl },
  operationError: { gap: spacing.sm },
  sectionLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, lineHeight: 13, textTransform: "uppercase" },
  permissionCard: { backgroundColor: palette.listRow.surface, borderRadius: radius.button, gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  permissionGranted: { paddingVertical: 14 },
  permissionWarning: { backgroundColor: palette.warningSoft },
  permissionHeader: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  permissionWarningHeader: { gap: 10 },
  permissionIcon: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderRadius: radius.md, height: 32, justifyContent: "center", width: 32 },
  permissionSuccessIcon: { backgroundColor: palette.successSoft },
  permissionWarningIcon: { backgroundColor: palette.warningSoft },
  permissionCopy: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  permissionTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "500", lineHeight: 18 },
  permissionWarningTitle: { color: palette.warning, fontWeight: "600" },
  permissionDetail: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 16 },
  permissionAction: { alignItems: "flex-start", justifyContent: "center", minHeight: 44 },
  permissionActionDisabled: { opacity: 0.5 },
  permissionActionText: { color: palette.warning, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  note: { color: palette.textMuted, fontSize: 12.5, lineHeight: 16 },
  scheduleContext: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  scheduleContextLabel: { ...typography.small, color: palette.textSecondary },
  scheduleContextValue: { ...typography.bodyStrong, color: palette.textPrimary },
  scheduleUnavailable: { ...typography.body, color: palette.textSecondary },
  dayList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dayBadge: { ...typography.small, backgroundColor: palette.primarySoft, borderRadius: radius.pill, color: palette.primary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  reminderTimeInput: { color: palette.textPrimary, fontSize: 28, fontWeight: "600", lineHeight: 34, minHeight: 66, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, textAlign: "center", textAlignVertical: "center" },
  reminderError: { ...typography.small, color: palette.danger },
  sheetActions: { gap: spacing.lg },
});
