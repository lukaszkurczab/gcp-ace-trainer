import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { AnswerOption, Button, Card, EmptyState, InfoBlock, Screen, ScreenHeader } from "../../components";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { useApproachChallengeAccess } from "./approachChallengeAccess";
import type { AppColors } from "../../theme";
import { spacing, typography } from "../../theme";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { algorithmTaxonomyStructure } from "../../tracks/coding-interview/generated/algorithmTaxonomyStructure.generated";
import { CODING_INTERVIEW_TRACK_ID } from "../../domain";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { loadActiveTrainingSession, loadTrainingAttempts } from "../../application/learningReadModels";
import { resumeActiveTrainingSession } from "../../application/trainingLifecycle/applicationLifecycle";
import { projectLearningEvidence } from "../../application/learningPlan/learningEvidenceProjection";
import { captureProfileReadFence } from "../../application/profileReadFence";
import { confirmApproachChallengeShortening, type ApproachChallengeSelection, type ApproachChallengeSelectionSettings } from "../../application/coding-interview/approachChallengeSelection";
import { advanceApproachChallengeStage, completeApproachChallengeSession, getApproachChallengeDetailedHistory, getApproachChallengeHistory, getApproachChallengeStageProjection, recoverApproachChallengeOperation, retryApproachChallengeStageSubmission, selectCurrentApproachChallengeProblems, startApproachChallengeSession, submitApproachChallengeStage, type ApproachChallengeDetailedHistory, type ApproachChallengeHistoryEntry, type ApproachChallengeStageProjection } from "../../application/coding-interview";
import { detailLines } from "./feedbackDetails";
import { resolveApproachChallengeEntry } from "./approachChallengeEntry";
import { APPROACH_CHALLENGE_BLUEPRINT } from "../../application/coding-interview/approachChallengeSelection";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.APPROACH_CHALLENGE>;
type Settings = ApproachChallengeSelectionSettings & Readonly<{ selectedFamilyIds: readonly string[] }>;
type Model = { kind: "setup"; selection: ApproachChallengeSelection } | { kind: "session"; stage: ApproachChallengeStageProjection } | { kind: "history"; rows: readonly ApproachChallengeHistoryEntry[] } | { kind: "detail"; detail: ApproachChallengeDetailedHistory } | { kind: "unavailable"; reason: string };
const DEFAULT_SETTINGS: Settings = Object.freeze({ mode: "auto", requestedProblemCount: 5, difficulties: ["easy", "medium"] as const, selectedFamilyIds: [] as const });

