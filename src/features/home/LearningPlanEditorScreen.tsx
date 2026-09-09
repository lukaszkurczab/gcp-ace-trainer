import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  learningPlanEditorCoordinator,
  type LearningPlanEditorValidationCode,
  type LearningPlanEditorMutationResult,
  type LearningPlanEditorSession,
} from "../../application/learningPlan";
import { commitPlanWithReminders, retryPlanReminders } from "../../application/learningPlan/learningPlanMutationRuntime";
import { AppShellHeader, Button, Card, EmptyState, InfoBlock, Screen } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { GoalDay, LearningPlan } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { radius, spacing, typography, type AppColors } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.LEARNING_PLAN_EDITOR>;
type EditorErrorSource = "commit" | "start-existing" | "mutation";
type EditorState = { kind: "loading" } | { kind: "ready"; session: LearningPlanEditorSession } | { kind: "stale" } | { kind: "error"; source: EditorErrorSource; errorKind: "validation" | "storage"; message: string };

const DAYS: readonly GoalDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_KEYS: Readonly<Record<GoalDay, string>> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

export function LearningPlanEditorScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("learningPlan");
  const { editorId, trackId } = route.params;
  const [state, setState] = useState<EditorState>({ kind: "loading" });
  const [savedPlan, setSavedPlan] = useState<LearningPlan | null>(null);
  const [savedReminderPending, setSavedReminderPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draftTimes, setDraftTimes] = useState<Partial<Record<GoalDay, string>>>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const notification = useMemo(() => ({ body: t("notificationBody", { ns: "notifications" }), title: t("notificationTitle", { ns: "notifications" }) }), [t]);

  useEffect(() => {
    const session = learningPlanEditorCoordinator.getSession(editorId, trackId);
    setState(session ? { kind: "ready", session } : { kind: "stale" });
  }, [editorId, trackId]);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.HOME);
  };

  function showMutation(result: LearningPlanEditorMutationResult): void {
    if (result.kind === "updated") { setInlineError(null); setState({ kind: "ready", session: result.session }); }
    else if (result.kind === "stale") { setSavedPlan(null); setSavedReminderPending(false); setState({ kind: "stale" }); }
    else if (result.kind === "validation_error") setInlineError(t(validationCopyKey(result.code)));
    else { setSavedPlan(null); setSavedReminderPending(false); setState({ kind: "error", source: "mutation", errorKind: "storage", message: t("The schedule could not be updated. Try again.") }); }
  }

  function toggleDay(day: GoalDay): void {
    if (state.kind !== "ready") return;
    const selected = state.session.slots.some((slot) => slot.day === day);
    const days = selected ? state.session.slots.filter((slot) => slot.day !== day).map((slot) => slot.day) : [...state.session.slots.map((slot) => slot.day), day];
    showMutation(learningPlanEditorCoordinator.updateDays(editorId, trackId, days));
  }

  function updateTime(day: GoalDay, value: string): void {
    setDraftTimes((previous) => ({ ...previous, [day]: value }));
    showMutation(learningPlanEditorCoordinator.updateSlotTime(editorId, trackId, day, value));
  }

  async function commit(): Promise<void> {
    if (state.kind === "ready") {
      for (const slot of state.session.slots) {
        const draft = draftTimes[slot.day];
        if (draft !== undefined && draft !== slot.localTime) {
          const result = learningPlanEditorCoordinator.updateSlotTime(editorId, trackId, slot.day, draft);
          if (result.kind !== "updated") { showMutation(result); return; }
        }
      }
    }
    setBusy(true);
    const result = await commitPlanWithReminders(editorId, trackId, notification);
    setBusy(false);
    if (result.kind === "plan_saved_reminders_synced" || result.kind === "plan_saved_reminders_pending" || result.kind === "plan_saved_reminders_cleared") {
      setSavedPlan(result.snapshot.plan);
      setSavedReminderPending(result.kind === "plan_saved_reminders_pending");
    }
    else if (result.kind === "stale") { setSavedPlan(null); setSavedReminderPending(false); setState({ kind: "stale" }); }
    else { setSavedPlan(null); setSavedReminderPending(false); setState({ kind: "error", source: "commit", errorKind: result.kind === "validation_error" ? "validation" : "storage", message: result.kind === "validation_error" ? t(validationCopyKey(result.code)) : t("The plan could not be saved. Try again.") }); }
  }

  async function retryReminders(): Promise<void> {
    setBusy(true);
    const result = await retryPlanReminders(notification);
    setBusy(false);
    setSavedReminderPending(result.kind !== "synced" && result.kind !== "disabled");
  }

  async function editSavedPlan(): Promise<void> {
    setBusy(true);
    const result = await learningPlanEditorCoordinator.startExistingEdit(trackId);
    setBusy(false);
    if (result.kind === "ready") {
      setSavedPlan(null);
      setSavedReminderPending(false);
      setState({ kind: "ready", session: result.session });
      navigation.setParams({ editorId: result.session.editorId, trackId });
    } else if (result.kind === "stale") {
      setSavedPlan(null);
      setSavedReminderPending(false);
      setState({ kind: "stale" });
    } else {
      setSavedPlan(null);
      setSavedReminderPending(false);
      setState({ kind: "error", source: "start-existing", errorKind: "storage", message: t("The saved plan could not be loaded. Try again.") });
    }
  }

  const header = <AppShellHeader backAction={{ onPress: goBack }} context={t("Learning plan")} placement="stack" />;
  if (state.kind === "loading") return <Screen edges={["top", "bottom"]} header={header}><Text style={styles.body}>{t("Preparing your plan")}</Text></Screen>;
  if (savedPlan) return <SavedPlanView plan={savedPlan} t={t} busy={busy} remindersPending={savedReminderPending} onEdit={() => { void editSavedPlan(); }} onRetryReminders={() => { void retryReminders(); }} onBack={goBack} header={header} />;
  if (state.kind === "stale") return <Screen edges={["top", "bottom"]} footer={<Button onPress={goBack} variant="secondary">{t("Go back")}</Button>} footerVariant="sticky" header={header}><View style={styles.root} testID={runtimeSelectors.learningPlan.editorStale()}><EmptyState description={t("This plan is out of date. Review it again.")} title={t("This plan is out of date")} /></View></Screen>;
  if (state.kind === "error") {
    const canRetryCommit = state.source === "commit" && state.errorKind === "storage" && learningPlanEditorCoordinator.getSession(editorId, trackId) !== null;
    const canRetryStartExisting = state.source === "start-existing" && state.errorKind === "storage";
    const retry = canRetryCommit
      ? <Button loading={busy} onPress={() => { void commit(); }} testID={runtimeSelectors.learningPlan.editorRetry()}>{t("Retry save")}</Button>
      : canRetryStartExisting
        ? <Button loading={busy} onPress={() => { void editSavedPlan(); }} testID={runtimeSelectors.learningPlan.editorRetry("start-existing")}>{t("Retry loading plan")}</Button>
        : null;
    const errorSelector = state.source === "start-existing"
      ? runtimeSelectors.learningPlan.editorError("start-existing-storage")
      : runtimeSelectors.learningPlan.editorError(state.errorKind);
    const errorTitle = state.source === "start-existing" ? t("The saved plan could not be loaded. Try again.") : state.errorKind === "validation" ? t("Review the schedule and try again.") : t("The plan could not be saved. Try again.");
    return <Screen edges={["top", "bottom"]} footer={<View style={styles.footerActions}>{retry}<Button onPress={goBack} variant="secondary">{t("Go back")}</Button></View>} footerVariant="sticky" header={header}><View style={styles.root} testID={errorSelector}><InfoBlock accessibilityAlert body={state.message} title={errorTitle} tone="warning" /></View></Screen>;
  }

  const session = state.session;
  const selectedDays = new Set(session.slots.map((slot) => slot.day));
  return (
    <Screen edges={["top", "bottom"]} footer={<View style={styles.footerActions}><Button loading={busy} onPress={() => { void commit(); }} testID={runtimeSelectors.learningPlan.editorCommit()}>{t("Save schedule")}</Button><Button onPress={goBack} variant="secondary">{t("Go back")}</Button></View>} footerVariant="sticky" header={header}>
      <View style={styles.root} testID={runtimeSelectors.learningPlan.editorRoot(editorId)}>
        <View testID={runtimeSelectors.learningPlan.editorState("ready")}><Text maxFontSizeMultiplier={2} style={styles.title}>{t("Edit schedule")}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t("Choose days and set a local time for each day.")}</Text></View>
        <Card>
          <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("Days")}</Text>
          <View style={styles.dayGrid}>{DAYS.map((day) => <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedDays.has(day) }} key={day} onPress={() => toggleDay(day)} style={({ pressed }) => [styles.dayOption, selectedDays.has(day) ? styles.daySelected : null, pressed ? styles.pressed : null]} testID={runtimeSelectors.learningPlan.editorDay(day)}><Text maxFontSizeMultiplier={2} style={selectedDays.has(day) ? styles.daySelectedText : styles.dayText}>{t(DAY_KEYS[day])}</Text></Pressable>)}</View>
        </Card>
        <Card>
          <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("Local times")}</Text>
          {session.slots.map((slot) => <View key={slot.slotId} style={styles.slotRow}><Text maxFontSizeMultiplier={2} style={styles.slotDay}>{t(DAY_KEYS[slot.day])}</Text><TextInput accessibilityLabel={t("Time for {{day}}", { day: t(DAY_KEYS[slot.day]) })} keyboardType="numbers-and-punctuation" maxLength={5} onChangeText={(value) => updateTime(slot.day, value)} style={styles.timeInput} testID={runtimeSelectors.learningPlan.editorTime(slot.day)} value={draftTimes[slot.day] ?? slot.localTime} /></View>)}
          {inlineError ? <InfoBlock accessibilityAlert body={inlineError} title={t("Review the schedule and try again.")} testID={runtimeSelectors.learningPlan.editorError("validation")} tone="warning" /> : null}
        </Card>
      </View>
    </Screen>
  );
}

