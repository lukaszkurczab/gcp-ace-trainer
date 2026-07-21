import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TextInput, View } from "react-native";

import {
  Button,
  Icon,
  IconTile,
  InfoBlock,
  ListRow,
  Screen,
  SettingsBottomSheet,
  SettingsDialog,
  SettingsGroup,
} from "../../components";
import {
  formatDailyReminderTime,
  NotificationPermissionDeniedError,
  parseDailyReminderTime,
} from "../../application/notificationPreferences";
import { useAppPreferences, useNotificationSettings, useThemedStyles, type AppLocale } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";

const copy = {
  en: {
    close: "Close",
    dailyReminder: "Daily reminder",
    dailyReminderDetail: "Choose when Patternly should remind you to practise.",
    disableReminder: "Turn off reminder",
    notificationBody: "Choose one focused Patternly practice session.",
    notificationTitle: "Time to practise",
    openDeviceSettings: "Open device settings",
    permissionDenied: "Notifications are blocked",
    permissionDeniedDetail: "Allow notifications in device settings to use reminders.",
    permissionGranted: "Notifications are allowed",
    permissionGrantedDetail: "Patternly can show local practice reminders.",
    permissionPending: "Checking notification permission",
    permissionRequest: "Enable notifications",
    permissionUndeterminedDetail: "Allow local notifications before setting a reminder.",
    preferences: "Preferences",
    reminderOff: "Off",
    reminderPermissionDenied: "Allow notifications in device settings before saving a reminder.",
    reminderSave: "Save reminder",
    reminderTimeInvalid: "Use a valid 24-hour time, for example 20:00.",
    reminderTimePlaceholder: "20:00",
    settingsDialogMessage: "Patternly needs notification permission to schedule a daily reminder. You can enable it in device settings.",
    settingsDialogTitle: "Enable notifications in settings",
    sheetIntro: "Set a daily time for one focused practice session.",
    sheetTitle: "Daily reminder",
    notNow: "Not now",
  },
  pl: {
    close: "Zamknij",
    dailyReminder: "Codzienne przypomnienie",
    dailyReminderDetail: "Wybierz, kiedy Patternly ma przypominać o ćwiczeniach.",
    disableReminder: "Wyłącz przypomnienie",
    notificationBody: "Wybierz jedną skupioną sesję ćwiczeń w Patternly.",
    notificationTitle: "Czas na ćwiczenia",
    openDeviceSettings: "Otwórz ustawienia urządzenia",
    permissionDenied: "Powiadomienia są zablokowane",
    permissionDeniedDetail: "Zezwól na powiadomienia w ustawieniach urządzenia, aby korzystać z przypomnień.",
    permissionGranted: "Powiadomienia są dozwolone",
    permissionGrantedDetail: "Patternly może wyświetlać lokalne przypomnienia o ćwiczeniach.",
    permissionPending: "Sprawdzanie uprawnienia do powiadomień",
    permissionRequest: "Włącz powiadomienia",
    permissionUndeterminedDetail: "Zezwól na lokalne powiadomienia przed ustawieniem przypomnienia.",
    preferences: "Preferencje",
    reminderOff: "Wyłączone",
    reminderPermissionDenied: "Zezwól na powiadomienia w ustawieniach urządzenia przed zapisaniem przypomnienia.",
    reminderSave: "Zapisz przypomnienie",
    reminderTimeInvalid: "Podaj prawidłową godzinę w formacie 24-godzinnym, np. 20:00.",
    reminderTimePlaceholder: "20:00",
    settingsDialogMessage: "Patternly potrzebuje zgody na powiadomienia, aby ustawić codzienne przypomnienie. Możesz ją włączyć w ustawieniach urządzenia.",
    settingsDialogTitle: "Włącz powiadomienia w ustawieniach",
    sheetIntro: "Ustaw codzienną godzinę jednej skupionej sesji ćwiczeń.",
    sheetTitle: "Codzienne przypomnienie",
    notNow: "Nie teraz",
  },
} as const;

export function NotificationSettingsScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors, locale } = useAppPreferences();
  const notifications = useNotificationSettings();
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderSheetVisible, setReminderSheetVisible] = useState(false);
  const [reminderTime, setReminderTime] = useState("20:00");
  const [settingsDialogVisible, setSettingsDialogVisible] = useState(false);
  const text = copy[locale];

  useEffect(() => {
    if (notifications.dailyReminder) setReminderTime(formatDailyReminderTime(notifications.dailyReminder));
  }, [notifications.dailyReminder]);

  async function requestPermission() {
    const permission = await notifications.requestPermission();
    if (permission === "denied") setSettingsDialogVisible(true);
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
        setSettingsDialogVisible(true);
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
    <Screen>
      <InfoBlock
        body={permission.detail}
        icon={<Icon color={permission.iconColor(colors)} name={permission.icon} size={18} />}
        testID={`notification-permission-${notifications.permission ?? "checking"}`}
        title={permission.title}
        tone={permission.tone}
      />

      {notifications.permission === "undetermined" ? (
        <Button onPress={() => { void requestPermission(); }}>{text.permissionRequest}</Button>
      ) : null}
      {notifications.permission === "denied" ? (
        <Button onPress={() => { void Linking.openSettings(); }} variant="secondary">{text.openDeviceSettings}</Button>
      ) : null}

      <SettingsGroup title={text.preferences}>
        <ListRow
          detail={text.dailyReminderDetail}
          leading={<IconTile name="rotate-ccw" tone="primary" />}
          onPress={() => setReminderSheetVisible(true)}
          title={text.dailyReminder}
          trailing={<View style={styles.reminderValue}><Text style={styles.reminderValueLabel}>{notifications.dailyReminder ? formatDailyReminderTime(notifications.dailyReminder) : text.reminderOff}</Text><Icon color={colors.textMuted} name="chevron-right" size={18} /></View>}
          variant="grouped"
        />
      </SettingsGroup>

      <SettingsBottomSheet
        closeLabel={text.close}
        intro={text.sheetIntro}
        onClose={() => setReminderSheetVisible(false)}
        title={text.sheetTitle}
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
            <Button onPress={() => { void disableReminder(); }} variant="secondary">{text.disableReminder}</Button>
          ) : null}
        </View>
      </SettingsBottomSheet>

      <SettingsDialog
        closeLabel={text.close}
        message={text.settingsDialogMessage}
        onClose={() => setSettingsDialogVisible(false)}
        onPrimaryAction={() => { setSettingsDialogVisible(false); void Linking.openSettings(); }}
        primaryActionLabel={text.openDeviceSettings}
        secondaryActionLabel={text.notNow}
        title={text.settingsDialogTitle}
        visible={settingsDialogVisible}
      />
    </Screen>
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
  reminderValue: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  reminderValueLabel: { ...typography.caption, color: palette.textMuted },
  reminderTimeInput: { ...typography.body, backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: 8, borderWidth: 1, color: palette.textPrimary, minHeight: 48, paddingHorizontal: spacing.md },
  reminderError: { ...typography.small, color: palette.danger },
  sheetActions: { gap: spacing.sm },
});