/** UI for the complete approach plus complexity exercise. All answers, scoring, pins and resume state stay in the ACM facade. */
export function ApproachChallengeScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const account = useApproachChallengeAccess();
  const { settings: appSettings, settingsUnavailable, ready: preferencesReady, setApproachChallengeSettings } = useAppPreferences();
  const [settings, setSettings] = useState<Settings>(appSettings?.approachChallenge ?? DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  const [model, setModel] = useState<Model | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shortening, setShortening] = useState(false);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [entryResolved, setEntryResolved] = useState(false);
  const [recoveryAction, setRecoveryAction] = useState<"check" | "retry" | null>(null);
  const setupReadGeneration = useRef(0);
  const busyRef = useRef(false);
  const preferencesLoadedRef = useRef(false);
  const entryKindRef = useRef<"pending" | "history" | "session" | "setup" | "conflict">("pending");

  const readStage = useCallback(async () => {
    const stage = await getApproachChallengeStageProjection();
    if (stage.kind !== "ready") throw new Error(stage.reason);
    setSelectedOption(readSelectedOption(stage.interaction.model));
    setModel({ kind: "session", stage });
  }, []);

  const loadSetup = useCallback(async (selectionSettings: Settings = settingsRef.current) => {
    const generation = ++setupReadGeneration.current;
    const assertProfile = captureProfileReadFence();
    const track = contentPackageRuntimeOwner.getPreparedDiscovery(CODING_INTERVIEW_TRACK_ID).track;
    const attempts = await loadTrainingAttempts();
    assertProfile();
    const completion = projectLearningEvidence({ profile: track, attempts: attempts.value, reviews: [], now: new Date().toISOString() }).completion;
    const currentAccess = account.readCurrentPremiumAccess();
    const access = currentAccess === "allowed" ? "premium" : currentAccess === "denied" ? "free" : "unknown";
    const selection = selectCurrentApproachChallengeProblems({ completion, access, settings: selectionSettings });
    assertProfile();
    if ("kind" in selection) throw new Error(selection.reason);
    if (generation === setupReadGeneration.current && entryKindRef.current === "setup") setModel({ kind: "setup", selection });
  }, [account.readCurrentPremiumAccess]);

  useEffect(() => {
    if (!entryResolved || route.params?.sessionId || entryKindRef.current !== "setup" || !preferencesReady || settingsUnavailable || preferencesLoadedRef.current) return;
    preferencesLoadedRef.current = true;
    const saved = appSettings?.approachChallenge ?? DEFAULT_SETTINGS;
    settingsRef.current = saved;
    setSettings(saved);
    setSettingsHydrated(true);
    void loadSetup(saved).catch((error) => setNotice(t("Approach Challenge settings could not be loaded.")));
  }, [appSettings?.approachChallenge, entryResolved, loadSetup, preferencesReady, route.params?.sessionId, settingsUnavailable, t]);

  useEffect(() => {
    let live = true;
    const sessionId = route.params?.sessionId;
    entryKindRef.current = sessionId ? "history" : "pending";
    setupReadGeneration.current += 1;
    setEntryResolved(false);
    void (async () => {
      try {
        const entry = await resolveApproachChallengeEntry({
          requestedSessionId: sessionId,
          loadActiveSession: loadActiveTrainingSession,
          getExactHistory: getApproachChallengeDetailedHistory,
          resumeActiveSession: async () => { await resumeActiveTrainingSession(); },
          readActiveStage: getApproachChallengeStageProjection,
        });
        if (!live) return;
        if (entry.kind === "history") {
          entryKindRef.current = "history";
          if (entry.detail.kind !== "ready") throw new Error("artifact_unavailable");
          setModel({ kind: "detail", detail: entry.detail });
        } else if (entry.kind === "session") {
          entryKindRef.current = "session";
          if (entry.stage.kind !== "ready") throw new Error(entry.stage.reason);
          setSelectedOption(readSelectedOption(entry.stage.interaction.model));
          setModel({ kind: "session", stage: entry.stage });
        } else if (entry.kind === "conflict") {
          entryKindRef.current = "conflict";
          setModel({ kind: "unavailable", reason: "active_session_conflict" });
        } else {
          entryKindRef.current = "setup";
          if (preferencesLoadedRef.current) {
            void loadSetup(settingsRef.current).catch(() => setNotice(t("Approach Challenge settings could not be loaded.")));
          }
        }
      } catch (error) {
        if (!live) return;
        if (!sessionId) entryKindRef.current = "conflict";
        setModel({ kind: "unavailable", reason: "artifact_unavailable" });
      } finally {
        if (live) setEntryResolved(true);
      }
    })();
    return () => { live = false; };
  }, [loadSetup, route.params?.sessionId, t]);

  const persistSettings = async (next: Settings) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try { if (!setApproachChallengeSettings) throw new Error("settings_unavailable"); await setApproachChallengeSettings(next); settingsRef.current = next; setSettings(next); await loadSetup(next); }
    catch { setNotice(t("Your Approach Challenge settings could not be saved.")); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const start = async (confirmedShortening = false) => {
    if (model?.kind !== "setup" || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setNotice(null);
    try {
      let selection = model.selection;
      if (selection.status === "confirmation_required") {
        if (!confirmedShortening) { setShortening(true); return; }
        selection = confirmApproachChallengeShortening(selection, true);
      }
      if (selection.status !== "ready") throw new Error(selection.reason ?? "selection_unavailable");
      const prepared = await startApproachChallengeSession(selection);
      if ("kind" in prepared && prepared.kind === "unavailable") throw new Error(prepared.reason);
      await readStage();
    } catch { setNotice(t("Approach Challenge could not start. Check your access and selection, then try again.")); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const refreshHistory = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try { setModel({ kind: "history", rows: await getApproachChallengeHistory() }); }
    catch { setModel({ kind: "unavailable", reason: "history_unavailable" }); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const finish = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await completeApproachChallengeSession();
      setModel({ kind: "history", rows: await getApproachChallengeHistory() });
    } catch {
      setRecoveryAction("check");
      setNotice(t("The saved answer state needs checking before continuing."));
    } finally { busyRef.current = false; setBusy(false); }
  };
  const submit = async () => {
    if (model?.kind !== "session" || !selectedOption || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setNotice(null);
    try { const interaction = model.stage.interaction; await submitApproachChallengeStage({ type: interaction.interactionType, optionId: selectedOption }); setRecoveryAction(null); await readStage(); }
    catch (error) { setRecoveryAction("check"); setNotice(t("The saved answer state needs checking before continuing.")); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const advance = async () => {
    if (model?.kind !== "session" || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setNotice(null);
    try {
      await advanceApproachChallengeStage();
      await readStage();
    } catch (error) { setRecoveryAction("check"); setNotice(t("The saved answer state needs checking before continuing.")); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const recover = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try { await recoverApproachChallengeOperation(); await readStage(); setRecoveryAction(null); setNotice(null); }
    catch { setRecoveryAction("retry"); setNotice(t("The exact saved operation is still pending. Retry only that operation.")); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const retryExactSave = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try { await retryApproachChallengeStageSubmission(); await readStage(); setRecoveryAction(null); setNotice(null); }
    catch { setRecoveryAction("check"); setNotice(t("The saved operation could not be confirmed.")); }
    finally { busyRef.current = false; setBusy(false); }
  };

  if (!entryResolved) return <Screen edges={["top", "bottom"]}><ActivityIndicator accessibilityLabel={t("Preparing session")} /></Screen>;
  const sessionIndependentEntry = entryKindRef.current === "history" || entryKindRef.current === "session";
  if (settingsUnavailable && !sessionIndependentEntry) return <Screen edges={["top", "bottom"]}><EmptyState title={t("Approach Challenge settings unavailable")} description={t("Your saved settings could not be read. Try again after restoring local storage.")} actionLabel={t("Back to practice")} onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)} /></Screen>;
  if (!sessionIndependentEntry && !preferencesReady && !settingsUnavailable) return <Screen edges={["top", "bottom"]}><ActivityIndicator accessibilityLabel={t("Preparing session")} /></Screen>;
  if (!model) return <Screen edges={["top", "bottom"]}><ActivityIndicator accessibilityLabel={t("Preparing session")} /></Screen>;
  if (model.kind === "setup" && !settingsHydrated) return <Screen edges={["top", "bottom"]}><ActivityIndicator accessibilityLabel={t("Preparing session")} /></Screen>;
  if (model.kind === "unavailable") return <Screen backAction={{ destinationLabel: t("Practice"), onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} edges={["top", "bottom"]}><EmptyState title={t(model.reason === "active_session_conflict" ? "Another session is active" : "Approach Challenge unavailable")} description={t(model.reason === "active_session_conflict" ? "Finish or resume your active session before starting Approach Challenge." : "This session or its saved content is unavailable. Your saved answers have not been changed.")} actionLabel={t(model.reason === "active_session_conflict" ? "Go to Home" : "Back to practice")} onActionPress={() => navigation.navigate(model.reason === "active_session_conflict" ? ROUTES.HOME : ROUTES.PRACTICE_HUB)} /></Screen>;
  if (model.kind === "setup") {
    const selection = model.selection;
    return <Screen backAction={{ destinationLabel: t("Practice"), onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} edges={["top", "bottom"]}>
      <ScreenHeader title={t("Approach Challenge")} description={t("Explain a solution first, then analyze its complexity.")} />
      <Card><Text style={styles.label}>{t("Number of problems")}</Text><View style={styles.row}>{APPROACH_CHALLENGE_BLUEPRINT.requestedProblemCounts.map((count) => <Button key={count} accessibilityRole="radio" accessibilityState={{ selected: settings.requestedProblemCount === count }} accessibilityLabel={t("{{count}} problems", { count })} variant={settings.requestedProblemCount === count ? "primary" : "secondary"} onPress={() => void persistSettings({ ...settings, requestedProblemCount: count })}>{t("{{count}} problems", { count })}</Button>)}</View></Card>
      <Card><Text style={styles.label}>{t("Selection method")}</Text><View style={styles.row}><Button accessibilityRole="radio" accessibilityState={{ selected: settings.mode === "auto" }} variant={settings.mode === "auto" ? "primary" : "secondary"} onPress={() => void persistSettings({ ...settings, mode: "auto" })}>{t("Automatic")}</Button><Button accessibilityRole="radio" accessibilityState={{ selected: settings.mode === "manual" }} variant={settings.mode === "manual" ? "primary" : "secondary"} onPress={() => void persistSettings({ ...settings, mode: "manual" })}>{t("Manual")}</Button></View><Text style={styles.copy}>{settings.mode === "auto" ? t("Automatic selection uses completed topic families.") : t("Manual selection uses the families you choose.")}</Text></Card>
      <Card><Text style={styles.label}>{t("Difficulty")}</Text><View style={styles.row}>{APPROACH_CHALLENGE_BLUEPRINT.supportedDifficulties.map((difficulty) => <Button key={difficulty} accessibilityRole="checkbox" accessibilityState={{ selected: settings.difficulties.includes(difficulty) }} variant={settings.difficulties.includes(difficulty) ? "primary" : "secondary"} onPress={() => { const difficulties = settings.difficulties.includes(difficulty) ? settings.difficulties.filter((value) => value !== difficulty) : [...settings.difficulties, difficulty]; if (difficulties.length) void persistSettings({ ...settings, difficulties }); }}>{t(difficulty[0]!.toUpperCase() + difficulty.slice(1))}</Button>)}</View></Card>
      {selection.status === "ready" || selection.status === "confirmation_required" ? <InfoBlock tone={selection.status === "confirmation_required" ? "warning" : "neutral"} title={t("{{actual}} of {{requested}} problems available", { actual: selection.actualProblemCount, requested: selection.requestedProblemCount })} body={selection.status === "confirmation_required" ? t("The available pool is shorter than requested. Confirm to start with this shorter session.") : t("Each problem has two saved stages.")} /> : <InfoBlock tone="warning" title={t("No problems available")} body={t(selectionReasonCopy(selection.reason))} />}
      {settings.mode === "manual" ? <Card><Text style={styles.label}>{t("Required topic families")}</Text>{algorithmTaxonomyStructure.patternFamilies.map((family) => { const selected = settings.selectedFamilyIds?.includes(family.id) ?? false; const label = family.id.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); return <AnswerOption key={family.id} letter={selected ? "✓" : "○"} text={t(label)} accessibilityRole="checkbox" accessibilityLabel={t(label)} state={selected ? "selected" : "default"} onPress={() => { const ids = selected ? settings.selectedFamilyIds?.filter((id) => id !== family.id) ?? [] : [...(settings.selectedFamilyIds ?? []), family.id]; void persistSettings({ ...settings, selectedFamilyIds: ids }); }} />; })}</Card> : null}
      {shortening ? <Card><Text style={styles.copy}>{t("Start with {{count}} available problems?", { count: selection.actualProblemCount })}</Text><View style={styles.row}><Button onPress={() => { setShortening(false); void start(true); }}>{t("Confirm shorter session")}</Button><Button variant="secondary" onPress={() => setShortening(false)}>{t("Cancel")}</Button></View></Card> : null}
      {notice ? <InfoBlock tone="warning" title={t("Could not save settings")} body={notice} /> : null}
      <Button disabled={busy || (selection.status !== "ready" && selection.status !== "confirmation_required")} onPress={() => void start()}>{busy ? t("Starting…") : t("Start session")}</Button>
      <Button variant="secondary" onPress={() => void refreshHistory()}>{t("View history")}</Button>
    </Screen>;
  }
  const preferencesWarning = settingsUnavailable ? <InfoBlock tone="warning" title={t("Approach Challenge settings unavailable")} body={t("Your saved settings could not be read. Try again after restoring local storage.")} /> : null;
  if (model.kind === "session") {
    const stage = model.stage;
    const options = readOptions(stage.interaction.model);
    const finalComplexity = stage.accepted && stage.stage === "complexity" && stage.problemIndex === stage.problemCount;
    return <Screen edges={["top", "bottom"]} footer={<>{recoveryAction ? <><Button disabled={busy} variant="secondary" onPress={() => void recover()}>{t("Check saved answer")}</Button>{recoveryAction === "retry" ? <Button disabled={busy} variant="secondary" onPress={() => void retryExactSave()}>{t("Retry exact save")}</Button> : null}</> : stage.accepted ? <Button disabled={busy} onPress={() => void (finalComplexity ? finish() : advance())}>{t(finalComplexity ? "Finish session" : stage.stage === "approach" ? "Continue to complexity" : "Continue")}</Button> : <Button disabled={busy || !selectedOption} onPress={() => void submit()}>{busy ? t("Saving…") : t("Submit answer")}</Button>}{notice ? <Text accessibilityRole="alert" style={styles.error}>{notice}</Text> : null}</>} footerVariant="session">
      <ScreenHeader title={t("Approach Challenge")} context={t("Problem {{current}} of {{total}} · Step {{step}}/2", { current: stage.problemIndex, total: stage.problemCount, step: stage.stage === "approach" ? 1 : 2 })} />
      {preferencesWarning}
      {stage.stage === "complexity" && stage.methodReveal ? <Card><Text style={styles.label}>{t(stage.methodReveal.title)}</Text><Text style={styles.copy}>{t(stage.methodReveal.description)}</Text></Card> : null}
      <Card><Text style={styles.label}>{t(stage.stage === "approach" ? "Choose an approach" : "Analyze the complexity")}</Text><Text style={styles.prompt}>{stage.prompt}</Text>{stage.constraints.map((constraint, index) => <Text key={`${index}:${constraint}`} style={styles.copy}>• {constraint}</Text>)}</Card>
      {options.map((option, index) => <AnswerOption key={option.id} letter={String.fromCharCode(65 + index)} text={option.text} accessibilityRole="radio" accessibilityLabel={option.text} state={selectedOption === option.id ? "selected" : "default"} disabled={stage.accepted || busy} onPress={() => setSelectedOption(option.id)} testID={`acm6-option-${index}`} />)}
      {stage.accepted && stage.result ? <InfoBlock tone={stage.result.kind === "correct" ? "success" : "warning"} title={t(resultTitle(stage.result.kind))} body={[stage.feedback?.reason ? t(stage.feedback.reason) : "", stage.stage === "complexity" ? feedbackText(stage.feedback?.details) : ""].filter(Boolean).join(" ") || t("{{earned}} of {{maximum}} points", { earned: stage.result.earnedPoints, maximum: stage.result.maxPoints })} /> : null}
    </Screen>;
  }
  if (model.kind === "history") return <Screen backAction={{ destinationLabel: t("Approach Challenge"), onPress: () => navigation.setParams({ sessionId: undefined }) }} edges={["top", "bottom"]}><ScreenHeader title={t("Approach Challenge history")} />{preferencesWarning}{model.rows.length ? model.rows.map((row) => <Card key={row.sessionId}><Text style={styles.label}>{t("{{count}} problems · {{status}}", { count: row.problemCount ?? "—", status: t(row.status) })}</Text><Text style={styles.copy}>{t("Correct {{correct}}, partial {{partial}}, incorrect {{incorrect}} · {{earned}}/{{maximum}} points", { correct: row.correctCount, partial: row.partialCount, incorrect: row.incorrectCount, earned: row.pointsEarned, maximum: row.maxPoints })}</Text>{row.manifestIntegrity === "unavailable" ? <Text style={styles.error}>{t("Pinned session details are unavailable.")}</Text> : null}<Button variant="secondary" onPress={() => navigation.navigate(ROUTES.APPROACH_CHALLENGE, { sessionId: row.sessionId })}>{t("View details")}</Button></Card>) : <EmptyState title={t("No Approach Challenge sessions yet")} description={t("Completed and abandoned sessions will appear here.")} />}</Screen>;
  return (
    <Screen backAction={{ destinationLabel: t("Approach Challenge history"), onPress: () => void refreshHistory() }} edges={["top", "bottom"]}>
      <ScreenHeader title={t("Session details")} context={t("{{count}} problems · {{status}}", { count: model.detail.problems.length, status: t(model.detail.status) })} />
      {preferencesWarning}
      {model.detail.problems.map((problem, index) => (
        <Card key={`${problem.problemId}:${index}`}>
          <Text style={styles.label}>{t("Problem {{number}}", { number: index + 1 })} · {t(problem.difficulty)}</Text>
          {problem.stages.map((stage) => (
            <View key={stage.occurrenceId} style={styles.stage}>
              <Text style={styles.label}>{t(stage.stage === "approach" ? "Approach" : "Complexity")}</Text>
              <Text style={styles.prompt}>{stage.prompt}</Text>
              {stage.response ? <Text style={styles.copy}>{t("Saved answer")}: {readSelectedText(stage.interaction.model) ?? "—"}</Text> : <Text style={styles.copy}>{t("Not answered")}</Text>}
              {stage.result ? <InfoBlock tone={stage.result.kind === "correct" ? "success" : "warning"} title={t(resultTitle(stage.result.kind))} body={[stage.feedback?.reason ? t(stage.feedback.reason) : "", stage.stage === "complexity" ? feedbackText(stage.feedback?.details) : ""].filter(Boolean).join(" ") || t("{{earned}}/{{maximum}} points", { earned: stage.result.earnedPoints, maximum: stage.result.maxPoints })} /> : null}
            </View>
          ))}
          {problem.methodReveal ? <Text style={styles.copy}>{t(problem.methodReveal.title)}: {t(problem.methodReveal.description)}</Text> : null}
        </Card>
      ))}
      <Button variant="secondary" onPress={() => void refreshHistory()}>{t("Back to history")}</Button>
    </Screen>
  );
}

function resultTitle(kind: "correct" | "partial" | "incorrect"): string { return kind === "partial" ? "Almost" : kind === "correct" ? "Correct" : "Incorrect"; }
function readOptions(value: unknown): readonly { id: string; text: string }[] { const renderer = (value as any)?.renderer; return Array.isArray(renderer?.options) ? renderer.options.filter((item: any) => typeof item?.id === "string" && typeof item?.text === "string") : []; }
function readSelectedOption(value: unknown): string | null { const options = readOptions(value); return options.find((item: any) => item.selected)?.id ?? null; }
function readSelectedText(value: unknown): string | null { const options = readOptions(value); return options.find((item: any) => item.selected)?.text ?? null; }
function feedbackText(value: unknown): string { try { return detailLines(value as Parameters<typeof detailLines>[0]).join(" "); } catch { return ""; } }
function selectionReasonCopy(reason: ApproachChallengeSelection["reason"]): string {
  switch (reason) {
    case "empty_pool": return "No problems match these choices. Change your topic families or difficulty.";
    case "completion_unknown": return "Topic completion could not be checked. Try again when your learning data is available.";
    case "unknown_access": return "Premium access could not be checked. Try again when you are online.";
    case "invalid_settings": return "Saved choices are invalid. Update the session settings and try again.";
    case "ambiguous_problem_id": return "The available problem list could not be verified.";
    default: return "The current selection is unavailable. Check your settings or access and try again.";
  }
}
const createStyles = (colors: AppColors) => StyleSheet.create({ copy: { ...typography.body, color: colors.textSecondary }, error: { ...typography.body, color: colors.danger }, label: { ...typography.bodyStrong, color: colors.textPrimary }, prompt: { ...typography.body, color: colors.textPrimary, marginTop: spacing.sm }, row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm }, stage: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md } });
