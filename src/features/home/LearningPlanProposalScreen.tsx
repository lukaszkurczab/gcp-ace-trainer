import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  learningPlanEditorCoordinator,
  learningPlanProposalCoordinator,
  type LearningPlanAcceptResult,
  type LearningPlanSnapshot,
  type LearningPlanProposalResult,
} from "../../application/learningPlan";
import { AppShellHeader, Button, Card, EmptyState, Screen, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { ROUTES } from "../../constants/routes";
import type { GoalDay, LearningPlan, ProposalOutcome, TargetAssessment } from "../../domain";
import { getTrackDisplay } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { useThemedStyles } from "../../preferences";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { radius, spacing, typography, type AppColors } from "../../theme";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.LEARNING_PLAN_PROPOSAL>;
type ViewState = { kind: "loading" } | LearningPlanProposalResult;
type ProposalActionError = "accept-validation" | "accept-storage" | "open-proposal-storage" | "open-existing-storage";

const DAY_KEYS: Readonly<Record<GoalDay, string>> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

export function LearningPlanProposalScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("learningPlan");
  const { t: tCommon } = useTranslation("common");
  const { proposalId, trackId } = route.params;
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [updating, setUpdating] = useState(false);
  const [acceptedPlan, setAcceptedPlan] = useState<LearningPlanSnapshot | null>(null);
  const [actionError, setActionError] = useState<ProposalActionError | null>(null);
  const track = getTrackDisplay(trackId);

  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void learningPlanProposalCoordinator.resolve(proposalId, trackId).then((result) => {
      if (active) setState(result);
    });
    return () => { active = false; };
  }, [proposalId, trackId]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.HOME);
  }, [navigation]);

  async function updatePlan(): Promise<void> {
    setUpdating(true);
    const result = await learningPlanProposalCoordinator.create(trackId);
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
    const result = await learningPlanEditorCoordinator.startProposalEdit(proposalId, trackId);
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
    const result: LearningPlanAcceptResult = await learningPlanEditorCoordinator.acceptProposal(proposalId, trackId);
    setUpdating(false);
    if (result.kind === "accepted") {
      setAcceptedPlan(result.snapshot);
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

  async function editAcceptedPlan(): Promise<void> {
    setUpdating(true);
    setActionError(null);
    const result = await learningPlanEditorCoordinator.startExistingEdit(trackId);
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
    return <PersistedPlanView plan={acceptedPlan.plan} track={tCommon(track.shortTitle)} t={t} updating={updating} actionError={actionError} onEdit={() => { void editAcceptedPlan(); }} onBack={goBack} />;
  }

  if (state.kind === "loading") {
    return <LearningPlanProposalLoadingSkeleton header={header} />;
  }

  if (state.kind === "stale") {
    return (
      <Screen edges={["top", "bottom"]} footer={<Button loading={updating} onPress={() => { void updatePlan(); }} testID={runtimeSelectors.learningPlan.update()}>{t("Update plan")}</Button>} footerVariant="sticky" header={header}>
        <View testID={runtimeSelectors.learningPlan.state("stale")}><EmptyState description={t("Your goal, content package, or timezone changed. Create a new proposal to continue.")} title={t("This proposal is out of date")} /></View>
      </Screen>
    );
  }

  if (!isProposal(state)) {
    const description = state.kind === "generator_error" && state.classification !== "retryable"
      ? "The plan cannot be created with the current goal. Adjust the goal to continue."
      : failureDescription(state.kind);
    const canUpdate = state.kind === "package_error" || (state.kind === "generator_error" && state.classification === "retryable");
    const shouldAdjust = state.kind === "goal_paused" || (state.kind === "generator_error" && state.classification !== "retryable");
    return (
      <Screen edges={["top", "bottom"]} footer={canUpdate ? <Button loading={updating} onPress={() => { void updatePlan(); }} testID={runtimeSelectors.learningPlan.update()}>{t("Update plan")}</Button> : shouldAdjust ? <Button onPress={() => navigation.navigate(ROUTES.GOAL_CADENCE, { trackId, returnTo: "progress" })} testID={runtimeSelectors.learningPlan.adjustGoal()}>{t("Adjust goal")}</Button> : undefined} footerVariant="sticky" header={header}>
        <View testID={runtimeSelectors.learningPlan.state(state.kind)}><EmptyState description={t(description)} title={t("Plan unavailable")} /></View>
      </Screen>
    );
  }

  const outcome = state.proposal.outcome;
  if (state.kind === "shortfall") {
    const capacity = outcome.sessionCapacity;
    if (capacity.kind !== "shortfall") return null;
    return (
      <Screen
        edges={["top", "bottom"]}
        footer={<View style={styles.footerActions}><Button onPress={() => navigation.navigate(ROUTES.GOAL_CADENCE, { trackId, returnTo: "progress" })} testID={runtimeSelectors.learningPlan.adjustGoal()}>{t("Adjust goal")}</Button><Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { trackId })} testID={runtimeSelectors.learningPlan.backToPractice()} variant="secondary">{t("Back to Practice")}</Button></View>}
        footerVariant="sticky"
        header={header}
      >
        <View style={styles.root} testID={runtimeSelectors.learningPlan.state("shortfall")}>
          <PlanHeader subtitle={t("A proposal based on your current goal")} title={t("Not enough material for this plan")} track={tCommon(track.shortTitle)} />
          <GoalContext outcome={outcome} t={t} tCommon={tCommon} />
          <Card variant="warning"><Text maxFontSizeMultiplier={2} style={styles.body}>{t("The package needs {{requested}} eligible questions per session, but only {{available}} are available. {{missing}} more are required.", { available: capacity.eligibleItemCount, missing: capacity.missingItemCount, requested: capacity.requestedLength })}</Text></Card>
          <FactCard label={t("Target outlook")} value={targetCopy(outcome.targetAssessment, t)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "bottom"]} footer={<View style={styles.footerActions}><Button loading={updating} onPress={() => { void editProposal(); }} testID={runtimeSelectors.learningPlan.editSchedule()}>{t("Edit schedule")}</Button><Button loading={updating} onPress={() => { void acceptProposal(); }} testID={runtimeSelectors.learningPlan.accept()}>{t("Accept plan")}</Button><Button onPress={goBack} variant="secondary">{t("Go back")}</Button></View>} footerVariant="sticky" header={header}>
      <View style={styles.root} testID={runtimeSelectors.learningPlan.root()}>
        <PlanHeader subtitle={t("A proposal based on your current goal")} title={t("Your proposed rhythm")} track={tCommon(track.shortTitle)} />
        <GoalContext outcome={outcome} t={t} tCommon={tCommon} />
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
      </View>
    </Screen>
  );
}

