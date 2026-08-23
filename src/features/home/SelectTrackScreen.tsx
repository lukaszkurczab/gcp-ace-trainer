import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppShellHeader, Button, Icon, Screen } from "../../components";
import { ROUTES } from "../../constants/routes";
import {
  CODING_INTERVIEW_TRACK_ID,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  getTrackDisplays,
  type TrackDisplay,
  type TrackId,
} from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { goBackOrHome } from "../../navigation";
import { loadActiveTrackId as getActiveTrackId, selectActiveTrack as saveActiveTrackId } from "../../application/learningReadModels";
import { colorWithOpacity, spacing, typography } from "../../theme";
import type { AppColors } from "../../theme";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

type SelectTrackScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onboarding?: boolean;
  onTrackSelected?: (trackId: TrackId) => void;
};

/** Figma 05A track-choice shell. Selection is local until the single footer command commits it. */
export function SelectTrackScreen({ navigation, onboarding = false, onTrackSelected }: SelectTrackScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { colors: palette, t } = useAppPreferences();
  const largeText = fontScale >= 1.3;
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId>(CODING_INTERVIEW_TRACK_ID);
  const [activeTrackId, setActiveTrackId] = useState<TrackId | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getActiveTrackId().then((trackId) => {
        if (!active) return;
        setActiveTrackId(trackId ?? null);
        setSelectedTrackId(trackId ?? CODING_INTERVIEW_TRACK_ID);
        setLoaded(true);
      });
      return () => { active = false; };
    }, []),
  );

  async function commitSelection() {
    if (!loaded || isSaving) return;
    const track = getTrackDisplays().find((candidate) => candidate.id === selectedTrackId);
    if (!track || track.status === "archived") return;
    setIsSaving(true);
    try {
      await saveActiveTrackId(track.id);
      setActiveTrackId(track.id);
      onTrackSelected?.(track.id);
      if (onTrackSelected) return;
      navigation.navigate(ROUTES.HOME, { initialTab: "home" });
    } finally {
      setIsSaving(false);
    }
  }

  const selectedTrack = getTrackDisplays().find((track) => track.id === selectedTrackId);
  const showFooter = !loaded || onboarding || selectedTrackId !== activeTrackId;

  return (
    <View style={styles.shell} testID="patternly:home:select-track:root">
      <Screen
        edges={["top", "bottom"]}
        footer={showFooter ? (
          <View style={[styles.footerContent, largeText ? styles.actionsLargeText : null]}>
            {onboarding || selectedTrackId === activeTrackId ? (
              <View style={[styles.selectedSummary, largeText ? styles.progressHeaderLargeText : null]}>
                <Text style={styles.selectedLabel}>{t("Selected")}</Text>
                <Text maxFontSizeMultiplier={2} style={styles.selectedValue}>
                  {t(selectedTrack?.shortTitle ?? "Coding Interview")}
                </Text>
              </View>
            ) : null}
            <Button
              disabled={!loaded || isSaving || (!onboarding && selectedTrackId === activeTrackId)}
              loading={isSaving}
              onPress={() => { void commitSelection(); }}
              style={[styles.actionButton, largeText ? styles.actionButtonLargeText : null]}
              testID={runtimeSelectors.home.selectTrackContinue()}
            >
              {t(onboarding ? "Continue" : "Use this track")}
            </Button>
          </View>
        ) : undefined}
        style={[styles.screenContent, !onboarding ? styles.returningScreenContent : null]}
      >
        {!onboarding ? <AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} placement="back" /> : null}
        <View style={styles.intro}>
          <Text maxFontSizeMultiplier={2} style={styles.title}>{t(onboarding ? "Choose a track" : "Tracks")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.subtitle}>{t(onboarding ? "Choose what you want to practice first. You can switch tracks later." : "Choose the track you want to practice now.")}</Text>
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
              onPress={() => setSelectedTrackId(track.id)}
              selected={track.id === selectedTrackId}
              track={track}
              title={t(track.title)}
            />
          ))}
        </View>
      </Screen>
    </View>
  );
}

