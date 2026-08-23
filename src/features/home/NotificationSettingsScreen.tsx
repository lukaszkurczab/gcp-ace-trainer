import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  Button,
  Icon,
  IconTile,
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
import { useAppPreferences, useNotificationSettings, useThemedStyles, type AppLocale } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";

const copy = {
  en: {
    close: "Close",
    dailyReminder: "Daily reminder",
    disableReminder: "Turn off reminder",
    notificationBody: "Choose one focused Patternly practice session.",
    notificationTitle: "Time to practise",
    openDeviceSettings: "Open device settings",
    permissionDenied: "Notifications are blocked",
    permissionDeniedDetail: "Allow notifications in device settings to use reminders.",
    permissionGranted: "Notifications allowed",
    permissionGrantedDetail: "Patternly can show local practice reminders.",
    permissionPending: "Checking notification permission",
    permissionSection: "Permission",
    permissionRequest: "Enable notifications",
    permissionUndeterminedDetail: "Allow local notifications before setting a reminder.",
    reminderOff: "Off",
    reminderBlocked: "Blocked",
    reminderSave: "Save reminder",
    reminderTimeInvalid: "Use a valid 24-hour time, for example 20:00.",
    reminderTimePlaceholder: "20:00",
    reminderNote: "One daily reminder on this device.",
    reminderSection: "Practice reminder",
    settings: "Settings",
    notifications: "Notifications",
    sheetIntro: "Choose when Patternly should remind you to practise.",
    sheetTitle: "Daily reminder",
  },
  pl: {
    close: "Zamknij",
    dailyReminder: "Codzienne przypomnienie",
    disableReminder: "Wyłącz przypomnienie",
    notificationBody: "Wybierz jedną skupioną sesję ćwiczeń w Patternly.",
    notificationTitle: "Czas na ćwiczenia",
    openDeviceSettings: "Otwórz ustawienia urządzenia",
    permissionDenied: "Powiadomienia są zablokowane",
    permissionDeniedDetail: "Zezwól na powiadomienia w ustawieniach urządzenia, aby korzystać z przypomnień.",
    permissionGranted: "Powiadomienia są dozwolone",
    permissionGrantedDetail: "Patternly może wyświetlać lokalne przypomnienia o ćwiczeniach.",
    permissionPending: "Sprawdzanie uprawnienia do powiadomień",
    permissionSection: "Uprawnienia",
    permissionRequest: "Włącz powiadomienia",
    permissionUndeterminedDetail: "Zezwól na lokalne powiadomienia przed ustawieniem przypomnienia.",
    reminderOff: "Wyłączone",
    reminderBlocked: "Zablokowane",
    reminderSave: "Zapisz przypomnienie",
    reminderTimeInvalid: "Podaj prawidłową godzinę w formacie 24-godzinnym, np. 20:00.",
    reminderTimePlaceholder: "20:00",
    reminderNote: "Jedno codzienne przypomnienie na tym urządzeniu.",
    reminderSection: "Przypomnienie o ćwiczeniach",
    settings: "Ustawienia",
    notifications: "Powiadomienia",
    sheetIntro: "Ustaw codzienną godzinę jednej skupionej sesji ćwiczeń.",
    sheetTitle: "Codzienne przypomnienie",
  },
} as const;

type NotificationSettingsScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.NOTIFICATION_SETTINGS>;