export function LearningPlanProposalLoadingSkeleton({ header }: Readonly<{ header: ReactNode }>) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("learningPlan");
  const motion = useSkeletonGlassMotion();
  return <Screen edges={["top", "bottom"]} header={header}><View accessibilityLabel={`${t("Preparing your plan")}. ${t("We are checking your goal and current learning package.")}`} accessibilityLiveRegion="polite" accessibilityRole="progressbar" accessibilityState={{ busy: true }} style={styles.root} testID={runtimeSelectors.learningPlan.state("loading")}><SkeletonShape motion={motion} style={styles.loadingTitle} /><SkeletonShape motion={motion} style={styles.loadingTrack} /><SkeletonShape motion={motion} style={styles.loadingCard} /><SkeletonShape motion={motion} style={styles.loadingCard} /></View></Screen>;
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
  return <Card><Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("Goal context")}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{tCommon(GOAL_LABELS[outcome.goal.goalType])}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t("Target: {{target}}", { target })}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{t("Days: {{days}}", { days })}</Text></Card>;
}

function isProposal(state: LearningPlanProposalResult): state is Extract<LearningPlanProposalResult, { proposal: unknown }> { return "proposal" in state; }

function failureDescription(kind: Exclude<LearningPlanProposalResult["kind"], "ready" | "shortened" | "shortfall" | "stale">): string {
  if (kind === "no_goal") return "Set an active goal before creating a plan.";
  if (kind === "goal_paused") return "Resume your goal before creating a plan.";
  if (kind === "package_error") return "The learning package could not be loaded. Try again later.";
  if (kind === "package_unavailable") return "This learning package is not available for planning.";
  return "The plan could not be prepared. Try again.";
}