function TrackChoiceCard({ disabled, largeText, onPress, selected, title, track }: Readonly<{ disabled?: boolean; largeText: boolean; onPress: () => void; selected: boolean; title: string; track: TrackDisplay }>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const coding = track.id === CODING_INTERVIEW_TRACK_ID;
  const cloud = track.id === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID;
  const icon = coding ? "route" : cloud ? "server-stack" : "grid";
  const subtitle = coding ? "DSA & Problem Solving" : cloud ? "Cloud Fundamentals" : track.shortTitle;
  const freeStart = coding ? "Free start · Complexity and constraints" : cloud ? "Free start · Cloud fundamentals" : track.shortTitle;

  return (
    <Pressable
      accessibilityRole="radio"
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
                <Text maxFontSizeMultiplier={2} style={[styles.trackTitle, selected ? null : styles.trackTitleUnselected]}>{coding ? t("Coding Interview") : title}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.trackSubtitle}>{t(subtitle)}</Text>
          </View>
        </View>
        <View style={[styles.radio, selected ? styles.radioSelected : styles.radioUnselected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      </View>
      <Text maxFontSizeMultiplier={2} style={styles.trackDescription}>{t(track.description)}</Text>
      <View style={styles.freeBadge}>
        <View style={[styles.freeDot, selected ? styles.freeDotSelected : null]} />
        <Text style={styles.freeLabel}>{t(freeStart)}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  shell: { backgroundColor: palette.background, flex: 1 },
  screenContent: { gap: spacing.xxl, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  returningScreenContent: { gap: spacing.lg, paddingTop: spacing.xs },
  intro: { gap: spacing.sm },
  title: { color: palette.textPrimary, fontSize: 29, fontWeight: "600", lineHeight: 35 },
  subtitle: { color: palette.textSecondary, fontSize: 14, lineHeight: 20 },
  safetyBadge: { alignItems: "center", flexDirection: "row", gap: 6, paddingVertical: spacing.xs },
  safetyText: { color: colorWithOpacity(palette.textMuted, 0.5), fontSize: 12, lineHeight: 15.4 },
  trackList: { gap: spacing.md },
  trackCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: spacing.lg,
    position: "relative",
  },
  trackCardSelected: { borderColor: palette.primary },
  selectedRail: { backgroundColor: palette.primary, borderRadius: 2, height: 44, left: -1, position: "absolute", top: 54, width: 3 },
  cardTopRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md, justifyContent: "space-between", overflow: "hidden" },
  trackMetaRowLargeText: { alignItems: "flex-start", flexDirection: "column" },
  cardInfo: { alignItems: "flex-start", flex: 1, flexDirection: "row", gap: spacing.md, minWidth: 0 },
  trackIcon: { alignItems: "center", backgroundColor: palette.surfaceInput, borderColor: palette.primary, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  titleGroup: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  trackTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  trackTitleUnselected: { color: palette.textSecondary },
  trackSubtitle: { color: palette.textMuted, fontSize: 11, fontWeight: "400", lineHeight: 15.4 },
  radio: { alignItems: "center", borderRadius: 10, borderWidth: 2, height: 20, justifyContent: "center", width: 20 },
  radioSelected: { borderColor: palette.primary },
  radioUnselected: { borderColor: palette.border },
  radioDot: { backgroundColor: palette.primary, borderRadius: 4, height: 8, width: 8 },
  trackDescription: { ...typography.body, color: palette.textMuted },
  freeBadge: { alignItems: "center", flexDirection: "row", gap: 6 },
  freeDot: { backgroundColor: palette.textMuted, borderRadius: 4, height: 7, width: 7 },
  freeDotSelected: { backgroundColor: palette.primary },
  freeLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "400", lineHeight: 15.4 },
  pressed: { opacity: 0.8 },
  footerContent: { gap: 14, paddingBottom: spacing.sm },
  actionsLargeText: { flexDirection: "column" },
  actionButton: { flex: 1 },
  actionButtonLargeText: { flex: 0, width: "100%" },
  progressHeaderLargeText: { alignItems: "flex-start", flexDirection: "column", justifyContent: "flex-start" },
  selectedSummary: { gap: spacing.xxs },
  selectedLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "400", lineHeight: 15.4 },
  selectedValue: { color: palette.textPrimary, fontSize: 13, fontWeight: "500", lineHeight: 16 },
});
