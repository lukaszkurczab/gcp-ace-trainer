import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { loadActivitySessionRecords, type ActivitySessionRecord } from "../../application/activityReadModels";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { EmptyState, Icon, LoadingState, Screen, ScreenHeader, SettingsBottomSheet } from "../../components";
import { ROUTES } from "../../constants";
import { getTrackDisplays } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { ALL_ACTIVITY_TRACKS, buildActivityModel, type ActivityFilter, type ActivityItem } from "./tabs/activityModel";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ACTIVITY>;
type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; records: readonly ActivitySessionRecord[] }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

export function ActivityScreen({ navigation }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [filter, setFilter] = useState<ActivityFilter>(ALL_ACTIVITY_TRACKS);
  const [filterVisible, setFilterVisible] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", records: await loadActivitySessionRecords() });
    } catch (error) {
      setState({ kind: "unavailable", reason: describeOperationalFailure(error, "Activity is unavailable.") });
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const header = (
    <ScreenHeader
      backAction={{ onPress: () => navigation.goBack() }}
      context={t("Progress")}
      contextTone="primary"
      title={t("Activity")}
      variant="activity"
    />
  );

  if (state.kind === "loading") {
    return <Screen edges={["top", "bottom"]}>{header}<LoadingState title={t("Loading activity")} description={t("Reading your durable session history.")} /></Screen>;
  }
  if (state.kind === "unavailable") {
    return <Screen edges={["top", "bottom"]}>{header}<EmptyState title={t("Activity unavailable")} description={t(state.reason)} /></Screen>;
  }

  const model = buildActivityModel(state.records, filter);
  return (
    <Screen edges={["top", "bottom"]} style={styles.screen}>
      {header}
      <Pressable
        accessibilityLabel={t("Filter activity")}
        accessibilityRole="button"
        onPress={() => setFilterVisible(true)}
        style={({ pressed }) => [styles.filter, pressed ? styles.pressed : null]}
        testID={runtimeSelectors.activity.filter()}
      >
        <Text maxFontSizeMultiplier={2} style={styles.filterText}>{t(filter === ALL_ACTIVITY_TRACKS ? "All tracks" : getTrackLabel(filter))}</Text>
        <Icon color={palette.textSecondary} name="chevron-down" size={18} />
      </Pressable>
      {model.items.length > 0 ? (
        <View style={styles.list} testID={runtimeSelectors.activity.root()}>
          {model.groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text maxFontSizeMultiplier={2} style={styles.groupLabel}>{t(group.label)}</Text>
              <View style={styles.groupCard}>
                {group.items.map((item, index) => (
                  <ActivityRow
                    item={item}
                    key={item.id}
                    last={index === group.items.length - 1}
                    onPress={() => openActivityItem(item, navigation)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty} testID={runtimeSelectors.activity.root()}>
          <EmptyState
            description={t(filter === ALL_ACTIVITY_TRACKS ? "Complete a practice session to see it in Activity." : "No activity for this track yet.")}
            title={t("No activity yet")}
          />
        </View>
      )}
      <SettingsBottomSheet
        closeLabel={t("Close")}
        intro={t("Choose which track appears in Activity.")}
        onClose={() => setFilterVisible(false)}
        title={t("Filter activity")}
        visible={filterVisible}
      >
        <FilterOption
          label={t("All tracks")}
          onPress={() => { setFilter(ALL_ACTIVITY_TRACKS); setFilterVisible(false); }}
          selected={filter === ALL_ACTIVITY_TRACKS}
        />
        {getTrackDisplays().map((track) => (
          <FilterOption
            key={track.id}
            label={t(track.shortTitle)}
            onPress={() => { setFilter(track.id); setFilterVisible(false); }}
            selected={filter === track.id}
          />
        ))}
      </SettingsBottomSheet>
    </Screen>
  );
}

function ActivityRow({ item, last, onPress }: Readonly<{ item: ActivityItem; last: boolean; onPress: () => void }>) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, t } = useAppPreferences();
  return (
    <Pressable
      accessibilityLabel={`${t(item.modeTitle)}, ${t(item.trackTitle)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, last ? styles.rowLast : null, pressed ? styles.pressed : null]}
      testID={runtimeSelectors.activity.row(item.sessionId)}
    >
      <View style={[styles.iconTile, item.status === "ended-early" ? styles.endedIconTile : null]}>
        <Icon color={palette.onPrimary} name={item.icon} size={20} />
      </View>
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={styles.title}>{t(item.modeTitle)}</Text>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={styles.detail}>{t(item.trackTitle)}</Text>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={styles.detail}>{`${item.totalCount} ${t(item.totalCount === 1 ? "item" : "items")} · ${item.duration}`}</Text>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={styles.detail}>{`${t(item.statusLabel)} · ${translateDateLabel(item.dateLabel, t)}`}</Text>
      </View>
      <Icon color={palette.textMuted} name="chevron-right" size={18} />
    </Pressable>
  );
}

function FilterOption({ label, onPress, selected }: Readonly<{ label: string; onPress: () => void; selected: boolean }>) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.filterOption, pressed ? styles.pressed : null]}>
      <Text maxFontSizeMultiplier={2} style={styles.filterOptionText}>{label}</Text>
      {selected ? <Icon color={styles.selectedIcon.color} name="check" size={18} /> : null}
    </Pressable>
  );
}

function openActivityItem(item: ActivityItem, navigation: Props["navigation"]): void {
  if (item.modeId === "coding-interview-simulation") {
    navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { completionKind: "manual", sessionId: item.sessionId });
    return;
  }
  if (item.trackFamily === "coding_interview") {
    navigation.navigate(ROUTES.ALGORITHMS_PRACTICE_SUMMARY, { sessionId: item.sessionId });
    return;
  }
  navigation.navigate(ROUTES.RESULT, { sessionId: item.sessionId });
}

function getTrackLabel(filter: ActivityFilter): string {
  return getTrackDisplays().find((track) => track.id === filter)?.shortTitle ?? "All tracks";
}

function translateDateLabel(label: string, translate: (value: string) => string): string {
  if (label.startsWith("Today,")) return label.replace("Today", translate("Today"));
  if (label.startsWith("Yesterday,")) return label.replace("Yesterday", translate("Yesterday"));
  return label;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  screen: { gap: spacing.md },
  filter: { alignItems: "center", backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 40, paddingHorizontal: 14 },
  filterText: { ...typography.body, color: palette.textSecondary },
  list: { gap: spacing.md, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  group: { gap: spacing.xs },
  groupLabel: { ...typography.caption, color: palette.textSecondary, fontWeight: "600", textTransform: "uppercase" },
  groupCard: { backgroundColor: palette.surface, borderRadius: 14, overflow: "hidden" },
  row: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10, minHeight: 73, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowLast: { borderBottomWidth: 0 },
  iconTile: { alignItems: "center", backgroundColor: palette.primary, borderRadius: radius.md, height: 36, justifyContent: "center", width: 36 },
  endedIconTile: { backgroundColor: palette.warning },
  copy: { flex: 1, gap: 1, minWidth: 0 },
  title: { ...typography.bodyStrong, color: palette.textPrimary },
  detail: { ...typography.caption, color: palette.textSecondary },
  pressed: { opacity: 0.78 },
  empty: { alignItems: "center", flex: 1, justifyContent: "center" },
  filterOption: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 48, paddingHorizontal: spacing.sm },
  filterOptionText: { ...typography.body, color: palette.textPrimary },
  selectedIcon: { color: palette.primary },
});