export function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors, locale } = useAppPreferences();
  const notifications = useNotificationSettings();
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const text = copy[locale];
  const reminderBlocked = notifications.permission === "denied";

  useEffect(() => {
    if (notifications.dailyReminder) setReminderTime(formatDailyReminderTime(notifications.dailyReminder));
  }, [notifications.dailyReminder]);

  async function requestPermission() {
    await notifications.requestPermission();
  }

  async function saveReminder() {
    let time;
    try {
      time = parseDailyReminderTime(reminderTime);
    } catch {
      setReminderError(text.reminderTimeInvalid);
      return;
    }

    try {
      await notifications.saveReminder(time, {
        body: text.notificationBody,
        title: text.notificationTitle,
      });
      setReminderError(null);
      setReminderSheetVisible(false);
    } catch (error) {
      if (error instanceof NotificationPermissionDeniedError) {
        setReminderSheetVisible(false);
        return;
      }
      throw error;
    }
  }

  async function disableReminder() {
    await notifications.disableReminder({ body: text.notificationBody, title: text.notificationTitle });
    setReminderSheetVisible(false);
  }

  const permission = permissionPresentation(notifications.permission, text);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader
        backAction={{ onPress: () => navigation.goBack() }}
        context={text.settings}
        contextTone="primary"
        title={text.notifications}
      />

      <View style={styles.content}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{text.permissionSection}</Text>
        <PermissionCard
          detail={permission.detail}
          icon={permission.icon}
          iconColor={permission.iconColor(colors)}
          onOpenSettings={notifications.permission === "denied" ? () => { void Linking.openSettings(); } : undefined}
          testID={`notification-permission-${notifications.permission ?? "checking"}`}
          title={permission.title}
          tone={permission.tone}
          openSettingsLabel={text.openDeviceSettings}
        />

        {notifications.permission === "undetermined" ? (
          <Button onPress={() => { void requestPermission(); }}>{text.permissionRequest}</Button>
        ) : null}

        <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{text.reminderSection}</Text>
        <ListRow
          detail={reminderBlocked ? text.reminderBlocked : notifications.dailyReminder ? formatDailyReminderTime(notifications.dailyReminder) : text.reminderOff}
          disabled={reminderBlocked}
          leading={<IconTile iconSize={20} name="bell" size={32} tone={reminderBlocked ? "muted" : "settings"} />}
          onPress={reminderBlocked ? undefined : () => setReminderSheetVisible(true)}
          title={text.dailyReminder}
          trailing={reminderBlocked ? undefined : <Icon color={colors.listRow.icon} name="chevron-right" size={16} />}
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
          onChangeText={(value) => { setReminderTime(value); setReminderError(null); }}
          placeholder={text.reminderTimePlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.reminderTimeInput}
          value={reminderTime}
        />
        {reminderError ? <Text style={styles.reminderError}>{reminderError}</Text> : null}
        <View style={styles.sheetActions}>
          <Button onPress={() => { void saveReminder(); }}>{text.reminderSave}</Button>
          {notifications.dailyReminder ? (
            <Button onPress={() => { void disableReminder(); }} variant="ghost">{text.disableReminder}</Button>
          ) : null}
        </View>
      </SettingsBottomSheet>
    </Screen>
  );
}

function PermissionCard({ detail, icon, iconColor, onOpenSettings, openSettingsLabel, testID, title, tone }: Readonly<{
  detail: string;
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
        <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.permissionAction}>
          <Text maxFontSizeMultiplier={2} style={styles.permissionActionText}>{openSettingsLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function permissionPresentation(
  permission: ReturnType<typeof useNotificationSettings>["permission"],
  text: (typeof copy)[AppLocale],
): Readonly<{
  detail: string;
  icon: "alert-triangle" | "settings" | "shield-check";
  iconColor: (colors: AppColors) => string;
  title: string;
  tone: "neutral" | "success" | "warning";
}> {
  if (permission === "granted") return { detail: text.permissionGrantedDetail, icon: "shield-check", iconColor: (colors) => colors.success, title: text.permissionGranted, tone: "success" };
  if (permission === "denied") return { detail: text.permissionDeniedDetail, icon: "alert-triangle", iconColor: (colors) => colors.warning, title: text.permissionDenied, tone: "warning" };
  return { detail: text.permissionUndeterminedDetail, icon: "settings", iconColor: (colors) => colors.textSecondary, title: text.permissionPending, tone: "neutral" };
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  content: { gap: spacing.xxl },
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
  permissionActionText: { color: palette.warning, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  note: { color: palette.textMuted, fontSize: 12.5, lineHeight: 16 },
  reminderTimeInput: { color: palette.textPrimary, fontSize: 28, fontWeight: "600", height: 66, lineHeight: 34, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, textAlign: "center" },
  reminderError: { ...typography.small, color: palette.danger },
  sheetActions: { gap: spacing.lg },
});
