import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import {
  type LearningPlanSnapshot,
  type LearningPlanProposalResult,
} from "../../application/learningPlan";
import { productionLearningPlanProposalRuntime, type LearningPlanProposalScreenRuntime } from "./learningPlanProposalRuntime";
import { AppShellHeader, Button, Card, EmptyState, Icon, Screen, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants/routes";
import { CODING_INTERVIEW_TRACK_ID, type GoalDay, type LearningPlan, type PlanningWorkEstimateResult, type ProposalOutcome } from "../../domain";
import { getTrackDisplay } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { useAppPreferences, useThemedStyles, type AppLocale } from "../../preferences";
import { completionCopy, targetCopy, type Translate } from "./homePlanUiContract";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { TRACK_DENSITY_DESCRIPTORS } from "../../domain/tracks/trackAdmission";
import { getTrackRoadmapCatalog } from "../practice/trackRoadmapCatalog";
import { buildLearningPlanWorkloadPresentation } from "./learningPlanWorkloadPresentation";
import { isPatternlySmokeRuntime } from "../../infrastructure/runtime/runtimeMode";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.LEARNING_PLAN_PROPOSAL>;
type ViewState = { kind: "loading" } | LearningPlanProposalResult;
type ProposalActionError = "accept-validation" | "accept-storage" | "accept-reminders-pending" | "open-proposal-storage" | "open-existing-storage";

const DAY_KEYS: Readonly<Record<GoalDay, string>> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

export function LearningPlanProposalScreen({ navigation, route, runtime = productionLearningPlanProposalRuntime }: Props & Readonly<{ runtime?: LearningPlanProposalScreenRuntime }>) {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const { t } = useTranslation("learningPlan");
  const { t: tCommon } = useTranslation("common");
  const { proposalId, trackId } = route.params;
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [updating, setUpdating] = useState(false);
  const [acceptedPlan, setAcceptedPlan] = useState<LearningPlanSnapshot | null>(null);
  const [actionError, setActionError] = useState<ProposalActionError | null>(null);
  const [workloadDetailsExpanded, setWorkloadDetailsExpanded] = useState(false);
  const notification = { body: t("notificationBody", { ns: "notifications" }), title: t("notificationTitle", { ns: "notifications" }) };
  const track = getTrackDisplay(trackId);

  useFocusEffect(useCallback(() => {
    let active = true;
    setState({ kind: "loading" });
    void runtime.resolve(proposalId, trackId).then((result) => {
      if (active) setState(result);
    });
    return () => { active = false; };
  }, [proposalId, trackId, runtime]));

  const goBack = useCallback(() => {
    if (runtime.exitFixture) {
      runtime.exitFixture();
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.HOME);
  }, [navigation, runtime]);

  async function updatePlan(): Promise<void> {
    setUpdating(true);
    const result = await runtime.create(trackId);
    setUpdating(false);
    if (isProposal(result)) {
      navigation.replace(ROUTES.LEARNING_PLAN_PROPOSAL, { proposalId: result.proposal.proposalId, trackId });
      return;
    }
    setState(result);
  }

  async function editProposal(): Promise<void> {
    setUpdating(true);
    setActionError(null);
    const result = await runtime.startProposalEdit(proposalId, trackId);
    setUpdating(false);
    if (result.kind === "ready") {
      navigation.navigate(ROUTES.LEARNING_PLAN_EDITOR, { editorId: result.session.editorId, trackId });
    } else if (result.kind === "stale") {
      setActionError(null);
      setState({ kind: "stale" });
    } else {
      setActionError("open-proposal-storage");
    }
  }

  async function acceptProposal(): Promise<void> {
    setUpdating(true);
    setActionError(null);
    const result = await runtime.accept(proposalId, trackId, notification);
    setUpdating(false);
    if (result.kind === "plan_saved_reminders_synced" || result.kind === "plan_saved_reminders_pending" || result.kind === "plan_saved_reminders_cleared") {
      setAcceptedPlan(result.snapshot);
      setActionError(result.kind === "plan_saved_reminders_pending" ? "accept-reminders-pending" : null);
    } else if (result.kind === "stale") {
      setActionError(null);
      setAcceptedPlan(null);
      setState({ kind: "stale" });
    } else if (result.kind === "validation_error") {
      setActionError("accept-validation");
    } else {
      setActionError("accept-storage");
    }
  }

  async function retryReminders(): Promise<void> {
    setUpdating(true);
    const result = await runtime.retryReminders(notification);
    setUpdating(false);
    setActionError(result.kind === "synced" || result.kind === "disabled" ? null : "accept-reminders-pending");
  }

  async function editAcceptedPlan(): Promise<void> {
    setUpdating(true);
    setActionError(null);
    const result = await runtime.startExistingEdit(trackId);
    setUpdating(false);
    if (result.kind === "ready") {
      navigation.navigate(ROUTES.LEARNING_PLAN_EDITOR, { editorId: result.session.editorId, trackId });
    } else if (result.kind === "stale") {
      setActionError(null);
      setAcceptedPlan(null);
      setState({ kind: "stale" });
    } else {
      setActionError("open-existing-storage");
    }
  }

  const header = <AppShellHeader backAction={{ onPress: goBack }} context={t("Learning plan")} placement="stack" />;

  if (acceptedPlan) {
    return <PersistedPlanView plan={acceptedPlan.plan} track={tCommon(track.shortTitle)} t={t} updating={updating} actionError={actionError} onEdit={() => { void editAcceptedPlan(); }} onRetryReminders={() => { void retryReminders(); }} onBack={goBack} />;
  }

  if (state.kind === "loading") {
    return <LearningPlanProposalLoadingSkeleton header={header} />;
  }

  if (state.kind === "stale") {
    return (
      <Screen edges={["bottom"]} footer={<Button loading={updating} onPress={() => { void updatePlan(); }} testID={runtimeSelectors.learningPlan.update()}>{t("Update plan")}</Button>} footerVariant="sticky" header={header}>
        <View testID={runtimeSelectors.learningPlan.state("stale")}><EmptyState description={t("Your goal, content package, or timezone changed. Create a new proposal to continue.")} title={t("This proposal is out of date")} /><FixtureCallDiagnostics runtime={runtime} /></View>
      </Screen>
    );
  }

  if (!isProposal(state)) {
    const description = state.kind === "generator_error" && state.classification !== "retryable"
      ? "The plan cannot be created with the current goal. Adjust the goal to continue."
      : failureDescription(state.kind, state.kind === "active_session_unavailable" ? state.reason : undefined);
    const canUpdate = state.kind === "package_error" || (state.kind === "generator_error" && state.classification === "retryable");
    const shouldAdjust = state.kind === "goal_paused" || state.kind === "budget_required" || (state.kind === "generator_error" && state.classification !== "retryable");
    return (
      <Screen edges={["bottom"]} footer={canUpdate ? <Button loading={updating} onPress={() => { void updatePlan(); }} testID={runtimeSelectors.learningPlan.update()}>{t("Update plan")}</Button> : shouldAdjust ? <Button onPress={() => navigation.navigate(ROUTES.GOAL_CADENCE, { trackId, returnTo: "progress" })} testID={runtimeSelectors.learningPlan.adjustGoal()}>{t("Adjust goal")}</Button> : undefined} footerVariant="sticky" header={header}>
        <View testID={runtimeSelectors.learningPlan.state(state.kind)}><EmptyState description={t(description)} title={t("Plan unavailable")} /><FixtureCallDiagnostics runtime={runtime} /></View>
      </Screen>
    );
  }

  const outcome = state.proposal.outcome;
  if (state.kind === "shortfall") {
    const capacity = outcome.sessionCapacity;
    if (capacity.kind !== "shortfall") return null;
    return (
      <Screen
        edges={["bottom"]}
        footer={<View style={styles.footerActions}><Button onPress={() => navigation.navigate(ROUTES.GOAL_CADENCE, { trackId, returnTo: "progress" })} testID={runtimeSelectors.learningPlan.adjustGoal()}>{t("Adjust goal")}</Button><Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { trackId })} testID={runtimeSelectors.learningPlan.backToPractice()} variant="secondary">{t("Back to Practice")}</Button></View>}
        footerVariant="sticky"
        header={header}
      >
        <View style={styles.root} testID={runtimeSelectors.learningPlan.state("shortfall")}>
          <PlanHeader subtitle={t("A proposal based on your current goal")} title={t("Not enough material for this plan")} track={tCommon(track.shortTitle)} />
          <GoalContext outcome={outcome} t={t} tCommon={tCommon} />
          <ExecutionSummary outcome={outcome} estimate={state.proposal.nextSessionTimeEstimate} t={t} />
          <CalendarAndScopeSummary calendar={state.proposal.nextSessionCalendar} locale={locale} t={t} />
          <FullGoalWorkloadSummary trackId={trackId} workload={state.proposal.fullGoalWorkload} calendar={state.proposal.fullGoalCalendar} capacity={state.proposal.fullGoalTimeCapacity} locale={locale} t={t} tCommon={tCommon} expanded={workloadDetailsExpanded} onToggleDetails={() => setWorkloadDetailsExpanded((expanded) => !expanded)} />
          <Card variant="warning"><Text maxFontSizeMultiplier={2} style={styles.body}>{t("The package needs {{requested}} eligible questions per session, but only {{available}} are available. {{missing}} more are required.", { available: capacity.eligibleItemCount, missing: capacity.missingItemCount, requested: capacity.requestedLength })}</Text></Card>
          <FactCard label={t("Target outlook")} value={targetCopy(outcome.targetAssessment, t)} />
          <FixtureCallDiagnostics runtime={runtime} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]} footer={<View style={styles.footerActions}><Button loading={updating} onPress={() => { void editProposal(); }} testID={runtimeSelectors.learningPlan.editSchedule()} variant="secondary">{t("Edit schedule")}</Button><Button loading={updating} onPress={() => { void acceptProposal(); }} testID={runtimeSelectors.learningPlan.accept()}>{t("Accept plan")}</Button></View>} footerVariant="sticky" header={header}>
      <View style={styles.root} testID={runtimeSelectors.learningPlan.root()}>
        <PlanHeader testID={__DEV__ && isPatternlySmokeRuntime() ? runtimeSelectors.learningPlan.proposalIdentity(proposalId) : undefined} title={t("Review your learning plan")} track={tCommon(track.shortTitle)} />
        <GoalContext outcome={outcome} t={t} tCommon={tCommon} />
        <ExecutionSummary outcome={outcome} estimate={state.proposal.nextSessionTimeEstimate} t={t} />
        <CalendarAndScopeSummary calendar={state.proposal.nextSessionCalendar} locale={locale} t={t} />
          <FullGoalWorkloadSummary trackId={trackId} workload={state.proposal.fullGoalWorkload} calendar={state.proposal.fullGoalCalendar} capacity={state.proposal.fullGoalTimeCapacity} locale={locale} t={t} tCommon={tCommon} expanded={workloadDetailsExpanded} onToggleDetails={() => setWorkloadDetailsExpanded((expanded) => !expanded)} />
        {state.kind === "shortened" && outcome.sessionCapacity.kind === "shortened" ? (
          <Card variant="warning"><Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("A shorter path is available")}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t("The package explicitly supports shorter sessions. Your proposal uses {{count}} questions instead of {{requested}}.", { count: outcome.sessionCapacity.actualLength, requested: outcome.sessionCapacity.requestedLength })}</Text></Card>
        ) : null}
        <Card testID={runtimeSelectors.learningPlan.state(state.kind)}>
          <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("Weekly schedule")}</Text>
          {outcome.slots.map((slot) => <View key={slot.slotId} style={styles.slot} testID={runtimeSelectors.learningPlan.slot(slot.slotId)}><Text maxFontSizeMultiplier={2} style={styles.slotDay}>{t(DAY_KEYS[slot.day])}</Text><Text maxFontSizeMultiplier={2} style={styles.slotDetail}>{slot.localTime} · {t("{{count}} question", { count: slot.sessionLength })}</Text></View>)}
        </Card>
        <FactCard label={t("Material priority")} value={outcome.materialPriority.kind === "due_review" ? t("Due reviews first") : t("Primary package scope: {{scope}}", { scope: outcome.materialPriority.label })} />
        <FactCard label={t("Completion rule")} value={completionCopy(outcome, t)} />
        <FactCard label={t("Target outlook")} value={targetCopy(outcome.targetAssessment, t)} />
        {actionError ? <PlanActionError kind={actionError} t={t} /> : null}
        <FixtureCallDiagnostics runtime={runtime} />
      </View>
    </Screen>
  );
}

