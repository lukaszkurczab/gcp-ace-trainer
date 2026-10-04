import { getTrackIconName } from "../../components/trackIcon";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppShellHeader, Button, Icon, Screen } from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  CODING_INTERVIEW_TRACK_ID,
  getTrackDisplays,
  type TrackDisplay,
  type TrackId,
} from "../../domain";
import { goBackOrHome } from "../../navigation/goBackOrHome";
import type { RootStackParamList } from "../../navigation/types";
import { loadActiveTrackId as getActiveTrackId, selectActiveTrack as saveActiveTrackId } from "../../application/learningReadModels";
import { colorWithOpacity, spacing, typography } from "../../theme";
import type { AppColors } from "../../theme";
import { reconcileDeviceReminder, reminderNeedsAttention, useAppPreferences, useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import type { LearningPlanReminderFailure } from "../../application/notificationPreferences";

type SelectTrackScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onboarding?: boolean;
  onTrackSelected?: (trackId: TrackId) => void;
};

/** Selection remains local until the single footer command commits one canonical track. */
export function SelectTrackScreen({ navigation, onboarding = false, onTrackSelected }: SelectTrackScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const { t: tNotifications } = useTranslation("notifications");
  const reminderCopy = useMemo(() => ({ body: tNotifications("notificationBody"), title: tNotifications("notificationTitle") }), [tNotifications]);
  const largeText = fontScale >= 1.3;
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId>(CODING_INTERVIEW_TRACK_ID);
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reminderErrorKind, setReminderErrorKind] = useState<LearningPlanReminderFailure | null>(null);
  const commitLock = useRef(false);
  const screenFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      screenFocused.current = true;
      setLoaded(false);
      setLoadError(null);
      void getActiveTrackId()
        .then((trackId) => {
          if (!active) return;
          setActiveTrackId(trackId ?? null);
          setSelectedTrackId(trackId ?? CODING_INTERVIEW_TRACK_ID);
          setLoaded(true);
        })
        .catch(() => {
          if (!active) return;
          setLoadError("We couldn't load your saved track. Check your connection and try again.");
          setLoaded(true);
        });
      return () => { active = false; screenFocused.current = false; };
    }, [loadRevision]),
  );

  async function commitSelection() {
    if (!loaded || isSaving || commitLock.current) return;
    const track = getTrackDisplays().find((candidate) => candidate.id === selectedTrackId);
    if (!track || track.status === "archived") return;
    setIsSaving(true);
    commitLock.current = true;
    setSaveError(null);
    setReminderErrorKind(null);
    try {
      await saveActiveTrackId(track.id);
      let reminderResult: Awaited<ReturnType<typeof reconcileDeviceReminder>>;
      try {
        reminderResult = await reconcileDeviceReminder(reminderCopy);
      } catch {
        if (screenFocused.current) {
          setReminderErrorKind("scheduler_failure");
          setSaveError(tNotifications("schedulerFailureDetail"));
        }
        return;
      }
      if (reminderNeedsAttention(reminderResult)) {
        if (screenFocused.current) {
          setReminderErrorKind(reminderResult.kind);
          const key = reminderResult.kind === "goal_paused" ? "goalPausedDetail" : reminderResult.kind === "concurrent_change" ? "concurrentChangeDetail" : "schedulerFailureDetail";
          setSaveError(tNotifications(key));
        }
        return;
      }
      setActiveTrackId(track.id);
      if (onTrackSelected) onTrackSelected(track.id);
      else navigation.navigate(ROUTES.HOME, { initialTab: "home" });
    } catch {
      setSaveError("We couldn't save that track. Your choice is still selected. Try again.");
    } finally {
      commitLock.current = false;
      setIsSaving(false);
    }
  }

  const showFooter = !loadError && (!loaded || onboarding || selectedTrackId !== activeTrackId);

  return (
    <View style={styles.shell} testID="patternly:home:select-track:root">
      <Screen
        edges={["top", "bottom"]}
        footer={showFooter ? (
          <View style={[styles.footerContent, largeText ? styles.actionsLargeText : null]}>
            {saveError ? <View testID="patternly:home:select-track:save-error"><Text accessibilityLiveRegion="polite" accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.saveError} testID={reminderErrorKind ? runtimeSelectors.notifications.error(reminderErrorKind) : undefined}>{t(saveError)}</Text></View> : null}
            <Button
              disabled={!loaded || isSaving || (!onboarding && selectedTrackId === activeTrackId)}
              loading={isSaving}
              onPress={() => { void commitSelection(); }}
              style={[styles.actionButton, largeText ? styles.actionButtonLargeText : null]}
              testID={runtimeSelectors.home.selectTrackContinue()}
            >
              {t("Start track")}
            </Button>
          </View>
        ) : undefined}
        footerVariant="sticky"
        style={[styles.screenContent, !onboarding ? styles.returningScreenContent : null]}
      >
        {!onboarding ? <AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} placement="back" /> : null}
        {loadError ? (
          <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.unavailableState} testID="patternly:home:select-track:unavailable">
            <Text maxFontSizeMultiplier={2} style={styles.unavailableTitle}>{t("Track selection unavailable")}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.unavailableDescription}>{t(loadError)}</Text>
            <Button onPress={() => setLoadRevision((revision) => revision + 1)} style={styles.retryButton} testID="patternly:home:select-track:retry">
              {t("Try again")}
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.intro}>
              <Text maxFontSizeMultiplier={2} style={styles.title}>{t(onboarding ? "Welcome to Patternly" : "Tracks")}</Text>
              <Text maxFontSizeMultiplier={2} style={styles.subtitle}>{t(onboarding ? "Start with one track. You can switch whenever your goal changes." : "Choose the track you want to practice now.")}</Text>
              {onboarding ? <Text maxFontSizeMultiplier={2} style={styles.sectionLabel}>{t("Available tracks")}</Text> : null}
              {!onboarding ? (
                <View style={styles.safetyBadge}>
                  <Icon color={colorWithOpacity(palette.textMuted, 0.5)} name="shield-alert" size={14} />
                  <Text maxFontSizeMultiplier={2} style={styles.safetyText}>{t("Changing the current track does not remove existing progress.")}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.trackList}>
              {getTrackDisplays().map((track) => (
                <TrackChoiceCard
                  key={track.id}
                  largeText={largeText}
                  disabled={isSaving}
                  onPress={() => {
                    setSelectedTrackId(track.id);
                    setSaveError(null);
                    setReminderErrorKind(null);
                  }}
                  selected={track.id === selectedTrackId}
                  track={track}
                  title={t(track.shortTitle)}
                />
              ))}
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

function TrackChoiceCard({ disabled, largeText, onPress, selected, title, track }: Readonly<{ disabled?: boolean; largeText: boolean; onPress: () => void; selected: boolean; title: string; track: TrackDisplay }>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const icon = getTrackIconName(track.id);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={[title, t(track.description)].join(". ")}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.trackCard, selected ? styles.trackCardSelected : null, pressed ? styles.pressed : null]}
      testID={runtimeSelectors.home.selectTrack(track.id)}
    >
      {selected ? <View style={styles.selectedRail} /> : null}
      <View style={[styles.cardTopRow, largeText ? styles.trackMetaRowLargeText : null]}>
        <View style={styles.cardInfo}>
          <View style={styles.trackIcon}>
            <Icon color={palette.primary} name={icon} size={24} />
          </View>
          <View style={styles.titleGroup}>
            <Text maxFontSizeMultiplier={2} style={[styles.trackTitle, selected ? null : styles.trackTitleUnselected]}>{title}</Text>
          </View>
        </View>
        <View style={[styles.radio, selected ? styles.radioSelected : styles.radioUnselected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      </View>
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: { backgroundColor: "transparent", flex: 1 },
  screenContent: { gap: spacing.xxl, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  returningScreenContent: { gap: spacing.lg, paddingTop: spacing.xs },
  intro: { gap: spacing.sm },
  title: { color: palette.textPrimary, fontSize: 29, fontWeight: "600", lineHeight: 35 },
  subtitle: { color: palette.textSecondary, fontSize: 14, lineHeight: 20 },
  unavailableState: { alignItems: "center", gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.xxxl },
  unavailableTitle: { color: palette.textPrimary, fontSize: 22, fontWeight: "600", lineHeight: 28, textAlign: "center" },
  unavailableDescription: { color: palette.textSecondary, fontSize: 14, lineHeight: 20, textAlign: "center" },
  retryButton: { alignSelf: "stretch" },
  sectionLabel: { color: palette.textMuted, fontSize: 13, fontWeight: "600", lineHeight: 18, paddingTop: spacing.sm },
  safetyBadge: { alignItems: "center", flexDirection: "row", gap: 6, paddingVertical: spacing.xs },
  safetyText: { color: colorWithOpacity(palette.textMuted, 0.5), fontSize: 12, lineHeight: 15.4 },
  trackList: { gap: spacing.sm },
  trackCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    position: "relative",
  },
  trackCardSelected: { borderColor: palette.primary },
  selectedRail: { backgroundColor: palette.primary, borderRadius: 2, height: 36, left: -1, position: "absolute", top: 15, width: 3 },
  cardTopRow: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "space-between", overflow: "hidden" },
  trackMetaRowLargeText: { alignItems: "flex-start", flexDirection: "column" },
  cardInfo: { alignItems: "center", flex: 1, flexDirection: "row", gap: spacing.md, minWidth: 0 },
  trackIcon: { alignItems: "center", backgroundColor: palette.surfaceInput, borderColor: palette.primary, borderRadius: 12, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  titleGroup: { flex: 1, minWidth: 0 },
  trackTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  trackTitleUnselected: { color: palette.textSecondary },
  radio: { alignItems: "center", borderRadius: 10, borderWidth: 2, height: 20, justifyContent: "center", width: 20 },
  radioSelected: { borderColor: palette.primary },
  radioUnselected: { borderColor: palette.border },
  radioDot: { backgroundColor: palette.primary, borderRadius: 4, height: 8, width: 8 },
  pressed: { opacity: 0.8 },
  footerContent: { gap: 14, paddingBottom: spacing.xs },
  saveError: { color: palette.danger, fontSize: 13, lineHeight: 18 },
  actionsLargeText: { flexDirection: "column" },
  actionButton: { flex: 1 },
  actionButtonLargeText: { flex: 0, width: "100%" },
});
