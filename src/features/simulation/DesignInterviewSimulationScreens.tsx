import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, EmptyState, Screen } from "../../components";
import { DesignInterviewSimulationExpiredError, getDesignInterviewSimulationResult, getDesignInterviewSimulationProjection, openDesignInterviewSimulation, saveDesignInterviewSimulationStage, finishDesignInterviewSimulation, recoverDesignInterviewSimulationOperation, reconcileDesignInterviewSimulationSave, retryDesignInterviewSimulationSave, resumeDesignInterviewSimulationAfterStaleConflict, type DesignSimulationProjection, type DesignSimulationResultProjection, type DesignSimulationStage } from "../../application/design-interview";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { useThemedStyles } from "../../preferences";
import { useHomeResumeUnavailable } from "../../content/application/ContentPreparationGate";
import { spacing, typography, type AppColors } from "../../theme";
import { DesignSimulationDraftDrain } from "./designSimulationDraftDrain";
import { ReviewCycleConflictNotice } from "../practice/ReviewCycleConflictNotice";

type RunnerProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.DESIGN_INTERVIEW_SIMULATION>;
type ResultProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT>;
type ReviewProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.DESIGN_INTERVIEW_SIMULATION_REVIEW>;

const STAGES: readonly DesignSimulationStage[] = ["requirements", "architecture", "tradeoffs", "final_answer"];

