import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import {
  Button,
  ChoiceRow,
  EmptyState,
  Icon,
  IconButton,
  Screen,
  SkeletonShape,
  useSkeletonGlassMotion,
} from "../../components";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { learningPlanProposalCoordinator, type LearningPlanProposalResult } from "../../application/learningPlan";
import { loadActiveTrackId, loadGoal, persistGoal } from "../../application/learningReadModels";
import { reconcileDeviceReminder } from "../../preferences";
import { ROUTES } from "../../constants/routes";
import {
  createDefaultGoal,
  getTrackGoalTemplates,
  GOAL_DAY_IDS,
  isIsoDate,
  normalizeGoalRecord,
  normalizeGoalForExplicitSave,
  projectGoalTargetDate,
  type GoalDay,
  type GoalRecord,
  type GoalTemplateId,
} from "../../domain";
import { getTrackDisplay, isRegisteredTrackId, type TrackId } from "../../domain";
import type { GoalCadenceReturnTo, RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { colorWithOpacity, radius, spacing, typography, type AppColors } from "../../theme";
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

export function GoalLoadingSkeleton({ context, onBack }: Readonly<{ context: string; onBack: () => void }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const largeLayout = fontScale >= 1.8;
  const motion = useSkeletonGlassMotion();

  return (
    <Screen
      ambient
      ambientVariant="goal"
      edges={["top", "bottom"]}
      header={(
        <View style={styles.loadingHeader}>
          <IconButton accessibilityLabel={t("Go back")} icon="chevron-left" onPress={onBack} />
          <Text maxFontSizeMultiplier={2} style={styles.loadingContext}>{context}</Text>
        </View>
      )}
      style={styles.loadingScreen}
    >
      <View
        accessibilityLabel={t("Loading goal")}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessible
        style={styles.loadingRoot}
        testID="goal-loading-skeleton"
      >
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.loadingShapes}>
          <View style={styles.loadingTitleBlock}>
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingTitle, { height: 27 * textScale }]} />
            <View style={styles.loadingTrackContext}>
              <View style={styles.loadingTrackAccent} />
              <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingTrack, { height: 20 * textScale }]} />
            </View>
          </View>
          <View style={[styles.loadingPanel, largeLayout ? styles.loadingPanelLarge : null]}>
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingSectionTitle, { height: 17 * textScale }]} />
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.loadingRow}>
                <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingRowTitle, { height: 16 * textScale }]} />
                <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingRowDetail, { height: 13 * textScale }]} />
              </View>
            ))}
          </View>
          <View style={styles.loadingPanel}>
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingSectionTitleShort, { height: 17 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingField, { height: 48 * textScale }]} />
            <SkeletonShape motion={motion} style={[styles.loadingLine, styles.loadingField, { height: 48 * textScale }]} />
          </View>
          <SkeletonShape motion={motion} style={[styles.loadingAction, { minHeight: 48 * textScale }]} />
        </View>
      </View>
    </Screen>
  );
}

