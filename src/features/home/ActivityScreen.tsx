import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { loadActivitySessionRecords, type ActivitySessionRecord } from "../../application/activityReadModels";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { Button, EmptyState, Icon, LoadingState, Screen, ScreenHeader, SettingsBottomSheet } from "../../components";
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
      <View style={styles.filter}>
        <Pressable
          accessibilityLabel={t("Filter activity")}
          accessibilityRole="button"
          onPress={() => setFilterVisible(true)}
          style={({ pressed }) => [styles.filterTrigger, pressed ? styles.pressed : null]}
          testID={runtimeSelectors.activity.filter()}
        >
          <Text maxFontSizeMultiplier={2} style={[styles.filterText, filter !== ALL_ACTIVITY_TRACKS ? styles.filterSelectedText : null]}>{t(filter === ALL_ACTIVITY_TRACKS ? "All tracks" : getTrackLabel(filter))}</Text>
        </Pressable>
        {filter !== ALL_ACTIVITY_TRACKS ? (
          <Pressable
            accessibilityLabel={t("Clear activity filter")}
            accessibilityRole="button"
            onPress={() => setFilter(ALL_ACTIVITY_TRACKS)}
            style={({ pressed }) => [styles.filterAction, pressed ? styles.pressed : null]}
            testID={runtimeSelectors.activity.filterClear()}
          >
            <Icon color={palette.textPrimary} name="close" size={18} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={t("Open activity filter")}
          accessibilityRole="button"
          onPress={() => setFilterVisible(true)}
          style={({ pressed }) => [styles.filterAction, pressed ? styles.pressed : null]}
        >
          <Icon color={palette.textPrimary} name="chevron-down" size={18} />
        </Pressable>
      </View>
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
          <ActivityEmptyState
            filtered={filter !== ALL_ACTIVITY_TRACKS}
            onOpenPractice={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
            onShowAll={() => setFilter(ALL_ACTIVITY_TRACKS)}
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

function ActivityEmptyState({ filtered, onOpenPractice, onShowAll }: Readonly<{ filtered: boolean; onOpenPractice: () => void; onShowAll: () => void }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useAppPreferences();
  return (
    <View style={styles.emptyActivityState}>
      <View style={styles.emptyActivityIcon}>
        <View style={styles.emptyActivityBarTall} />
        <View style={styles.emptyActivityBarShort} />
      </View>
      <Text maxFontSizeMultiplier={2} style={styles.emptyActivityTitle}>{t(filtered ? "No activity for this track" : "No activity yet")}</Text>
      <Text maxFontSizeMultiplier={2} style={styles.emptyActivityDescription}>{t(filtered ? "Your Activity may still contain sessions from other tracks." : "Completed sessions and reviews will appear here.")}</Text>
      {filtered ? (
        <>
          <Button onPress={onShowAll} style={styles.emptyActivityPrimary}>{t("Show all activity")}</Button>
          <Button labelStyle={styles.emptyActivitySecondaryLabel} onPress={onOpenPractice} variant="ghost">{t("Open Practice")}</Button>
        </>
      ) : (
        <Button onPress={onOpenPractice} style={styles.emptyActivityPrimary}>{t("Open Practice")}</Button>
      )}
    </View>
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
      <View style={[styles.iconTile, item.status === "ended-early" ? styles.endedIconTile : item.status === "time-expired" ? styles.expiredIconTile : null]}>
        <Icon color={palette.onPrimary} name={item.icon} size={20} />
      </View>
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={styles.title}>{t(item.modeTitle)}</Text>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={styles.detail}>{[t(item.trackTitle), item.scopeLabel].filter(Boolean).join(" · ")}</Text>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={styles.detail}>{`${activityCountLabel(item, t)} · ${item.duration}`}</Text>
        <Text maxFontSizeMultiplier={2} numberOfLines={1} style={[styles.detail, item.status === "completed" ? null : styles.statusDetail]}>{`${t(item.statusLabel)} · ${translateDateLabel(item.dateLabel, t)}`}</Text>
      </View>
      <Icon color={palette.textMuted} name="chevron-right" size={18} />
    </Pressable>
  );
}

function activityCountLabel(item: ActivityItem, translate: (value: string) => string): string {
  if (item.answerCount === item.totalCount) return `${item.totalCount} ${translate(item.totalCount === 1 ? "item" : "items")}`;
  if (item.status === "ended-early") return `${item.answerCount} ${translate("of")} ${item.totalCount} ${translate("answered")}`;
  return `${item.answerCount} ${translate("answered")} · ${Math.max(0, item.totalCount - item.answerCount)} ${translate("unanswered")}`;
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
    navigation.navigate(ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { sessionId: item.sessionId });
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
  screen: { gap: spacing.sm },
  filter: { alignItems: "center", backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.sm, minHeight: 40, paddingHorizontal: 14 },
  filterTrigger: { flex: 1, minWidth: 0 },
  filterAction: { alignItems: "center", height: 18, justifyContent: "center", width: 18 },
  filterText: { ...typography.bodyStrong, color: palette.textSecondary },
  filterSelectedText: { color: palette.textPrimary },
  list: { gap: spacing.md, paddingBottom: spacing.lg, paddingTop: spacing.xs },
  group: { gap: spacing.xs },
  groupLabel: { color: palette.textSecondary, fontSize: 12, fontWeight: "600", lineHeight: 15 },
  groupCard: { backgroundColor: palette.surface, borderRadius: 14, overflow: "hidden" },
  row: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: 1, flexDirection: "row", gap: 10, minHeight: 73, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowLast: { borderBottomWidth: 0 },
  iconTile: { alignItems: "center", backgroundColor: palette.primary, borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  endedIconTile: { backgroundColor: palette.danger },
  expiredIconTile: { backgroundColor: palette.warning },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  title: { ...typography.bodyStrong, color: palette.textPrimary },
  detail: { color: palette.textSecondary, fontSize: 11, fontWeight: "400", lineHeight: 15.4 },
  statusDetail: { color: palette.warning },
  pressed: { opacity: 0.78 },
  empty: { alignItems: "center", flex: 1, justifyContent: "center", paddingBottom: 80 },
  emptyActivityState: { alignItems: "center", gap: 16, paddingHorizontal: spacing.xl, width: "100%" },
  emptyActivityIcon: { alignItems: "center", backgroundColor: palette.surface, borderRadius: 24, flexDirection: "row", gap: 2, height: 48, justifyContent: "center", width: 48 },
  emptyActivityBarTall: { backgroundColor: palette.success, borderRadius: 2, height: 14, width: 3 },
  emptyActivityBarShort: { backgroundColor: palette.success, borderRadius: 2, height: 8, width: 3 },
  emptyActivityTitle: { color: palette.textPrimary, fontSize: 17, fontWeight: "600", lineHeight: 21, textAlign: "center" },
  emptyActivityDescription: { color: palette.textSecondary, fontSize: 14, lineHeight: 20, maxWidth: 353, textAlign: "center" },
  emptyActivityPrimary: { minWidth: 151 },
  emptyActivitySecondaryLabel: { color: palette.primary, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  filterOption: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 48, paddingHorizontal: spacing.sm },
  filterOptionText: { ...typography.body, color: palette.textPrimary },
  selectedIcon: { color: palette.primary },
});