function FixtureCallDiagnostics({ runtime }: Readonly<{ runtime: LearningPlanProposalScreenRuntime }>) {
  const styles = useThemedStyles(createStyles);
  const counts = runtime.getFixtureInvocationCounts?.();
  if (!counts) return null;
  return <View accessibilityLabel="Local proposal fixture action counts" style={styles.fixtureDiagnostics}>{Object.entries(counts).map(([action, count]) => <Text key={action} maxFontSizeMultiplier={2} style={styles.body} testID={runtimeSelectors.learningPlan.fixtureCall(action, count)}>{`Fixture ${action}: ${count}`}</Text>)}</View>;
}

export function LearningPlanProposalLoadingSkeleton({ header }: Readonly<{ header: ReactNode }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("learningPlan");
  const motion = useSkeletonGlassMotion();
  return <Screen edges={["bottom"]} header={header}><View accessibilityLabel={`${t("Preparing your plan")}. ${t("We are checking your goal and current learning package.")}`} accessibilityLiveRegion="polite" accessibilityRole="progressbar" accessibilityState={{ busy: true }} style={styles.root} testID={runtimeSelectors.learningPlan.state("loading")}><SkeletonShape motion={motion} style={styles.loadingTitle} /><SkeletonShape motion={motion} style={styles.loadingTrack} /><SkeletonShape motion={motion} style={styles.loadingCard} /><SkeletonShape motion={motion} style={styles.loadingCard} /></View></Screen>;
}