export function GoalCadenceScreen({ navigation, route }: GoalCadenceScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette, locale } = useAppPreferences();
  const { t } = useTranslation("common");
  const { t: tNotifications } = useTranslation("notifications");
  const reminderCopy = useMemo(() => ({ body: tNotifications("notificationBody"), title: tNotifications("notificationTitle") }), [tNotifications]);
  const [trackId, setTrackId] = useState<TrackId | null>(null);
  const [goal, setGoal] = useState<GoalRecord | null>(null);
  const [draft, setDraft] = useState<GoalRecord | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const returnTo: GoalCadenceReturnTo = route.params?.returnTo ?? "progress";
  const context = t(returnTo === "settings" ? "Settings" : returnTo === "home" ? "Home" : "Progress");

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate(ROUTES.HOME, { initialTab: returnTo });
  }, [navigation, returnTo]);

  useEffect(() => {
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
  }, [route.params?.trackId]);

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
      return { ...currentDraft, preferredDays, weeklySessionTarget: preferredDays.length };
    });
  }

  async function save(): Promise<void> {
    if (!current || !track) return;
    if (dateInput.length > 0 && !isIsoDate(dateInput)) {
      setSaveError(t("Use a valid date in YYYY-MM-DD format."));
      return;
    }
    const nextGoal = normalizeGoalRecord(normalizeGoalForExplicitSave({
      ...current,
      targetDate: dateInput.length > 0 ? dateInput : undefined,
    }));
    if (nextGoal.preferredDays.length === 0) {
      setSaveError(t("Choose at least one practice day."));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await persistGoal(nextGoal);
      setGoal(nextGoal);
      setDraft(null);
      try {
        await reconcileDeviceReminder(reminderCopy);
      } catch {
        setSaveError(t("Goal saved, but reminders could not be updated. Try again from Reminders."));
        return;
      }
      await createAndOpenPlan(track.id);
    } catch (error) {
      setSaveError(describeOperationalFailure(error, "The goal could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function createAndOpenPlan(selectedTrackId: TrackId): Promise<void> {
    setCreatingPlan(true);
    setSaveError(null);
    try {
      const result = await learningPlanProposalCoordinator.create(selectedTrackId);
      if (isCreatedProposal(result)) {
        navigation.navigate(ROUTES.LEARNING_PLAN_PROPOSAL, { proposalId: result.proposal.proposalId, trackId: selectedTrackId });
        return;
      }
      setSaveError(proposalCreationError(result.kind));
    } finally {
      setCreatingPlan(false);
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
      try {
        await reconcileDeviceReminder(reminderCopy);
      } catch {
        setSaveError(t("Goal saved, but reminders could not be updated. Try again from Reminders."));
      }
    } catch (error) {
      setSaveError(describeOperationalFailure(error, "The goal status could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GoalLoadingSkeleton context={context} onBack={handleBack} />;
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
          <IconButton accessibilityLabel={t("Go back")} icon="chevron-left" onPress={handleBack} />
          <Text maxFontSizeMultiplier={2} style={styles.context}>{context}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Set learning rhythm for this track")}</Text>
          <View style={styles.trackContext}>
            <View style={styles.trackAccent} />
            <Text maxFontSizeMultiplier={2} style={styles.trackLabel}>{t(track.shortTitle)}</Text>
          </View>
          {editing ? null : (
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
          onOpenNotifications={() => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS, { source: "goal", trackId: track.id, returnToGoal: returnTo })}
          onToggleDay={toggleDay}
          palette={palette}
          selectedDays={current.preferredDays}
          selectedGoalType={current.goalType}
          templates={templates}
          t={t}
        />
      ) : (
        <ActiveGoalSummary
          goal={current}
          locale={locale}
          onEdit={() => { setDraft({ ...current, preferredDays: [...current.preferredDays] }); setSaveError(null); }}
          onCreatePlan={() => { void createAndOpenPlan(track.id); }}
          creatingPlan={creatingPlan}
          onOpenNotifications={() => navigation.navigate(ROUTES.NOTIFICATION_SETTINGS, { source: "goal", trackId: track.id, returnToGoal: returnTo })}
          onTogglePause={() => { void togglePause(); }}
          t={t}
        />
      )}
      {saveError ? <Text maxFontSizeMultiplier={2} style={styles.error}>{t(saveError)}</Text> : null}
    </Screen>
  );
}

function CreateGoalForm({ dateInput, onChangeDate, onOpenNotifications, onSelectGoalType, onToggleDay, palette, selectedDays, selectedGoalType, templates, t }: Readonly<{
  dateInput: string;
  onChangeDate: (value: string) => void;
  onOpenNotifications: () => void;
  onSelectGoalType: (value: GoalTemplateId) => void;
  onToggleDay: (value: GoalDay) => void;
  palette: AppColors;
  selectedDays: readonly GoalDay[];
  selectedGoalType: GoalTemplateId;
  templates: readonly GoalTemplateId[];
  t: (value: string) => string;
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

      {selectedGoalType === "learn_at_own_pace" ? (
        <View style={styles.formSection}><Text maxFontSizeMultiplier={2} style={styles.sectionSubtitle}>{t("This goal type does not use a target date.")}</Text></View>
      ) : (
        <View style={styles.formSection}>
          <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Target date")}</Text>
          <View style={styles.dateField}>
            <TextInput accessibilityLabel={t("Target date")} onChangeText={(value) => onChangeDate(value.slice(0, 10))} placeholder={t("YYYY-MM-DD (optional)")} placeholderTextColor={palette.textMuted} style={styles.dateInput} value={dateInput} />
            <Icon color={palette.textSecondary} name="chevron-down" size={18} />
          </View>
        </View>
      )}

      <View style={styles.formSection}>
        <View style={styles.sectionCopy}>
          <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Preferred days")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.sectionSubtitle}>{t("Choose at least one practice day.")}</Text>
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
                <Text maxFontSizeMultiplier={2} style={[styles.dayLabel, selected ? styles.dayLabelSelected : null]}>{t(DAY_SHORT_LABELS[day])}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenNotifications} style={styles.reminderRow}>
        <View style={styles.reminderCopy}>
          <Text maxFontSizeMultiplier={2} style={styles.reminderTitle}>{t("Reminders")}</Text>
          <Text maxFontSizeMultiplier={2} style={styles.reminderDetail}>{t("Configure your practice reminders.")}</Text>
        </View>
        <Icon color={palette.textSecondary} name="chevron-right" size={18} />
      </Pressable>
    </View>
  );
}

function ActiveGoalSummary({ creatingPlan, goal, locale, onCreatePlan, onEdit, onOpenNotifications, onTogglePause, t }: Readonly<{
  creatingPlan: boolean;
  goal: GoalRecord;
  locale: "en" | "pl";
  onCreatePlan: () => void;
  onEdit: () => void;
  onOpenNotifications: () => void;
  onTogglePause: () => void;
  t: (value: string) => string;
}>) {
  const styles = useThemedStyles(createStyles);
  const copy = GOAL_COPY[goal.goalType];
  const target = projectGoalTargetDate(goal);
  const targetLabel = target.meaning === "event" ? t("Event date") : target.meaning === "deadline" ? t("Target date") : target.meaning === "checkpoint" ? t("Checkpoint") : t("Target date");
  const targetValue = target.availability === "ignored_legacy" || target.availability === "not_applicable" ? t("Not applicable for this goal") : target.targetDate ? formatGoalDate(target.targetDate, locale) : t("No target date");
  return (
    <View style={styles.form} testID={runtimeSelectors.goal.root()}>
      <View style={styles.summaryCard}>
        <SummaryRow label={t("Goal")} value={t(copy.title)} />
        <View style={styles.summaryDivider} />
        <SummaryRow label={targetLabel} value={targetValue} />
        <View style={styles.summaryDivider} />
        <SummaryRow label={t("Sessions/week")} value={String(goal.weeklySessionTarget)} />
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text maxFontSizeMultiplier={2} style={styles.summaryLabel}>{t("Preferred days")}</Text>
          {goal.preferredDays.length ? (
            <View style={styles.dayBadges}>
              {goal.preferredDays.map((day) => (
                <View key={day} style={styles.dayBadge}>
                  <Text maxFontSizeMultiplier={2} style={styles.dayBadgeLabel}>{t(DAY_SHORT_LABELS[day])}</Text>
                </View>
              ))}
            </View>
          ) : <Text maxFontSizeMultiplier={2} style={styles.summaryValue}>{t("Choose at least one practice day.")}</Text>}
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryReminderRow}>
          <Text maxFontSizeMultiplier={2} style={[styles.summaryLabel, styles.summaryReminderLabel]}>{t("Reminders")}</Text>
          <Pressable accessibilityRole="button" onPress={onOpenNotifications} testID="goal-summary-reminders"><Text maxFontSizeMultiplier={2} style={styles.summaryLink}>{t("Reminders")}</Text></Pressable>
        </View>
      </View>
      <Button disabled={goal.status === "paused"} loading={creatingPlan} onPress={onCreatePlan} testID={runtimeSelectors.learningPlan.create()}>{t("Create plan")}</Button>
      <Pressable accessibilityRole="button" onPress={onEdit} style={styles.centerAction}><Text maxFontSizeMultiplier={2} style={styles.centerActionLabel}>{t("Edit goal")}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onTogglePause} style={styles.centerAction}>
        <Text maxFontSizeMultiplier={2} style={styles.centerActionLabel}>{t(goal.status === "paused" ? "Resume goal" : "Pause goal")}</Text>
      </Pressable>
    </View>
  );
}

function isCreatedProposal(result: LearningPlanProposalResult): result is Extract<LearningPlanProposalResult, { proposal: unknown }> {
  return "proposal" in result;
}

function proposalCreationError(kind: LearningPlanProposalResult["kind"]): string {
  if (kind === "no_goal") return "Set an active goal before creating a plan.";
  if (kind === "goal_paused") return "Resume the goal before creating a plan.";
  if (kind === "package_unavailable") return "This learning package is not available for planning.";
  return "The learning plan could not be prepared. Try again.";
}

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.summaryRow}><Text maxFontSizeMultiplier={2} style={styles.summaryLabel}>{label}</Text><Text maxFontSizeMultiplier={2} style={styles.summaryValue}>{value}</Text></View>;
}