function validationCopyKey(code: LearningPlanEditorValidationCode): string {
  if (code === "invalid_days") return "Choose between one and seven unique days.";
  if (code === "session_length_unavailable") return "The session length is unavailable.";
  if (code === "invalid_local_time") return "Enter a time in HH:mm format.";
  if (code === "missing_day") return "Choose an existing day.";
  if (code === "unsupported_session_length") return "Choose a positive session length supported by this plan.";
  return "Every day needs a valid supported time and session length.";
}

function SavedPlanView({ plan, t, busy, remindersPending, onEdit, onRetryReminders, onBack, header }: Readonly<{ plan: LearningPlan; t: (key: string, options?: Record<string, unknown>) => string; busy: boolean; remindersPending: boolean; onEdit(): void; onRetryReminders(): void; onBack(): void; header: React.ReactNode }>) {
  const styles = useThemedStyles(createStyles);
  return <Screen edges={["top", "bottom"]} footer={<View style={styles.footerActions}><Button loading={busy} onPress={onEdit} testID={runtimeSelectors.learningPlan.editSchedule()}>{t("Edit schedule")}</Button>{remindersPending ? <Button loading={busy} onPress={onRetryReminders} testID={runtimeSelectors.learningPlan.editorReminderRetry()} variant="secondary">{t("Retry reminders")}</Button> : null}<Button onPress={onBack} variant="secondary">{t("Go back")}</Button></View>} footerVariant="sticky" header={header}><View style={styles.root} testID={runtimeSelectors.learningPlan.persisted()}><Text maxFontSizeMultiplier={2} style={styles.title}>{t("Saved learning plan")}</Text>{remindersPending ? <InfoBlock body={t("The plan was saved, but reminders are pending. Try again.")} title={t("Reminders are pending")} testID={runtimeSelectors.learningPlan.editorReminderPending()} tone="warning" /> : null}<Card>{plan.slots.map((slot) => <View key={slot.slotId} style={styles.slotRow}><Text maxFontSizeMultiplier={2} style={styles.slotDay}>{t(DAY_KEYS[slot.day])}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{slot.localTime}</Text></View>)}</Card></View></Screen>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  root: { gap: spacing.lg },
  title: { ...typography.title, color: palette.textPrimary },
  body: { ...typography.body, color: palette.textSecondary },
  cardTitle: { ...typography.bodyStrong, color: palette.textPrimary, marginBottom: spacing.md },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dayOption: { borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  daySelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  dayText: { ...typography.small, color: palette.textPrimary },
  daySelectedText: { ...typography.small, color: palette.onPrimary, fontWeight: "700" },
  pressed: { opacity: 0.75 },
  slotRow: { alignItems: "center", borderTopColor: palette.effects.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", paddingVertical: spacing.sm },
  slotDay: { ...typography.bodyStrong, color: palette.textPrimary, flex: 1 },
  timeInput: { ...typography.body, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, color: palette.textPrimary, minWidth: 92, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlign: "center" },
  footerActions: { gap: spacing.sm },
});