const GOAL_LABELS: Readonly<Record<ProposalOutcome["goal"]["goalType"], string>> = {
  prepare_for_an_interview: "Interview preparation",
  prepare_for_a_certification: "Certification preparation",
  build_foundations: "Build foundations",
  refresh_and_maintain_skills: "Keep skills fresh",
  learn_at_own_pace: "Self-paced",
};

function GoalContext({ outcome, t, tCommon }: Readonly<{ outcome: ProposalOutcome; t: Translate; tCommon: Translate }>) {
  const styles = useThemedStyles(createStyles);
  const target = outcome.goal.targetDate ?? tCommon("No target date");
  const days = outcome.goal.preferredDays.map((day) => t(DAY_KEYS[day])).join(", ");
  return <Card><Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{tCommon(GOAL_LABELS[outcome.goal.goalType])}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t("Target: {{target}}", { target })}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t("Days: {{days}}", { days })}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{tCommon("Time available for this track")}: {tCommon("{{count}} min", { count: outcome.minutesPerStudyDay })}</Text></Card>;
}

function ExecutionSummary({ outcome, estimate, t }: Readonly<{ outcome: ProposalOutcome; estimate: PlanningWorkEstimateResult; t: Translate }>) {
  const styles = useThemedStyles(createStyles);
  const next = outcome.nextSession.kind === "continue_existing"
    ? t("Continue your existing {{length}}-question session.", { length: outcome.nextSession.requestedLength })
    : outcome.nextSession.kind === "diagnosis"
    ? t("The first session is a one-time diagnostic with {{count}} questions.", { count: outcome.nextSession.requestedLength })
    : outcome.nextSession.kind === "review"
      ? t("Next session: {{count}} due-review questions.", { count: outcome.nextSession.requestedLength })
      : t("Next session: {{count}} practice questions.", { count: outcome.nextSession.requestedLength });
  const diagnosisNote = outcome.diagnosisStatus === "active" ? t("Your diagnostic is in progress and will resume.")
    : outcome.diagnosisStatus === "completed" ? t("Your initial diagnostic is complete.")
      : outcome.diagnosisStatus === "abandoned" ? t("Your diagnostic stopped before completion. It will not restart automatically; you can start it manually.")
        : null;
  const estimateCopy = estimate.kind === "estimated"
    ? t("Estimated time: {{min}}–{{max}} min. {{source}}.", { min: estimate.minMinutes, max: estimate.maxMinutes, source: t(estimate.provenance === "authored" ? "Based on an authored estimate" : estimate.provenance === "observed" ? "Based on your completed sessions" : "Combines authored and observed estimates") })
    : t(estimate.reason === "empty_pool" ? "Time estimate unavailable because no eligible material was selected." : "Time estimate unavailable because no authored estimate covers this session.");
  const remaining = estimate.kind === "estimated" ? estimate.newResponses + estimate.dueReviewResponses : null;
  return <Card><Text maxFontSizeMultiplier={2} style={styles.body}>{next}</Text>{outcome.nextSession.kind === "continue_existing" && remaining !== null ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("{{count}} responses remain in this session.", { count: remaining })}</Text> : null}<Text maxFontSizeMultiplier={2} style={styles.body}>{estimateCopy}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t("Recurring practice: {{count}} questions in each scheduled session.", { count: outcome.executionPolicy.practice.requestedLength })}</Text>{diagnosisNote ? <Text maxFontSizeMultiplier={2} style={styles.body}>{diagnosisNote}</Text> : null}</Card>;
}