export function DesignInterviewSimulationScreen({ navigation, route }: RunnerProps) {
  const { t } = useTranslation("common");
  const homeResumeContext = useHomeResumeUnavailable();
  const styles = useThemedStyles(createStyles);
  const [projection, setProjection] = useState<DesignSimulationProjection | null>(null);
  const [responses, setResponses] = useState<Partial<Record<DesignSimulationStage, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [, setDrainRevision] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const next = await getDesignInterviewSimulationProjection();
      setProjection(next);
      setResponses((current) => Object.keys(current).length ? current : { ...next.responsesByStage });
    } catch (cause) {
      if (cause instanceof DesignInterviewSimulationExpiredError) {
        navigation.replace(ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT, { sessionId: cause.sessionId });
        return;
      }
      throw cause;
    }
  }, [navigation]);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const drainRef = useRef<DesignSimulationDraftDrain | null>(null);
  if (!drainRef.current) {
    drainRef.current = new DesignSimulationDraftDrain(
      saveDesignInterviewSimulationStage,
      async () => { try { await refreshRef.current(); } catch (cause) { setError(describeOperationalFailure(cause, t("Simulation state is unavailable."))); } },
      () => setDrainRevision((revision) => revision + 1),
    );
  }
  const drain = drainRef.current;

  useFocusEffect(useCallback(() => {
    let live = true;
    void openDesignInterviewSimulation({ trackId: route.params.trackId, profileId: route.params.profileId, expectedSessionId: route.params.expectedSessionId })
      .then((next) => {
        if (!live) return;
        if (route.params.expectedSessionId === next.session.id && next.session.trackId === route.params.trackId
          && next.session.modeId === "design-interview-simulation") {
          homeResumeContext?.clearAfterSuccessfulResume(next.session.id);
        }
        setProjection(next);
        setResponses({ ...next.responsesByStage });
        drain.seedDurable(next.responsesByStage);
      })
      .catch((cause) => {
        if (!live) return;
        if (cause instanceof DesignInterviewSimulationExpiredError) navigation.replace(ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT, { sessionId: cause.sessionId });
        else setError(describeOperationalFailure(cause, t("Design Interview Simulation is unavailable.")));
      });
    const interval = setInterval(() => { void refresh().catch((cause) => setError(describeOperationalFailure(cause, t("Simulation state is unavailable.")))); }, 1000);
    return () => { live = false; clearInterval(interval); void drain.flush().catch((cause) => setError(describeOperationalFailure(cause, t("Your response could not be saved.")))); };
  }, [drain, homeResumeContext, navigation, refresh, route.params.expectedSessionId, route.params.profileId, route.params.trackId, t]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") void drain.flush().catch((cause) => setError(describeOperationalFailure(cause, t("Your response could not be saved."))));
      else void refresh().catch((cause) => setError(describeOperationalFailure(cause, t("Simulation state is unavailable."))));
    });
    return () => { subscription.remove(); void drain.flush().catch(() => undefined); };
  }, [drain, refresh, t]);

  function change(stageId: DesignSimulationStage, value: string) {
    setResponses((current) => ({ ...current, [stageId]: value }));
    setError(null);
    void drain.request(stageId, value).catch((cause) => setError(describeOperationalFailure(cause, t("Your response could not be saved."))));
  }
  function retrySave() {
    if (projection?.operation.kind !== "save_failed" || projection.operation.error.allowedAction !== "retry_same_command") return;
    setError(null);
    void retryDesignInterviewSimulationSave().then(async () => {
      const next = await getDesignInterviewSimulationProjection();
      setProjection(next);
      setResponses({ ...next.responsesByStage, ...drain.getDirtyValues() });
      drain.acceptReconciled(next.responsesByStage);
      setError(null);
    }).catch((cause) => setError(describeOperationalFailure(cause, t("Your response could not be saved."))));
  }
  function useResponseAsNewSave() {
    if (projection?.operation.kind !== "stale_revision") return;
    drain.releaseAfterExplicitNewCommand();
    void resumeDesignInterviewSimulationAfterStaleConflict().then(refresh).catch((cause) => setError(describeOperationalFailure(cause, t("The saved response changed."))));
  }
  async function reconcileSave() {
    try {
      const result = await reconcileDesignInterviewSimulationSave();
      if (result !== "verified") throw new Error("The exact saved response could not be confirmed.");
      const next = await getDesignInterviewSimulationProjection();
      setProjection(next);
      setResponses({ ...next.responsesByStage, ...drain.getDirtyValues() });
      drain.acceptReconciled(next.responsesByStage);
      setError(null);
    } catch (cause) { setError(describeOperationalFailure(cause, t("The exact saved response could not be confirmed."))); }
  }
  async function finish() {
    try {
      await drain.flush();
      await finishDesignInterviewSimulation();
      navigation.replace(ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT, { sessionId: projection!.session.id });
    } catch (cause) {
      if (cause instanceof DesignInterviewSimulationExpiredError) navigation.replace(ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT, { sessionId: cause.sessionId });
      else setError(describeOperationalFailure(cause, t("Complete all four stages before finishing.")));
      await refresh().catch(() => undefined);
    }
  }

  if (error && !projection) return <Screen><EmptyState title={t("Simulation unavailable")} description={error} actionLabel={t("Back to Practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { trackId: route.params.trackId })} /></Screen>;
  if (!projection) return <Screen><Text style={styles.title}>{t("Design Interview Simulation")}</Text><Text>{t("Loading simulation…")}</Text></Screen>;
  const complete = STAGES.every((stage) => (responses[stage] ?? "").trim().length > 0);
  const saving = drain.isSaving();
  const uncertainSave = projection.operation.kind === "save_failed" && projection.operation.error.allowedAction === "reconcile";
  const retryableSave = projection.operation.kind === "save_failed" && projection.operation.error.allowedAction === "retry_same_command";
  const staleConflict = projection.operation.kind === "stale_revision";
  const acceptedFinalization = ["frozen", "finalization_journal_pending", "materializing", "verifying", "verified_pending_clear", "finalization_journal_failed", "materialization_failed", "verification_failed", "recovery_required"].includes(projection.operation.kind);
  const finalizationRecovery = ["finalization_journal_failed", "materialization_failed", "verification_failed", "recovery_required"].includes(projection.operation.kind);
  const finalizationCanResume = projection.operation.kind === "frozen" || ("error" in projection.operation &&
    projection.operation.error.operation === "simulation_finalization" &&
    ["recover", "reconcile", "retry_same_command"].includes(projection.operation.error.allowedAction));
  const editingLocked = uncertainSave || staleConflict || drain.isBlocked() || acceptedFinalization;
  return <Screen scroll edges={["top", "bottom"]}>
    <View style={styles.header}><Button disabled={acceptedFinalization} onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { trackId: route.params.trackId })} variant="ghost">{t("Leave")}</Button><Text style={styles.timer}>{formatRemaining(projection.remainingMs)}</Text></View>
    <Text style={styles.title} testID={runtimeSelectors.designSimulation.root(projection.session.id)}>{projection.profile.familyConfig.title}</Text>
    <Text style={styles.brief}>{projection.profile.familyConfig.brief}</Text>
    {acceptedFinalization ? <View accessibilityRole="alert" style={styles.stage}>
      <Text style={styles.stageTitle}>{t(finalizationRecovery ? "Finalization incomplete" : "Finalizing simulation")}</Text>
      <Text>{t("Your session is frozen and saved responses are preserved.")}</Text>
      {finalizationCanResume ? <Text>{t("Resume finalization before any results are shown.")}</Text> : null}
    </View> : null}
    {STAGES.map((stageId) => {
      const stage = projection.profile.familyConfig.stages.find((candidate) => candidate.stageId === stageId)!;
      return <View key={stageId} style={styles.stage}>
        <Text style={styles.stageTitle}>{stage.title}</Text>
        <TextInput accessibilityLabel={stage.title} editable={!editingLocked} multiline onChangeText={(value) => change(stageId, value)} onEndEditing={() => void drain.flush().catch((cause) => setError(describeOperationalFailure(cause, t("Your response could not be saved."))))} placeholder={t("Your response")} style={styles.input} testID={runtimeSelectors.designSimulation.stageResponse(projection.session.id, stageId)} textAlignVertical="top" value={responses[stageId] ?? ""} />
        <Text style={styles.completeness}>{(responses[stageId] ?? "").trim() ? t("Complete") : t("Required")}</Text>
      </View>;
    })}
    <Text accessibilityLiveRegion="polite" testID={runtimeSelectors.designSimulation.saveStatus(projection.session.id, saving ? "saving" : uncertainSave ? "pending" : drain.isSaved(responses) ? "saved" : "pending")}>{saving ? t("Saving…") : uncertainSave ? t("The saved response could not be confirmed.") : drain.isSaved(responses) ? t("Saved") : t("Unsaved changes")}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {staleConflict ? <Text accessibilityRole="alert" style={styles.error}>{t("The saved response changed.")} {t("Your answer is still here. Review it before saving it as a new response.")}</Text> : null}
    {uncertainSave ? <Button onPress={() => void reconcileSave()} testID={runtimeSelectors.designSimulation.retrySave(projection.session.id)} variant="secondary">{t("Check saved response")}</Button> : null}
    {retryableSave ? <Button onPress={retrySave} testID={runtimeSelectors.designSimulation.retrySave(projection.session.id)} variant="secondary">{t("Retry save")}</Button> : null}
    {staleConflict ? <Button onPress={useResponseAsNewSave} variant="secondary">{t("Keep editing")}</Button> : null}
    <Button disabled={!complete || saving || editingLocked || !drain.isSaved(responses)} loading={saving} onPress={() => void finish()} testID={runtimeSelectors.designSimulation.finish(projection.session.id)}>{t("Finish simulation")}</Button>
    {acceptedFinalization
      ? finalizationCanResume ? <Button onPress={() => void recoverDesignInterviewSimulationOperation().then(refresh).catch((cause) => setError(describeOperationalFailure(cause, t("Simulation recovery is unavailable."))))} variant="secondary">{t("Resume finalization")}</Button> : null
      : <Button onPress={() => void recoverDesignInterviewSimulationOperation().then(refresh).catch((cause) => setError(describeOperationalFailure(cause, t("Simulation recovery is unavailable."))))} variant="ghost">{t("Refresh saved responses")}</Button>}
  </Screen>;
}