function formatGoalDate(value: string, locale: "en" | "pl"): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", { day: "numeric", month: "short", timeZone: "UTC", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  loadingAction: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, width: "100%" },
  loadingContext: { ...typography.small, color: palette.textSecondary, fontWeight: "500" },
  loadingField: { backgroundColor: palette.surfaceInput, borderRadius: radius.lg, width: "100%" },
  loadingHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.xl },
  loadingLine: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1 },
  loadingPanel: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  loadingPanelLarge: { gap: spacing.lg },
  loadingRoot: { gap: spacing.xxl },
  loadingRow: { gap: spacing.xs },
  loadingRowDetail: { width: "64%" },
  loadingRowTitle: { width: "82%" },
  loadingScreen: { gap: spacing.xxl, paddingBottom: spacing.xxl, paddingTop: 28 },
  loadingSectionTitle: { width: "34%" },
  loadingSectionTitleShort: { width: "27%" },
  loadingShapes: { gap: spacing.xl },
  loadingTitle: { width: "66%" },
  loadingTitleBlock: { gap: spacing.sm },
  loadingTrack: { width: "52%" },
  loadingTrackAccent: { alignSelf: "stretch", backgroundColor: palette.primary, borderRadius: radius.pill, width: 3 },
  loadingTrackContext: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  screenContent: { gap: spacing.xxl, paddingBottom: spacing.xxl, paddingTop: 28 },
  header: { gap: spacing.sm },
  headerContext: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 44 },
  context: { ...typography.small, color: palette.textSecondary, fontWeight: "500" },
  titleBlock: { gap: spacing.md },
  title: { color: palette.textPrimary, fontSize: 28, fontWeight: "600", lineHeight: 34 },
  trackAccent: { alignSelf: "stretch", backgroundColor: palette.primary, borderRadius: radius.pill, width: 3 },
  trackContext: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  trackLabel: { color: palette.textPrimary, flexShrink: 1, fontSize: 20, fontWeight: "600", lineHeight: 28 },
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
  summaryCard: { backgroundColor: palette.surface, borderColor: palette.effects.subtleBorder, borderRadius: 14, borderWidth: 1, gap: 14, padding: spacing.lg },
  summaryRow: { gap: spacing.xs },
  summaryDivider: { backgroundColor: palette.effects.divider, height: StyleSheet.hairlineWidth, width: "100%" },
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