function CalendarAndScopeSummary({ calendar, locale, t }: Readonly<{
  calendar: import("../../application/learningPlan/LearningPlanProposalCoordinator").CoordinatedLearningPlanProposal["nextSessionCalendar"];
  locale: AppLocale;
  t: Translate;
}>) {
  const styles = useThemedStyles(createStyles);
  let calendarText: string;
  if (calendar.kind === "unavailable") calendarText = t("No authored time estimate is available for a legal session.");
  else {
    const selectedDay = calendar.calendar.availableDays.find((day) => day.selectedSession !== null);
    if (calendar.calendar.kind === "capacity_unknown") calendarText = t("Today’s remaining time is unknown because an active session spans a local-day boundary.");
    else if (selectedDay?.selectedSession) {
      const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${selectedDay.localDate}T00:00:00.000Z`));
      calendarText = t("Next legal session: {{date}} at {{time}}; estimated {{min}}–{{max}} min.", { date, time: "18:00", min: selectedDay.selectedSession.minMinutes, max: selectedDay.selectedSession.maxMinutes });
    } else if (calendar.calendar.kind === "shortfall" || calendar.calendar.kind === "past_target") calendarText = t("No legal session fits before this goal’s target.");
    else calendarText = t("No legal session fits this track’s daily time budget.");
  }
  const sessionLines = calendar.kind === "available" ? [
    ...(calendar.calendar.unscheduledSessionCount > 0 ? [t("{{count}} required session(s) cannot fit in the known calendar windows.", { count: calendar.calendar.unscheduledSessionCount })] : []),
    ...(calendar.calendar.unknownRequiredSessionCount > 0 ? [t("Capacity for {{count}} required session(s) is unknown today.", { count: calendar.calendar.unknownRequiredSessionCount })] : []),
    ...(calendar.calendar.unscheduledReviewObligationIds.length > 0 ? [t("{{count}} real due review(s) have no legal window before the target.", { count: calendar.calendar.unscheduledReviewObligationIds.length })] : []),
  ] : [];
  return <Card testID="learning-plan-next-session-summary"><Text maxFontSizeMultiplier={2} style={styles.body}>{calendarText}</Text>{sessionLines.map((line, index) => <Text key={`${index}:${line}`} maxFontSizeMultiplier={2} style={styles.body}>{line}</Text>)}</Card>;
}

function FullGoalWorkloadSummary({ trackId, workload, calendar, capacity, locale, t, tCommon, expanded, onToggleDetails }: Readonly<{
  trackId: import("../../domain").TrackId;
  workload: import("../../application/learningPlan/fullGoalWorkloadProjection").FullGoalWorkloadProjection;
  calendar: import("../../application/learningPlan/LearningPlanProposalCoordinator").CoordinatedLearningPlanProposal["fullGoalCalendar"];
  capacity: import("../../application/learningPlan/fullGoalTimeCapacity").FullGoalTimeCapacity;
  locale: AppLocale;
  t: Translate;
  tCommon: Translate;
  expanded: boolean;
  onToggleDetails(): void;
}>) {
  const styles = useThemedStyles(createStyles);
  const chapterCatalog = trackId === CODING_INTERVIEW_TRACK_ID ? getTrackRoadmapCatalog(trackId) : [];
  const chapterTitles = new Map(chapterCatalog.map((chapter) => [chapter.id, chapter.title]));
  const trackDescriptor = TRACK_DENSITY_DESCRIPTORS.find((descriptor) => descriptor.trackId === trackId);
  const view = buildLearningPlanWorkloadPresentation({ workload, capacity, chapterTitles, freeNodeId: trackDescriptor?.freeNodeId ?? null });
  const dueReviewDate = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: calendar.kind === "available" ? calendar.calendar.timezone : undefined }).format(new Date(value));
  const chapterReason = (reason: NonNullable<typeof view.chapters[number]["reason"]>, premiumRequired: boolean | null) => {
    if (reason === "no_canonical_request") return t(premiumRequired ? "No legal request covers this required Premium chapter; Premium availability is not checked here." : "No legal request covers this required chapter.");
    if (reason === "missing_scope_cost") return t("A legal request exists, but at least one required unit has no time estimate.");
    if (reason === "missing_review_request") return t("This due review has no matching legal review request.");
    if (reason === "missing_review_cost") return t("The legal review request has no time estimate.");
    return t("Future quality-repair time depends on later answers and cannot be estimated yet.");
  };
  const source = view.estimateSource === "authored" ? t("Authored initial estimates") : view.estimateSource === "observed" ? t("Completed session observations") : view.estimateSource === "mixed" ? t("Authored and observed estimates") : t("No verified time estimate");
  const mainLines: string[] = [];
  if (view.kind === "complete") {
    mainLines.push(t("All {{count}} required chapters are complete.", { count: view.requiredChapterCount }));
    mainLines.push(t("You can continue with optional practice."));
  } else if (view.kind === "reviews_due") {
    mainLines.push(t("All required chapters are complete; {{count}} scheduled reviews remain.", { count: view.dueReviewCount }));
    if (view.knownMinMinutes !== null && view.knownTypicalMinutes !== null && view.knownMaxMinutes !== null) {
      mainLines.push(t("Known due-review time estimate: {{min}}–{{max}} min; central estimate {{typical}} min.", { min: view.knownMinMinutes, typical: view.knownTypicalMinutes, max: view.knownMaxMinutes }));
    } else if (view.knownMinMinutes !== null && view.knownMinMinutes > 0) {
      mainLines.push(t("Known due-review time starts at {{min}} min; time for all scheduled reviews is not available.", { min: view.knownMinMinutes }));
    }
  } else if (view.kind === "unknown") {
    mainLines.push(t("Full required workload is unavailable because the completion contract or planning policy could not be verified."));
  } else if (view.kind === "estimated" && view.knownMaxMinutes !== null && view.knownTypicalMinutes !== null) {
    mainLines.push(t("Full required work estimate: {{min}}–{{max}} min; central estimate {{typical}} min.", { min: view.knownMinMinutes, max: view.knownMaxMinutes, typical: view.knownTypicalMinutes }));
  } else if (view.knownMinMinutes !== null && view.knownMinMinutes > 0) {
    mainLines.push(t("Known work starts at {{min}} min; time for all required chapters is not available.", { min: view.knownMinMinutes }));
  } else {
    mainLines.push(t("Full required workload is unavailable because the completion contract or planning policy could not be verified."));
  }
  if (view.kind !== "complete" && view.kind !== "unknown" && view.uncertainChapterCount > 0) {
    mainLines.push(t("{{count}} required chapters still need a complete scope or time estimate.", { count: view.uncertainChapterCount }));
  }
  if (view.uncostedDueReviewCount > 0) {
    mainLines.push(t("Time for {{count}} active due reviews is unavailable; their real due dates remain in the queue.", { count: view.uncostedDueReviewCount }));
  }
  if (capacity.kind === "minimum_exceeds_available_time") {
    mainLines.push(t("Known minimum work exceeds this goal’s available study time: {{min}} min required versus {{available}} min available.", { min: capacity.workMinMinutes, available: capacity.availableMinutes }));
  } else if (capacity.kind === "unscheduled_due_reviews") {
    mainLines.push(t("{{count}} real due reviews have no legal calendar window before the target.", { count: capacity.unscheduledReviewObligationIds.length }));
  } else if (capacity.kind === "range_crosses_available_time") {
    mainLines.push(t("Estimated work crosses the {{available}}-minute study budget; full fit is uncertain.", { available: capacity.availableMinutes }));
  } else if (capacity.kind === "uncertain") {
    mainLines.push(t("Available time is {{available}} min; full fit is uncertain because some required work or today’s capacity is unknown.", { available: capacity.availableMinutes }));
  }

  return <Card testID="learning-plan-workload-summary">
    <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{view.kind === "complete" ? t("Required learning complete") : view.kind === "reviews_due" ? t("Required chapters complete") : t("Full required workload")}</Text>
    {mainLines.map((line, index) => <Text key={`${index}:${line}`} maxFontSizeMultiplier={2} style={styles.body}>{line}</Text>)}
    <Pressable accessibilityLabel={tCommon(expanded ? "Hide details" : "Show details")} accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggleDetails} style={styles.workloadDetailsToggle} testID="learning-plan-workload-details-toggle">
      <Text maxFontSizeMultiplier={2} style={styles.workloadDetailsLabel}>{tCommon(expanded ? "Hide details" : "Details")}</Text>
      <Icon color={styles.workloadDetailsIcon.color} name={expanded ? "chevron-up" : "chevron-down"} size={18} />
    </Pressable>
    {expanded ? <View accessibilityLabel={tCommon("Details")} style={styles.workloadDetails} testID="learning-plan-workload-details">
      <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Required chapters complete: {{completed}} of {{required}}.", { completed: view.completedChapterCount, required: view.requiredChapterCount })}</Text>
      {view.chapters.map((chapter) => <View key={chapter.nodeId} style={styles.workloadChapter}>
        <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{chapter.title ?? t("Chapter name unavailable for canonical ID {{id}}.", { id: chapter.nodeId })}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.body}>{t(chapter.status === "complete" ? "Chapter complete" : chapter.status === "quality_unmet" ? "Recent chapter accuracy is below the required level" : "Required work remains in this chapter")}</Text>
        {chapter.premiumRequired ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("This required chapter is Premium; this estimate does not verify access.")}</Text> : null}
        {chapter.requiredResponses > 0 ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Responses remaining: {{count}} ({{due}} eligible due reviews and {{new}} new practice responses).", { count: chapter.requiredResponses, due: chapter.dueReviewResponses, new: chapter.newResponses })}</Text> : null}
        {chapter.minMinutes !== null && chapter.typicalMinutes !== null ? <Text maxFontSizeMultiplier={2} style={styles.body}>{chapter.maxMinutes === null
          ? t("Chapter time estimate: at least {{min}} min; typical {{typical}} min; future work has no finite upper estimate.", { min: chapter.minMinutes, typical: chapter.typicalMinutes })
          : t("Chapter time estimate: at least {{min}} min; typical {{typical}} min; upper estimate {{max}} min.", { min: chapter.minMinutes, typical: chapter.typicalMinutes, max: chapter.maxMinutes })}</Text> : null}
        {chapter.reason ? <Text maxFontSizeMultiplier={2} style={styles.body}>{chapterReason(chapter.reason, chapter.premiumRequired)}</Text> : null}
        {chapter.qualityRepair ? <Text maxFontSizeMultiplier={2} style={styles.body}>{chapter.qualityRepair.nextLegalBlockResponses === null || chapter.qualityRepair.minMinutes === null || chapter.qualityRepair.maxMinutes === null
          ? t("The next legal quality-repair block has no verified time estimate.")
          : t("Next legal quality-repair block: {{responses}} responses, estimated {{min}}–{{max}} min; future quality work has no finite bound.", { responses: chapter.qualityRepair.nextLegalBlockResponses, min: chapter.qualityRepair.minMinutes, max: chapter.qualityRepair.maxMinutes })}</Text> : null}
      </View>)}
      {workload.dueReviews.map((review) => <View key={review.id} style={styles.workloadChapter}>
        <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("Due review")}</Text>
        <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Due {{date}}", { date: dueReviewDate(review.dueAt) })}</Text>
        {review.minMinutes !== null && review.maxMinutes !== null ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Review time estimate: {{min}}–{{max}} min.", { min: review.minMinutes, max: review.maxMinutes })}</Text> : <Text maxFontSizeMultiplier={2} style={styles.body}>{t("No legal review time estimate is available for this due item.")}</Text>}
        {review.creditsTowardMinimum ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("This due review is credited once toward required work.")}</Text> : null}
      </View>)}
      {view.kind !== "complete" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Full-work estimate source: {{source}} ({{count}} observations).", { source, count: view.observationCount })}</Text> : null}
      {view.dueReviewCount > 0 && calendar.kind === "available" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Calendar horizon: {{from}} through {{through}}.", { from: calendar.calendar.localToday, through: calendar.calendar.previewThrough })}</Text> : null}
      {view.nextPractice?.kind === "estimated" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Next practice stage: {{responses}} responses; at least {{min}} min, typical {{typical}} min, upper estimate {{max}} min.", { responses: view.nextPractice.responseCount, min: view.nextPractice.minMinutes, typical: view.nextPractice.typicalMinutes, max: view.nextPractice.maxMinutes })}</Text> : null}
      {view.nextPractice?.kind === "unavailable" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t(view.nextPractice.reason === "no_canonical_request" ? "No legal practice request is available for the next stage." : "The next legal practice request has no verified time estimate.")}</Text> : null}
      {capacity.kind === "range_within_available_time" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("The estimate range fits within {{available}} available clock minutes; this does not guarantee completion.", { available: capacity.availableMinutes })}</Text> : null}
      {capacity.kind === "range_crosses_available_time" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("The time estimate range crosses the {{available}}-minute study budget; the result is uncertain.", { available: capacity.availableMinutes })}</Text> : null}
      {capacity.kind === "uncertain" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Available time is {{available}} min, but unknown scope, quality or today’s capacity prevents a full-fit conclusion.", { available: capacity.availableMinutes })}</Text> : null}
      {capacity.kind === "open_ended_preview" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("This open-ended goal shows a {{available}}-minute calendar preview, not a completion deadline.", { available: capacity.availableMinutes })}</Text> : null}
      {capacity.kind === "unavailable" ? <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Full time-capacity comparison is unavailable.")}</Text> : null}
      <Text maxFontSizeMultiplier={2} style={styles.body}>{t("Clock-time capacity is a horizon comparison; legal session availability is shown separately.")}</Text>
    </View> : null}
  </Card>;
}

function isProposal(state: LearningPlanProposalResult): state is Extract<LearningPlanProposalResult, { proposal: unknown }> { return "proposal" in state; }

function failureDescription(kind: Exclude<LearningPlanProposalResult["kind"], "ready" | "shortened" | "shortfall" | "stale">, activeSessionReason?: "another_track_active" | "active_session_not_indexed" | "active_session_mode_unavailable" | "active_session_length_unavailable"): string {
  if (kind === "no_goal") return "Set an active goal before creating a plan.";
  if (kind === "goal_paused") return "Resume your goal before creating a plan.";
  if (kind === "budget_required") return "Choose how much time you can spend on this track each study day.";
  if (kind === "package_error") return "The learning package could not be loaded. Try again later.";
  if (kind === "package_unavailable") return "This learning package is not available for planning.";
  if (kind === "active_session_unavailable") return activeSessionReason === "another_track_active"
    ? "Finish the active session on its track before creating a plan for another track."
    : "The active session cannot be safely resumed with the available session data.";
  return "The plan could not be prepared. Try again.";
}

function PlanHeader({ subtitle, title, track, testID }: Readonly<{ subtitle?: string; title: string; track: string; testID?: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.heading}><Text maxFontSizeMultiplier={2} style={styles.title} testID={testID}>{title}</Text>{subtitle ? <Text maxFontSizeMultiplier={2} style={styles.subtitle}>{subtitle}</Text> : null}<View style={styles.track}><View style={styles.trackAccent} /><Text maxFontSizeMultiplier={2} style={styles.trackText}>{track}</Text></View></View>;
}

function FactCard({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <Card><Text maxFontSizeMultiplier={2} style={styles.factLabel}>{label}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{value}</Text></Card>;
}

function PersistedPlanView({ plan, track, t, updating, actionError, onEdit, onRetryReminders, onBack }: Readonly<{
  plan: LearningPlan;
  track: string;
  t: Translate;
  updating: boolean;
  actionError: ProposalActionError | null;
  onEdit(): void;
  onRetryReminders(): void;
  onBack(): void;
}>) {
  const styles = useThemedStyles(createStyles);
  return (
    <Screen edges={["bottom"]} footer={<View style={styles.footerActions}><Button loading={updating} onPress={onEdit} testID={runtimeSelectors.learningPlan.editSchedule()}>{t("Edit schedule")}</Button>{actionError === "accept-reminders-pending" ? <Button loading={updating} onPress={onRetryReminders} testID={runtimeSelectors.learningPlan.retryReminders()} variant="secondary">{t("Retry reminders")}</Button> : null}<Button onPress={onBack} variant="secondary">{t("Go back")}</Button></View>} footerVariant="sticky" header={<AppShellHeader backAction={{ onPress: onBack }} context={t("Learning plan")} placement="stack" />}>
      <View style={styles.root} testID={runtimeSelectors.learningPlan.persisted()}>
        <PlanHeader subtitle={t("Saved learning plan")} title={t("Your learning rhythm")} track={track} />
        <Card testID={runtimeSelectors.learningPlan.state("accepted") }>
          <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("Weekly schedule")}</Text>
          {plan.slots.map((slot) => <View key={slot.slotId} style={styles.slot} testID={runtimeSelectors.learningPlan.slot(slot.slotId)}><Text maxFontSizeMultiplier={2} style={styles.slotDay}>{t(DAY_KEYS[slot.day])}</Text><Text maxFontSizeMultiplier={2} style={styles.slotDetail}>{slot.localTime} · {t("{{count}} question", { count: slot.sessionLength })}</Text></View>)}
        </Card>
        {plan.schemaVersion === 2 ? <Card><Text maxFontSizeMultiplier={2} style={styles.body}>{t("Recurring practice: {{count}} questions in each scheduled session.", { count: plan.executionPolicy.practice.requestedLength })}</Text></Card> : null}
        {actionError ? <PlanActionError kind={actionError} t={t} /> : null}
      </View>
    </Screen>
  );
}

function PlanActionError({ kind, t }: Readonly<{ kind: ProposalActionError; t: Translate }>) {
  const styles = useThemedStyles(createStyles);
  const copy = kind === "accept-validation"
    ? t("Review the schedule and try again.")
    : kind === "accept-storage"
      ? t("The plan could not be saved. Try again.")
      : kind === "accept-reminders-pending"
        ? t("The plan was saved, but reminders are pending. Try again.")
      : kind === "open-proposal-storage"
        ? t("The schedule editor could not be opened. Try again.")
        : t("The saved plan could not be loaded. Try again.");
  return <View accessibilityLiveRegion="assertive" accessibilityRole="alert" accessible><Card testID={runtimeSelectors.learningPlan.actionError(kind)} variant="warning"><Text maxFontSizeMultiplier={2} style={styles.body}>{copy}</Text></Card></View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  root: { gap: spacing.lg },
  heading: { gap: spacing.sm },
  title: { ...typography.title, color: palette.textPrimary },
  subtitle: { ...typography.body, color: palette.textSecondary },
  track: { alignItems: "center", backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, padding: spacing.lg },
  trackAccent: { alignSelf: "stretch", backgroundColor: palette.primary, borderRadius: radius.pill, width: 3 },
  trackText: { ...typography.bodyStrong, color: palette.textPrimary, flexShrink: 1 },
  cardTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  body: { ...typography.body, color: palette.textSecondary },
  factLabel: { ...typography.small, color: palette.primary, fontWeight: "700" },
  slot: { alignItems: "center", borderTopColor: palette.effects.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", paddingTop: spacing.md },
  slotDay: { ...typography.bodyStrong, color: palette.textPrimary, flexShrink: 1 },
  slotDetail: { ...typography.small, color: palette.textSecondary },
  footerActions: { gap: spacing.sm },
  workloadDetailsToggle: { alignItems: "center", borderTopColor: palette.effects.divider, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 48, paddingHorizontal: spacing.xs, paddingTop: spacing.sm },
  workloadDetailsLabel: { ...typography.bodyStrong, color: palette.textSecondary },
  workloadDetailsIcon: { color: palette.textSecondary },
  workloadDetails: { gap: spacing.md, paddingTop: spacing.sm },
  workloadChapter: { borderTopColor: palette.effects.divider, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.xs, paddingTop: spacing.md },
  fixtureDiagnostics: { borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  loadingTitle: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.md, height: 34, width: "72%" },
  loadingTrack: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.lg, height: 64, width: "100%" },
  loadingCard: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.lg, height: 116, width: "100%" },
});
