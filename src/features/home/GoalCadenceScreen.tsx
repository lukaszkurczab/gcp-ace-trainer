import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  Button,
  ChoiceRow,
  EmptyState,
  Icon,
  IconButton,
  LoadingState,
  Screen,
} from "../../components";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { loadActiveTrackId, loadGoal, persistGoal } from "../../application/learningReadModels";
import { ROUTES } from "../../constants/routes";
import {
  createDefaultGoal,
  getTrackGoalTemplates,
  GOAL_DAY_IDS,
  isIsoDate,
  type GoalDay,
  type GoalRecord,
  type GoalTemplateId,
} from "../../domain";
import { getTrackDisplay, isRegisteredTrackId, type TrackId } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { effects, colorWithOpacity, radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";

type GoalCadenceScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.GOAL_CADENCE>;

const GOAL_COPY: Readonly<Record<GoalTemplateId, Readonly<{ detail: string; title: string }>>> = {
  prepare_for_an_interview: { detail: "Structured practice for upcoming interviews", title: "Interview preparation" },
  prepare_for_a_certification: { detail: "Structured practice for an upcoming certification", title: "Certification preparation" },
  build_foundations: { detail: "Systematic skill building at your own pace", title: "Build foundations" },
  refresh_and_maintain_skills: { detail: "Regular practice to maintain proficiency", title: "Keep skills fresh" },
  learn_at_own_pace: { detail: "Flexible schedule with no target date", title: "Self-paced" },
};

const DAY_LABELS: Readonly<Record<GoalDay, string>> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DAY_SHORT_LABELS: Readonly<Record<GoalDay, string>> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function GoalCadenceScreen({ navigation, route }: GoalCadenceScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, locale, t } = useAppPreferences();
  const [trackId, setTrackId] = useState<TrackId | null>(null);
  const [goal, setGoal] = useState<GoalRecord | null>(null);
  const [draft, setDraft] = useState<GoalRecord | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const requestedTrackId = route.params?.trackId;
        const savedTrackId = requestedTrackId ?? await loadActiveTrackId();
        if (!savedTrackId || !isRegisteredTrackId(savedTrackId)) {
          if (active) {
            setTrackId(null);
            setGoal(null);
            setDraft(null);
            setLoadError("Choose a track before setting a goal.");
            setLoading(false);
          }
          return;
        }
        const savedGoal = await loadGoal(savedTrackId);
        if (active) {
          setTrackId(savedTrackId);
          setGoal(savedGoal);
          setDraft(savedGoal ? null : createDefaultGoal(savedTrackId));
          setDateInput(savedGoal?.targetDate ?? "");
          setLoading(false);
        }
      } catch (error) {
        if (active) {
          setLoadError(describeOperationalFailure(error, "Goal data is unavailable."));
          setLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [route.params?.trackId]));

  const track = useMemo(() => trackId ? getTrackDisplay(trackId) : null, [trackId]);
  const editing = draft !== null;
  const current = draft ?? goal;
  const templates = track ? getTrackGoalTemplates(track.id) : [];

  function updateDraft(update: (currentDraft: GoalRecord) => GoalRecord): void {
    setDraft((currentDraft) => currentDraft ? update(currentDraft) : currentDraft);
    setSaveError(null);
  }

  function toggleDay(day: GoalDay): void {
    updateDraft((currentDraft) => {
      const selected = currentDraft.preferredDays.includes(day);
      const preferredDays = selected
        ? currentDraft.preferredDays.filter((candidate) => candidate !== day)
        : [...currentDraft.preferredDays, day];
      return { ...currentDraft, preferredDays };
    });
  }

  async function save(): Promise<void> {
    if (!current || !track) return;
    if (dateInput.length > 0 && !isIsoDate(dateInput)) {
      setSaveError(t("Use a valid date in YYYY-MM-DD format."));
      return;
    }
    const nextGoal: GoalRecord = {
      ...current,
      targetDate: dateInput.length > 0 ? dateInput : undefined,
    };
    setSaving(true);
    setSaveError(null);
    try {
      await persistGoal(nextGoal);
      setGoal(nextGoal);
      setDraft(null);
    } catch (error) {
      setSaveError(describeOperationalFailure(error, "The goal could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function togglePause(): Promise<void> {
    if (!goal) return;
    const nextGoal = { ...goal, status: goal.status === "active" ? "paused" as const : "active" as const };
    setSaving(true);
    setSaveError(null);
    try {
      await persistGoal(nextGoal);
      setGoal(nextGoal);
    } catch (error) {
      setSaveError(describeOperationalFailure(error, "The goal status could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Screen edges={["top", "bottom"]} scroll={false}><LoadingState title={t("Loading goal")}/></Screen>;
  if (loadError || !track || !current) {
    return (
      <Screen edges={["top", "bottom"]} scroll={false}>
        <EmptyState
          description={t(loadError ?? "Goal data is unavailable.")}
          title={t("Goal unavailable")}
        />
      </Screen>
    );
  }

  return (
    <Screen
      ambient
      ambientVariant="goal"
      edges={["top", "bottom"]}
      footer={editing ? (
        <Button
          disabled={saving}
          loading={saving}
          onPress={() => { void save(); }}
          style={styles.footerButton}
          testID={runtimeSelectors.goal.save()}
        >
          {t(goal ? "Save changes" : "Save goal")}
        </Button>
      ) : null}
      footerVariant="sticky"
      style={styles.screenContent}
    >
      <View style={styles.header}>
        <View style={styles.headerContext}>
          <IconButton accessibilityLabel={t("Go back")} icon="chevron-left" onPress={() => navigation.goBack()} />
          <Text maxFontSizeMultiplier={2} style={styles.context}>{t("Progress")}</Text>
        </View>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Goal & cadence")}</Text>
          </View>
          <View style={styles.trackContext}>
            <View style={[styles.trackDot, { backgroundColor: track.accentColor }]} />
            <Text maxFontSizeMultiplier={2} style={styles.trackLabel}>{t(track.shortTitle)}</Text>
          </View>
          {editing ? <Text maxFontSizeMultiplier={2} style={styles.description}>{t("Set a learning rhythm for this track.")}</Text> : (
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, goal?.status === "paused" ? styles.pausedBadge : null]}><Text maxFontSizeMultiplier={2} style={styles.statusBadgeLabel}>{t(goal?.status === "paused" ? "Paused" : "Active")}</Text></View>
            </View>
          )}
        </View>
      </View>

      {editing ? (
        <CreateGoalForm
          dateInput={dateInput}
          onChangeDate={setDateInput}
          onSelectGoalType={(goalType) => updateDraft((currentDraft) => ({ ...currentDraft, goalType }))}
          onOpenNotifications={() => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS)}
          onSetWeeklyTarget={(weeklySessionTarget) => updateDraft((currentDraft) => ({ ...currentDraft, weeklySessionTarget }))}
          onToggleDay={toggleDay}
          palette={palette}
          selectedDays={current.preferredDays}
          selectedGoalType={current.goalType}
          templates={templates}
          t={t}
          weeklySessionTarget={current.weeklySessionTarget}
        />
      ) : (
        <ActiveGoalSummary
          goal={current}
          locale={locale}
          onEdit={() => { setDraft({ ...current, preferredDays: [...current.preferredDays] }); setSaveError(null); }}
          onOpenNotifications={() => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS)}
          onTogglePause={() => { void togglePause(); }}
          t={t}
        />
      )}
      {saveError ? <Text maxFontSizeMultiplier={2} style={styles.error}>{t(saveError)}</Text> : null}
    </Screen>
  );
}

function CreateGoalForm({ dateInput, onChangeDate, onOpenNotifications, onSelectGoalType, onSetWeeklyTarget, onToggleDay, palette, selectedDays, selectedGoalType, templates, t, weeklySessionTarget }: Readonly<{
  dateInput: string;
  onChangeDate: (value: string) => void;
  onOpenNotifications: () => void;
  onSelectGoalType: (value: GoalTemplateId) => void;
  onSetWeeklyTarget: (value: number) => void;
  onToggleDay: (value: GoalDay) => void;
  palette: AppColors;
  selectedDays: readonly GoalDay[];
  selectedGoalType: GoalTemplateId;
  templates: readonly GoalTemplateId[];
  t: (value: string) => string;
  weeklySessionTarget: number;
}>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.form} testID={runtimeSelectors.goal.root()}>
      <View style={styles.formSection}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Goal")}</Text>
        <View style={styles.choiceGroup}>
          {templates.map((goalType) => {
            const copy = GOAL_COPY[goalType];
            return (
              <ChoiceRow
                accessibilityLabel={t(copy.title)}
                key={goalType}
                onPress={() => onSelectGoalType(goalType)}
                selected={selectedGoalType === goalType}
                testID={runtimeSelectors.goal.goalType(goalType)}
                title={t(copy.title)}
                detail={t(copy.detail)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Target date")}</Text>
        <View style={styles.dateField}>
          <TextInput
            accessibilityLabel={t("Target date")}
            onChangeText={(value) => onChangeDate(value.slice(0, 10))}
            placeholder={t("YYYY-MM-DD (optional)")}
            placeholderTextColor={palette.textMuted}
            style={styles.dateInput}
            value={dateInput}
          />
          <Icon color={palette.textSecondary} name="chevron-down" size={18} />
        </View>
      </View>

      <View style={styles.formSection} testID={runtimeSelectors.goal.cadence()}>
        <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Weekly cadence")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.sectionSubtitle}>{t("Sessions per week")}</Text>
        <View style={styles.stepper}>
          <Pressable accessibilityLabel={t("Decrease sessions per week")} accessibilityRole="button" disabled={weeklySessionTarget <= 1} onPress={() => onSetWeeklyTarget(Math.max(1, weeklySessionTarget - 1))} style={styles.stepperButton}>
            <Text maxFontSizeMultiplier={2} style={styles.stepperGlyph}>−</Text>
          </Pressable>
          <Text maxFontSizeMultiplier={2} accessibilityLabel={`${t("Sessions per week")}: ${weeklySessionTarget}`} style={styles.stepperValue}>{String(weeklySessionTarget)}</Text>
          <Pressable accessibilityLabel={t("Increase sessions per week")} accessibilityRole="button" disabled={weeklySessionTarget >= 7} onPress={() => onSetWeeklyTarget(Math.min(7, weeklySessionTarget + 1))} style={styles.stepperButton}>
            <Text maxFontSizeMultiplier={2} style={styles.stepperGlyph}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionCopy}>
          <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Preferred days")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.sectionSubtitle}>{t("Optional — select when you prefer to practice")}</Text>
        </View>
        <View style={styles.daysRow}>
          {GOAL_DAY_IDS.map((day) => {
            const selected = selectedDays.includes(day);
            return (
              <Pressable
                accessibilityLabel={t(DAY_LABELS[day])}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={day}
                onPress={() => onToggleDay(day)}
                style={[styles.dayButton, selected ? styles.dayButtonSelected : styles.dayButtonUnselected]}
                testID={runtimeSelectors.goal.day(day)}
              >
                <Text maxFontSizeMultiplier={2} style={[styles.dayLabel, selected ? styles.dayLabelSelected : null]}>{DAY_SHORT_LABELS[day]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenNotifications} style={styles.reminderRow}>
        <View style={styles.reminderCopy}>
          <Text maxFontSizeMultiplier={2} style={styles.reminderTitle}>{t("Reminders")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.reminderDetail}>{t("Managed in notification settings")}</Text>
        </View>
        <Icon color={palette.textSecondary} name="chevron-right" size={18} />
      </Pressable>
    </View>
  );
}

function ActiveGoalSummary({ goal, locale, onEdit, onOpenNotifications, onTogglePause, t }: Readonly<{
  goal: GoalRecord;
  locale: "en" | "pl";
  onEdit: () => void;
  onOpenNotifications: () => void;
  onTogglePause: () => void;
  t: (value: string) => string;
}>) {
  const styles = useThemedStyles(createStyles);
  const copy = GOAL_COPY[goal.goalType];
  return (
    <View style={styles.form} testID={runtimeSelectors.goal.root()}>
      <View style={styles.summaryCard}>
        <SummaryRow label={t("Goal")} value={t(copy.title)} />
        <View style={styles.summaryDivider} />
        <SummaryRow label={t("Target date")} value={goal.targetDate ? formatGoalDate(goal.targetDate, locale) : t("No target date")} />
        <View style={styles.summaryDivider} />
        <SummaryRow label={t("Sessions/week")} value={String(goal.weeklySessionTarget)} />
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text maxFontSizeMultiplier={2} style={styles.summaryLabel}>{t("Preferred days")}</Text>
          {goal.preferredDays.length ? (
            <View style={styles.dayBadges}>
              {goal.preferredDays.map((day) => (
                <View key={day} style={styles.dayBadge}>
                  <Text maxFontSizeMultiplier={2} style={styles.dayBadgeLabel}>{DAY_SHORT_LABELS[day]}</Text>
                </View>
              ))}
            </View>
          ) : <Text maxFontSizeMultiplier={2} style={styles.summaryValue}>{t("No preferred days")}</Text>}
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryReminderRow}>
          <Text maxFontSizeMultiplier={2} style={[styles.summaryLabel, styles.summaryReminderLabel]}>{t("Reminders")}</Text>
          <Pressable accessibilityRole="button" onPress={onOpenNotifications}><Text maxFontSizeMultiplier={2} style={styles.summaryLink}>{t("Notification settings")}</Text></Pressable>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onEdit} style={styles.centerAction}><Text maxFontSizeMultiplier={2} style={styles.centerActionLabel}>{t("Edit goal")}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onTogglePause} style={styles.centerAction}>
        <Text maxFontSizeMultiplier={2} style={styles.centerActionLabel}>{t(goal.status === "paused" ? "Resume goal" : "Pause goal")}</Text>
      </Pressable>
    </View>
  );
}

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.summaryRow}><Text maxFontSizeMultiplier={2} style={styles.summaryLabel}>{label}</Text><Text maxFontSizeMultiplier={2} style={styles.summaryValue}>{value}</Text></View>;
}

function formatGoalDate(value: string, locale: "en" | "pl"): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short", timeZone: "UTC", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  screenContent: { gap: spacing.xxl, paddingBottom: spacing.xxl, paddingTop: 28 },
  header: { gap: spacing.sm },
  headerContext: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 44 },
  context: { ...typography.small, color: palette.textSecondary, fontWeight: "500" },
  titleBlock: { gap: spacing.sm },
  titleRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  title: { color: palette.textPrimary, fontSize: 22, fontWeight: "700", lineHeight: 27 },
  trackContext: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  trackDot: { borderRadius: radius.pill, height: 8, width: 8 },
  trackLabel: { ...typography.small, color: palette.textSecondary, fontWeight: "500" },
  description: { ...typography.small, color: palette.primary, lineHeight: 19 },
  statusBadge: { backgroundColor: palette.success, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  pausedBadge: { backgroundColor: palette.warning },
  statusBadgeLabel: { color: palette.primary, fontSize: 11, fontWeight: "700", lineHeight: 14 },
  statusRow: { alignItems: "center", flexDirection: "row" },
  form: { gap: 28 },
  formSection: { gap: spacing.sm },
  sectionCopy: { flex: 1, gap: spacing.xs },
  sectionTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "700", lineHeight: 18 },
  sectionSubtitle: { ...typography.small, color: palette.primary, lineHeight: 18 },
  choiceGroup: { gap: spacing.md },
  dateField: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", minHeight: 48, paddingHorizontal: 14 },
  dateInput: { ...typography.body, color: palette.textPrimary, flex: 1, paddingVertical: 0 },
  stepper: { alignItems: "center", flexDirection: "row", justifyContent: "center" },
  stepperButton: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  stepperGlyph: { color: palette.textPrimary, fontSize: 22, lineHeight: 24 },
  stepperValue: { color: palette.textPrimary, fontSize: 24, fontWeight: "700", lineHeight: 29, textAlign: "center", width: 80 },
  daysRow: { flexDirection: "row", gap: 6, justifyContent: "space-between" },
  dayButton: { alignItems: "center", borderRadius: 10, borderWidth: 1, height: 36, justifyContent: "center", width: 44 },
  dayButtonSelected: { backgroundColor: palette.success, borderColor: palette.success },
  dayButtonUnselected: { backgroundColor: palette.surface, borderColor: palette.border },
  dayLabel: { color: palette.textSecondary, fontSize: 12, fontWeight: "700", lineHeight: 15 },
  dayLabelSelected: { color: palette.primary },
  reminderRow: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: spacing.md },
  reminderCopy: { flex: 1, gap: spacing.xs },
  reminderTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  reminderDetail: { ...typography.small, color: palette.textSecondary },
  summaryCard: { backgroundColor: palette.surface, borderColor: effects.subtleBorder, borderRadius: 14, borderWidth: 1, gap: 14, padding: spacing.lg },
  summaryRow: { gap: spacing.xs },
  summaryDivider: { backgroundColor: effects.divider, height: StyleSheet.hairlineWidth, width: "100%" },
  summaryLabel: { color: palette.primary, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  summaryValue: { color: palette.textPrimary, fontSize: 14, fontWeight: "500", lineHeight: 18 },
  dayBadges: { flexDirection: "row", gap: 6 },
  dayBadge: { backgroundColor: colorWithOpacity(palette.primary, 0.12), borderRadius: 6, paddingHorizontal: spacing.sm },
  dayBadgeLabel: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  summaryReminderRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  summaryReminderLabel: { flex: 1 },
  summaryLink: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  centerAction: { alignItems: "center", minHeight: 40, justifyContent: "center" },
  centerActionLabel: { ...typography.small, color: palette.textSecondary, fontWeight: "600" },
  error: { color: palette.danger, fontSize: 13, lineHeight: 18 },
  footerButton: { width: "100%" },
});