export function DesignInterviewSimulationResultScreen({ navigation, route }: ResultProps) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const [result, setResult] = useState<DesignSimulationResultProjection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => getDesignInterviewSimulationResult(route.params.sessionId).then(setResult).catch((cause) => setError(describeOperationalFailure(cause, t("The simulation result is unavailable.")))), [route.params.sessionId, t]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <Screen edges={["top", "bottom"]}><EmptyState title={t("Simulation result unavailable")} description={error} actionLabel={t("Back to Practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!result) return <Screen edges={["top", "bottom"]}><Text>{t("Loading result…")}</Text></Screen>;
  return <Screen scroll edges={["top", "bottom"]}>
    <Text style={styles.title} testID={runtimeSelectors.designSimulation.result(result.sessionId)}>{t("Simulation complete")}</Text>
    {result.reviewConflict ? <ReviewCycleConflictNotice /> : null}
    <Text style={styles.brief}>{result.profile.familyConfig.title}</Text>
    {STAGES.map((stageId) => <View key={stageId} style={styles.resultRow}><Text style={styles.stageTitle}>{result.profile.familyConfig.stages.find((stage) => stage.stageId === stageId)?.title}</Text><Text style={styles.completeness}>{result.stageCompleteness[stageId] ? t("Complete") : t("Incomplete")}</Text></View>)}
    <Button onPress={() => navigation.navigate(ROUTES.DESIGN_INTERVIEW_SIMULATION_REVIEW, { sessionId: result.sessionId })}>{t("Review responses")}</Button>
    <Button onPress={() => navigation.navigate(ROUTES.PRACTICE_HUB, { trackId: result.trackId })} variant="secondary">{t("Back to Practice")}</Button>
  </Screen>;
}

export function DesignInterviewSimulationReviewScreen({ navigation, route }: ReviewProps) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const [result, setResult] = useState<DesignSimulationResultProjection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => getDesignInterviewSimulationResult(route.params.sessionId).then(setResult).catch((cause) => setError(describeOperationalFailure(cause, t("The simulation review is unavailable.")))), [route.params.sessionId, t]);
  useEffect(() => { void load(); }, [load]);
  if (error) return <Screen edges={["top", "bottom"]}><EmptyState title={t("Simulation review unavailable")} description={error} actionLabel={t("Back to results")} onActionPress={() => navigation.navigate(ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT, { sessionId: route.params.sessionId })} /></Screen>;
  if (!result) return <Screen edges={["top", "bottom"]}><Text>{t("Loading review…")}</Text></Screen>;
  return <Screen scroll edges={["top", "bottom"]}>
    <View style={styles.header}><Button onPress={() => navigation.navigate(ROUTES.DESIGN_INTERVIEW_SIMULATION_RESULT, { sessionId: result.sessionId })} variant="ghost">{t("Back to result")}</Button></View>
    <Text style={styles.title} testID={runtimeSelectors.designSimulation.review(result.sessionId)}>{t("Response review")}</Text>
    {result.profile.familyConfig.stages.map((stage) => {
      const criterion = result.profile.familyConfig.reviewCriteria.find((candidate) => candidate.stageId === stage.stageId);
      return <View key={stage.stageId} style={styles.stage}>
        <Text style={styles.stageTitle}>{stage.title}</Text>
        <Text style={styles.response}>{result.responsesByStage[stage.stageId] || t("No response")}</Text>
        <Text style={styles.referenceTitle}>{t("Reference criterion")}</Text><Text style={styles.reference}>{criterion?.description}</Text>
      </View>;
    })}
    <Text style={styles.sectionTitle}>{t("Self-assessment reference")}</Text>
    <Text style={styles.reference}>{t("Use these descriptions for your own review. They are not a score or automated assessment.")}</Text>
    {result.profile.familyConfig.rubric.dimensions.map((dimension) => <View key={dimension.dimensionId} style={styles.stage}>
      <Text style={styles.stageTitle}>{dimension.title}</Text>
      {dimension.levels.map((level) => <Text key={level.level} style={styles.reference}><Text style={styles.level}>{level.level}. {level.label}: </Text>{level.description}</Text>)}
    </View>)}
  </Screen>;
}