function PlanHeader({ subtitle, title, track }: Readonly<{ subtitle: string; title: string; track: string }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.heading}><Text maxFontSizeMultiplier={2} style={styles.title}>{title}</Text><Text maxFontSizeMultiplier={2} style={styles.subtitle}>{subtitle}</Text><View style={styles.track}><View style={styles.trackAccent} /><Text maxFontSizeMultiplier={2} style={styles.trackText}>{track}</Text></View></View>;
}

function FactCard({ label, value }: Readonly<{ label: string; value: string }>) {
  const styles = useThemedStyles(createStyles);
  return <Card><Text maxFontSizeMultiplier={2} style={styles.factLabel}>{label}</Text><Text maxFontSizeMultiplier={2} style={styles.body}>{value}</Text></Card>;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

function completionCopy(outcome: ProposalOutcome, t: Translate): string {
  const completion = outcome.completionState;
  if (completion.kind === "unknown") return t("The package does not define a completion rule.");
  if (completion.kind === "completed") return t("The package completion rule is currently met.");
  const remaining = Math.max(0, completion.requiredAttemptCount - completion.qualifyingAttemptCount);
  return t("attemptsRemaining", { count: remaining, remaining, window: completion.rollingWindowSize });
}

function targetCopy(target: TargetAssessment, t: Translate): string {
  if (target.kind === "open_ended") return t("No target date. The plan stays open-ended.");
  if (target.kind === "unknown_completion_rule") return t("The target outlook is unknown because the package has no completion rule.");
  if (target.kind === "unavailable_due_to_shortfall") return t("Target outlook is unavailable until the material shortfall is resolved.");
  if (target.kind === "achievable") return t("The target is achievable with {{occurrences}} planned sessions.", { occurrences: target.occurrences });
  return t("The target is not achievable with the current rhythm. {{remaining}} attempts remain and {{occurrences}} sessions fit before the target.", { occurrences: target.occurrences, remaining: target.remainingAttempts });
}

function PersistedPlanView({ plan, track, t, updating, actionError, onEdit, onBack }: Readonly<{
  plan: LearningPlan;
  track: string;
  t: Translate;
  updating: boolean;
  actionError: ProposalActionError | null;
  onEdit(): void;
  onBack(): void;
}>) {
  const styles = useThemedStyles(createStyles);
  return (
    <Screen edges={["top", "bottom"]} footer={<View style={styles.footerActions}><Button loading={updating} onPress={onEdit} testID={runtimeSelectors.learningPlan.editSchedule()}>{t("Edit schedule")}</Button><Button onPress={onBack} variant="secondary">{t("Go back")}</Button></View>} footerVariant="sticky" header={<AppShellHeader backAction={{ onPress: onBack }} context={t("Learning plan")} placement="stack" />}>
      <View style={styles.root} testID={runtimeSelectors.learningPlan.persisted()}>
        <PlanHeader subtitle={t("Saved learning plan")} title={t("Your learning rhythm")} track={track} />
        <Card testID={runtimeSelectors.learningPlan.state("accepted") }>
          <Text maxFontSizeMultiplier={2} style={styles.cardTitle}>{t("Weekly schedule")}</Text>
          {plan.slots.map((slot) => <View key={slot.slotId} style={styles.slot} testID={runtimeSelectors.learningPlan.slot(slot.slotId)}><Text maxFontSizeMultiplier={2} style={styles.slotDay}>{t(DAY_KEYS[slot.day])}</Text><Text maxFontSizeMultiplier={2} style={styles.slotDetail}>{slot.localTime} · {t("{{count}} question", { count: slot.sessionLength })}</Text></View>)}
        </Card>
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
      : kind === "open-proposal-storage"
        ? t("The schedule editor could not be opened. Try again.")
        : t("The saved plan could not be loaded. Try again.");
  return <Card testID={runtimeSelectors.learningPlan.actionError(kind)} variant="warning"><Text maxFontSizeMultiplier={2} style={styles.body}>{copy}</Text></Card>;
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
  loadingTitle: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.md, height: 34, width: "72%" },
  loadingTrack: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.lg, height: 64, width: "100%" },
  loadingCard: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.lg, height: 116, width: "100%" },
});
