import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";

import {
  Button,
  ChoiceRow,
  EmptyState,
  Icon,
  IconButton,
  Screen,
  SkeletonShape,
  SettingsBottomSheet,
  useSkeletonGlassMotion,
} from "../../components";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { learningPlanProposalCoordinator, type LearningPlanProposalResult } from "../../application/learningPlan";
import { loadActiveTrackId, loadGoal, loadLearningPlan, persistGoalPlanStatus } from "../../application/learningReadModels";
import { reconcileDeviceReminder, reminderNeedsAttention } from "../../preferences";
import { ROUTES } from "../../constants/routes";
import {
  createDefaultGoal,
  getTrackGoalTemplates,
  GOAL_DAY_IDS,
  normalizeGoalRecord,
  normalizeGoalForExplicitSave,
  projectGoalTargetDate,
  type GoalDay,
  type GoalRecord,
  type GoalTemplateId,
} from "../../domain";
import { getTrackDisplay, isRegisteredTrackId, type TrackId } from "../../domain";
import type { GoalCadenceReturnTo, RootStackParamList } from "../../navigation";
import { useAppPreferences, useNotificationSettings, useThemedStyles, type AppLocale } from "../../preferences";
import { colorWithOpacity, radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import type { LearningPlanReminderFailure, LearningPlanReminderResult } from "../../application/notificationPreferences";
import { targetDatePickerValue, targetDateToLocalIso } from "./goalTargetDatePicker";
import { GoalTargetDateCalendar } from "./GoalTargetDateCalendar";

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
          <Text accessibilityLabel={context} ellipsizeMode="clip" maxFontSizeMultiplier={2} numberOfLines={2} style={styles.loadingContext}>{context}</Text>
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
  const { t: tLearningPlan } = useTranslation("learningPlan");
  const { t: tNotifications } = useTranslation("notifications");
  const reminderCopy = useMemo(() => ({ body: tNotifications("notificationBody"), title: tNotifications("notificationTitle") }), [tNotifications]);
  const notificationSettings = useNotificationSettings(reminderCopy);
  const [trackId, setTrackId] = useState<TrackId | null>(null);
  const [goal, setGoal] = useState<GoalRecord | null>(null);
  const [acceptedPlan, setAcceptedPlan] = useState(false);
  const [draft, setDraft] = useState<GoalRecord | null>(null);
  const [minutesPerStudyDay, setMinutesPerStudyDay] = useState<number | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reminderErrorKind, setReminderErrorKind] = useState<LearningPlanReminderFailure | null>(null);
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
            setAcceptedPlan(false);
            setDraft(null);
            setLoadError("Choose a track before setting a goal.");
            setLoading(false);
          }
          return;
        }
        const [savedGoal, savedPlan] = await Promise.all([loadGoal(savedTrackId), loadLearningPlan(savedTrackId)]);
        if (active) {
          setTrackId(savedTrackId);
          setGoal(savedGoal);
          setAcceptedPlan(savedPlan?.plan.status === "accepted");
          setDraft(savedGoal ? null : createDefaultGoal(savedTrackId));
          setDateInput(savedGoal?.targetDate ?? "");
          const loadedMinutes = savedPlan?.plan.schemaVersion === 2 ? savedPlan.plan.minutesPerStudyDay : null;
          setMinutesPerStudyDay(loadedMinutes);
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
    setReminderErrorKind(null);
  }

  function applyReminderResult(result: LearningPlanReminderResult): boolean {
    if (!reminderNeedsAttention(result)) {
      setReminderErrorKind(null);
      return false;
    }
    setReminderErrorKind(result.kind);
    const key = result.kind === "goal_paused" ? "goalPausedDetail" : result.kind === "concurrent_change" ? "concurrentChangeDetail" : "schedulerFailureDetail";
    setSaveError(tNotifications(key));
    return true;
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
    const nextGoal = normalizeGoalRecord(normalizeGoalForExplicitSave({
      ...current,
      targetDate: dateInput.length > 0 ? dateInput : undefined,
    }));
    if (nextGoal.preferredDays.length === 0) {
      setSaveError(t("Choose at least one practice day."));
      return;
    }
    if (minutesPerStudyDay === null || !Number.isSafeInteger(minutesPerStudyDay) || minutesPerStudyDay < 1 || minutesPerStudyDay > 1440) {
      setSaveError(t("Choose how much time you can spend on this track each study day."));
      return;
    }
    setSaving(true);
    setSaveError(null);
    setReminderErrorKind(null);
    try {
      await createAndOpenPlan(track.id, nextGoal, minutesPerStudyDay);
    } catch (error) {
      setSaveError(describeOperationalFailure(error, "The goal could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function createAndOpenPlan(selectedTrackId: TrackId, proposedGoal?: GoalRecord, proposedMinutesPerStudyDay?: number | null): Promise<void> {
    const availableMinutes = proposedMinutesPerStudyDay ?? minutesPerStudyDay;
    const goalToPropose = proposedGoal ?? goal;
    if (!goalToPropose) {
      setSaveError(t("Set an active goal before creating a plan."));
      return;
    }
    if (availableMinutes === null || availableMinutes === undefined) {
      setDraft({ ...goalToPropose, preferredDays: [...goalToPropose.preferredDays] });
      setSaveError(t("Choose how much time you can spend on this track each study day."));
      return;
    }
    setCreatingPlan(true);
    setSaveError(null);
    try {
      const result = await learningPlanProposalCoordinator.create(selectedTrackId, { goal: goalToPropose, minutesPerStudyDay: availableMinutes });
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
    setSaving(true);
    setSaveError(null);
    setReminderErrorKind(null);
    try {
      const pair = await persistGoalPlanStatus(goal.trackId);
      setGoal(pair.goal.record);
      try {
        const reminderResult = await reconcileDeviceReminder(reminderCopy);
        applyReminderResult(reminderResult);
        await notificationSettings.refresh();
      } catch {
        setReminderErrorKind("scheduler_failure");
        setSaveError(tNotifications("schedulerFailureDetail"));
        await notificationSettings.refresh();
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
      <Screen
        edges={["top", "bottom"]}
        header={(
          <View style={styles.loadingHeader}>
            <IconButton accessibilityLabel={t("Go back")} icon="chevron-left" onPress={handleBack} />
            <Text accessibilityLabel={context} ellipsizeMode="clip" maxFontSizeMultiplier={2} numberOfLines={2} style={styles.loadingContext}>{context}</Text>
          </View>
        )}
        scroll={false}
      >
        <EmptyState
          description={t(loadError ?? "Goal data is unavailable.")}
          title={t("Goal unavailable")}
        />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoiding}>
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
            {tLearningPlan("Review your learning plan")}
          </Button>
        ) : null}
        footerVariant="sticky"
        style={styles.screenContent}
      >
        <View style={styles.header}>
          <View style={styles.headerContext}>
            <IconButton accessibilityLabel={t("Go back")} icon="chevron-left" onPress={handleBack} />
            <Text accessibilityLabel={context} ellipsizeMode="clip" maxFontSizeMultiplier={2} numberOfLines={2} style={styles.context}>{context}</Text>
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
            locale={locale}
            onChangeDate={setDateInput}
          onSelectGoalType={(goalType) => updateDraft((currentDraft) => ({ ...currentDraft, goalType }))}
            onSelectMinutes={setMinutesPerStudyDay}
            onToggleDay={toggleDay}
            palette={palette}
            selectedDays={current.preferredDays}
            reminderState={{ acceptedPlan, draft: true, matchesTrack: notificationSettings.trackId === trackId, loading: notificationSettings.loading, status: notificationSettings.status }}
            selectedGoalType={current.goalType}
            selectedMinutes={minutesPerStudyDay}
            templates={templates}
            t={t}
            tNotifications={tNotifications}
          />
        ) : (
          <ActiveGoalSummary
            goal={current}
            reminderState={{ acceptedPlan, draft: false, matchesTrack: notificationSettings.trackId === trackId, loading: notificationSettings.loading, status: notificationSettings.status }}
            locale={locale}
            onEdit={() => { setDraft({ ...current, preferredDays: [...current.preferredDays] }); setSaveError(null); }}
            onCreatePlan={() => { void createAndOpenPlan(track.id); }}
            creatingPlan={creatingPlan}
            onTogglePause={() => { void togglePause(); }}
            t={t}
            tNotifications={tNotifications}
          />
        )}
        {saveError ? <Text accessibilityRole="alert" maxFontSizeMultiplier={2} style={styles.error} testID={reminderErrorKind ? runtimeSelectors.notifications.error(reminderErrorKind) : undefined}>{t(saveError)}</Text> : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function CreateGoalForm({ dateInput, locale, onChangeDate, onSelectGoalType, onSelectMinutes, onToggleDay, palette, selectedDays, reminderState, selectedGoalType, selectedMinutes, templates, t, tNotifications }: Readonly<{
  dateInput: string;
  locale: AppLocale;
  onChangeDate: (value: string) => void;
  onSelectGoalType: (value: GoalTemplateId) => void;
  onSelectMinutes: (value: number | null) => void;
  onToggleDay: (value: GoalDay) => void;
  palette: AppColors;
  selectedDays: readonly GoalDay[];
  reminderState: ReminderPresentationState;
  selectedGoalType: GoalTemplateId;
  selectedMinutes: number | null;
  templates: readonly GoalTemplateId[];
  t: (value: string, options?: Record<string, unknown>) => string;
  tNotifications: (value: string) => string;
}>) {
  const styles = useThemedStyles(createStyles);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState(() => targetDatePickerValue(dateInput, new Date()));

  function openDatePicker(): void {
    setPendingDate(targetDatePickerValue(dateInput, new Date()));
    setDatePickerVisible(true);
  }

  function applyTargetDate(): void {
    onChangeDate(targetDateToLocalIso(pendingDate));
    setDatePickerVisible(false);
  }

  function cancelTargetDate(): void {
    setDatePickerVisible(false);
  }

  function clearTargetDate(): void {
    onChangeDate("");
  }

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

      <View style={styles.formSection} testID="goal-track-availability">
        <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Time available for this track")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.sectionSubtitle}>{t("Minutes on each chosen study day. This applies to this track only.")}</Text>
        <View style={styles.minutesChoices}>
          {[15, 30, 45, 60, 90].map((minutes) => {
            const selected = selectedMinutes === minutes;
            return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={minutes} onPress={() => onSelectMinutes(minutes)} style={[styles.minuteChoice, selected ? styles.minuteChoiceSelected : null]}><Text maxFontSizeMultiplier={2} style={[styles.minuteChoiceText, selected ? styles.minuteChoiceTextSelected : null]}>{t("{{count}} min", { count: minutes })}</Text></Pressable>;
          })}
        </View>
        <TextInput
          accessibilityLabel={t("Custom minutes per study day for this track")}
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={(value) => {
            const validValue = /^\d{1,4}$/u.test(value) && Number(value) >= 1 && Number(value) <= 1440 ? Number(value) : null;
            onSelectMinutes(validValue);
          }}
          placeholder={t("Or enter 1–1440 minutes")}
          placeholderTextColor={palette.textSecondary}
          style={styles.minutesInput}
          value={selectedMinutes !== null && ![15, 30, 45, 60, 90].includes(selectedMinutes) ? String(selectedMinutes) : ""}
        />
      </View>

      {selectedGoalType === "learn_at_own_pace" ? (
        <View style={styles.formSection}><Text maxFontSizeMultiplier={2} style={styles.sectionSubtitle}>{t("This goal type does not use a target date.")}</Text></View>
      ) : (
        <View style={styles.formSection}>
          <Text maxFontSizeMultiplier={2} style={styles.sectionTitle}>{t("Target date")}</Text>
          <View style={styles.dateField} testID={runtimeSelectors.goal.dateInput()}>
            {dateInput ? <Text maxFontSizeMultiplier={2} style={styles.targetDateValue}>{formatGoalDate(dateInput, locale)}</Text> : null}
            <Button onPress={openDatePicker} testID="goal-target-date-open" variant={dateInput ? "secondary" : "primary"}>
              {t(dateInput ? "Change target date" : "Add target date")}
            </Button>
            {dateInput ? <Button onPress={clearTargetDate} testID="goal-target-date-clear" variant="ghost">{t("Clear date")}</Button> : null}
          </View>
          <SettingsBottomSheet
            closeLabel={t("Cancel")}
            intro={t("Choose an optional target date.")}
            onClose={cancelTargetDate}
            title={t("Target date")}
            visible={datePickerVisible}
          >
            <GoalTargetDateCalendar
              locale={locale}
              onChange={setPendingDate}
              value={pendingDate}
            />
            <Button onPress={applyTargetDate} testID="goal-target-date-set">{t("Set date")}</Button>
          </SettingsBottomSheet>
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

      <ReminderDraft preferredDays={selectedDays} state={reminderState} t={t} tNotifications={tNotifications} />
    </View>
  );
}

function ActiveGoalSummary({ creatingPlan, goal, locale, onCreatePlan, onEdit, onTogglePause, reminderState, t, tNotifications }: Readonly<{
  creatingPlan: boolean;
  goal: GoalRecord;
  locale: AppLocale;
  onCreatePlan: () => void;
  onEdit: () => void;
  onTogglePause: () => void;
  reminderState: ReminderPresentationState;
  t: (value: string) => string;
  tNotifications: (value: string) => string;
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
        <ReminderDraft preferredDays={goal.preferredDays} state={reminderState} t={t} tNotifications={tNotifications} />
      </View>
      <Button disabled={goal.status === "paused"} loading={creatingPlan} onPress={onCreatePlan} testID={runtimeSelectors.learningPlan.create()}>{t("Create plan")}</Button>
      <Pressable accessibilityRole="button" onPress={onEdit} style={styles.centerAction}><Text maxFontSizeMultiplier={2} style={styles.centerActionLabel}>{t("Edit goal")}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={onTogglePause} style={styles.centerAction}>
        <Text maxFontSizeMultiplier={2} style={styles.centerActionLabel}>{t(goal.status === "paused" ? "Resume goal" : "Pause goal")}</Text>
      </Pressable>
    </View>
  );
}

type ReminderPresentationState = Readonly<{
  acceptedPlan: boolean;
  draft: boolean;
  loading: boolean;
  matchesTrack: boolean;
  status: ReturnType<typeof useNotificationSettings>["status"];
}>;

function ReminderDraft({ preferredDays, state, t, tNotifications }: Readonly<{ preferredDays: readonly GoalDay[]; state: ReminderPresentationState; t: (value: string) => string; tNotifications: (value: string) => string }>) {
  const styles = useThemedStyles(createStyles);
  const days = preferredDays.map((day) => t(DAY_SHORT_LABELS[day])).join(", ");
  const reminderSteps = [
    t("Accept a learning plan first."),
    t("Choose exact reminder times next."),
    t("Then you can turn reminders on."),
  ];
  return (
      <View style={styles.reminderDraft} testID="goal-reminder-draft">
        <Text maxFontSizeMultiplier={2} style={styles.reminderTitle}>{t("Reminder draft")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.reminderDetail}>{days || t("Choose at least one practice day.")}</Text>
        {!state.acceptedPlan ? reminderSteps.map((step, index) => (
          index === 1 ? (
            <View key={step} accessible accessibilityLabel={step.replace(/\n/gu, " ")}>
              <View accessibilityElementsHidden>
                {step.split("\n").map((fragment) => (
                  <Text key={fragment} maxFontSizeMultiplier={2} style={styles.reminderDetail}>{fragment}</Text>
                ))}
              </View>
            </View>
          ) : (
            <Text key={step} maxFontSizeMultiplier={2} style={styles.reminderDetail}>
              {step}
            </Text>
          )
        )) : (
          <>
            <Text maxFontSizeMultiplier={2} style={styles.reminderDetail}>{tNotifications(reminderStatusCopy(state))}</Text>
            {state.draft ? <Text maxFontSizeMultiplier={2} style={styles.reminderDetail}>{tNotifications("draftPlanReminderDetail")}</Text> : null}
          </>
        )}
      </View>
  );
}

function reminderStatusCopy(state: ReminderPresentationState): string {
  if (state.loading) return "loadingDetail";
  if (!state.matchesTrack) return "reminderStatusUnavailableDetail";
  if (state.status === "synced") return "activeReminderDetail";
  if (state.status === "disabled") return "disabledReminderDetail";
  if (state.status === "missing_track") return "missingTrackDetail";
  if (state.status === "missing_goal") return "missingGoalDetail";
  if (state.status === "missing_plan") return "missingPlanDetail";
  if (state.status === "identity_mismatch") return "identityMismatchDetail";
  if (state.status === "goal_paused") return "goalPausedDetail";
  if (state.status === "plan_paused") return "planPausedDetail";
  if (state.status === "plan_completed") return "planCompletedDetail";
  if (state.status === "no_slots") return "noSlotsDetail";
  if (state.status === "timezone_mismatch") return "timezoneMismatchDetail";
  if (state.status === "permission_denied") return "permissionDeniedDetail";
  if (state.status === "scheduler_failure") return "schedulerFailureDetail";
  if (state.status === "concurrent_change") return "concurrentChangeDetail";
  return "reminderStatusUnavailableDetail";
}

function isCreatedProposal(result: LearningPlanProposalResult): result is Extract<LearningPlanProposalResult, { proposal: unknown }> {
  return "proposal" in result;
}

function proposalCreationError(kind: LearningPlanProposalResult["kind"]): string {
  if (kind === "no_goal") return "Set an active goal before creating a plan.";
  if (kind === "goal_paused") return "Resume the goal before creating a plan.";
  if (kind === "budget_required") return "Choose how much time you can spend on this track each study day.";
  if (kind === "package_unavailable") return "This learning package is not available for planning.";
  return "The learning plan could not be prepared. Try again.";
}

function SummaryRow({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.summaryRow}><Text maxFontSizeMultiplier={2} style={styles.summaryLabel}>{label}</Text><Text maxFontSizeMultiplier={2} style={styles.summaryValue}>{value}</Text></View>;
}

function formatGoalDate(value: string, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  keyboardAvoiding: { flex: 1 },
  loadingAction: { backgroundColor: palette.progress.loadingTrack, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, width: "100%" },
  loadingContext: { ...typography.navigationContext, color: palette.textPrimary, flexShrink: 1, minWidth: 0 },
  loadingField: { backgroundColor: palette.surfaceInput, borderRadius: radius.lg, width: "100%" },
  loadingHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 44, minWidth: 0, paddingHorizontal: spacing.xl },
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
  headerContext: { alignItems: "center", flexDirection: "row", gap: spacing.sm, minHeight: 44, minWidth: 0 },
  context: { ...typography.navigationContext, color: palette.textPrimary, flexShrink: 1, minWidth: 0 },
  titleBlock: { gap: spacing.md },
  title: { color: palette.textPrimary, fontSize: 28, fontWeight: "600", lineHeight: 34 },
  trackAccent: { alignSelf: "stretch", backgroundColor: palette.primary, borderRadius: radius.pill, width: 3 },
  trackContext: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  trackLabel: { color: palette.textPrimary, flexShrink: 1, fontSize: 20, fontWeight: "600", lineHeight: 28 },
  statusBadge: { backgroundColor: palette.success, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  pausedBadge: { backgroundColor: palette.warning },
  statusBadgeLabel: { color: palette.onPrimary, fontSize: 11, fontWeight: "700", lineHeight: 14 },
  statusRow: { alignItems: "center", flexDirection: "row" },
  form: { gap: 28 },
  formSection: { gap: spacing.sm },
  minutesChoices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  minuteChoice: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, justifyContent: "center", minHeight: 40, minWidth: 56, paddingHorizontal: spacing.sm },
  minuteChoiceSelected: { backgroundColor: palette.success, borderColor: palette.success },
  minuteChoiceText: { color: palette.textSecondary, fontSize: 13, fontWeight: "600" },
  minuteChoiceTextSelected: { color: palette.onPrimary },
  minutesInput: { ...typography.body, backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, color: palette.textPrimary, minHeight: 48, paddingHorizontal: spacing.md },
  sectionCopy: { flex: 1, gap: spacing.xs },
  sectionTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "700", lineHeight: 18 },
  sectionSubtitle: { ...typography.small, color: palette.primary, lineHeight: 18 },
  choiceGroup: { gap: spacing.md },
  dateField: { alignItems: "flex-start", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  targetDateValue: { ...typography.bodyStrong, color: palette.textPrimary },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dayButton: { alignItems: "center", borderRadius: 10, borderWidth: 1, flexBasis: "20%", flexGrow: 1, justifyContent: "center", minHeight: 44, minWidth: 44, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  dayButtonSelected: { backgroundColor: palette.success, borderColor: palette.success },
  dayButtonUnselected: { backgroundColor: palette.surface, borderColor: palette.border },
  dayLabel: { color: palette.textSecondary, fontSize: 12, fontWeight: "700", textAlign: "center" },
  dayLabelSelected: { color: palette.onPrimary },
  reminderDraft: { alignSelf: "stretch", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md, width: "100%" },
  reminderTitle: { ...typography.bodyStrong, color: palette.textPrimary, flexShrink: 1 },
      reminderDetail: { ...typography.small, color: palette.textSecondary },
  summaryCard: { backgroundColor: palette.surface, borderColor: palette.effects.subtleBorder, borderRadius: 14, borderWidth: 1, gap: 14, padding: spacing.lg },
  summaryRow: { gap: spacing.xs },
  summaryDivider: { backgroundColor: palette.effects.divider, height: StyleSheet.hairlineWidth, width: "100%" },
  summaryLabel: { color: palette.primary, fontSize: 12, fontWeight: "400", lineHeight: 15 },
  summaryValue: { color: palette.textPrimary, fontSize: 14, fontWeight: "500", lineHeight: 18 },
  dayBadges: { flexDirection: "row", gap: 6 },
  dayBadge: { backgroundColor: colorWithOpacity(palette.primary, 0.12), borderRadius: 6, paddingHorizontal: spacing.sm },
  dayBadgeLabel: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 15 },
  centerAction: { alignItems: "center", minHeight: 40, justifyContent: "center" },
  centerActionLabel: { ...typography.small, color: palette.textSecondary, fontWeight: "600" },
  error: { color: palette.danger, fontSize: 13, lineHeight: 18 },
  footerButton: { width: "100%" },
});