function formatRemaining(milliseconds: number): string { const total = Math.max(0, Math.ceil(milliseconds / 1000)); return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`; }
const createStyles = (palette: AppColors) => StyleSheet.create({
  brief: { ...typography.body, color: palette.textSecondary, marginBottom: spacing.lg },
  completeness: { ...typography.caption, color: palette.textSecondary, marginTop: spacing.xs },
  error: { ...typography.body, color: palette.danger, marginVertical: spacing.md },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  input: { ...typography.body, backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: 6, borderWidth: 1, color: palette.textPrimary, minHeight: 144, padding: spacing.md },
  level: { ...typography.bodyStrong, color: palette.textPrimary },
  reference: { ...typography.body, color: palette.textSecondary, marginTop: spacing.xs },
  referenceTitle: { ...typography.bodyStrong, color: palette.textPrimary, marginTop: spacing.md },
  response: { ...typography.body, color: palette.textPrimary, marginTop: spacing.sm },
  resultRow: { alignItems: "center", borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md },
  sectionTitle: { ...typography.heading, color: palette.textPrimary, marginBottom: spacing.sm, marginTop: spacing.xl },
  stage: { borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm, paddingBottom: spacing.lg, paddingTop: spacing.md },
  stageTitle: { ...typography.heading, color: palette.textPrimary },
  timer: { ...typography.bodyStrong, color: palette.textPrimary },
  title: { ...typography.title, color: palette.textPrimary, marginBottom: spacing.md },
});
