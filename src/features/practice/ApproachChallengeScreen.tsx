import { beginStartupSpan } from "../../infrastructure/diagnostics/startupTrace";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { usePreventRemove, type NavigationAction } from "@react-navigation/native";
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
import { loadActiveTrainingSession } from "../../application/learningReadModels";
import { resumeActiveTrainingSession } from "../../application/trainingLifecycle/applicationLifecycle";
import { captureProfileReadFence } from "../../application/profileReadFence";
import { confirmApproachChallengeShortening, type ApproachChallengeSelection } from "../../application/coding-interview/approachChallengeSelection";
import { advanceApproachChallengeStage, completeApproachChallengeSession, getApproachChallengeDetailedHistory, getApproachChallengeStageProjection, recoverApproachChallengeOperation, retryApproachChallengeStageSubmission, selectCurrentApproachChallengeProblems, startApproachChallengeSession, submitApproachChallengeStage, type ApproachChallengeDetailedHistory, type ApproachChallengeStageProjection } from "../../application/coding-interview";
import { ApproachChallengeFeedback } from "./ApproachChallengeFeedback";
import { ApproachChallengeSummary } from "./ApproachChallengeSummary";
import { approachChallengeOptionState, readOptions, readSelectedOption, resultTitle } from "./approachChallengePresentation";
import { resolveApproachChallengeEntry } from "./approachChallengeEntry";
import { ALL_APPROACH_CHALLENGE_FAMILY_IDS, normalizeApproachChallengeSetupSettings, type ApproachChallengeSetupSettings } from "./approachChallengeSetupSettings";
import { PracticeSetupSectionHeader, PracticeSetupSegment, PracticeSetupSegmentGroup } from "./PracticeSetupControls";
import { ApproachChallengeQuestion } from "./ApproachChallengeQuestion";
import { APPROACH_CHALLENGE_BLUEPRINT } from "../../application/coding-interview/approachChallengeSelection";
import { endApproachChallengeSession, pauseApproachChallengeSession, type ApproachChallengeEndAction, type ApproachChallengePauseAction } from "../../application/coding-interview/approachChallengeSessionExit";
import { APPROACH_CHALLENGE_TRACK_ID } from "../../content/canonical/approachChallengeProblem";
import { ActionBar, DurabilityNotice, ExitModal } from "./PracticeSessionSurface";
import type { PracticeSurfacePhase } from "./practiceSessionPresentation";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.APPROACH_CHALLENGE>;
type Settings = ApproachChallengeSetupSettings;
type Model = { kind: "setup"; selection: ApproachChallengeSelection } | { kind: "session"; stage: ApproachChallengeStageProjection } | { kind: "detail"; detail: ApproachChallengeDetailedHistory } | { kind: "unavailable"; reason: string };
const NO_ADDITIONAL_CONSTRAINTS: readonly string[] = Object.freeze([]);


/** UI for the complete approach plus complexity exercise. All answers, scoring, pins and resume state stay in the ACM facade. */
export function ApproachChallengeScreen({ navigation, route }: Props) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const account = useApproachChallengeAccess();
  const { settings: appSettings, settingsUnavailable, ready: preferencesReady, setApproachChallengeSettings } = useAppPreferences();
  const [settings, setSettings] = useState<Settings>(() => normalizeApproachChallengeSetupSettings(appSettings?.approachChallenge));
  const settingsRef = useRef(settings);
  const [model, setModel] = useState<Model | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shortening, setShortening] = useState(false);
  const [familyPickerExpanded, setFamilyPickerExpanded] = useState(false);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [entryResolved, setEntryResolved] = useState(false);
  const [recoveryAction, setRecoveryAction] = useState<"check" | "retry" | null>(null);
  const [endRecovery, setEndRecovery] = useState<ApproachChallengeEndAction | "blocked" | null>(null);
  const [pauseRecovery, setPauseRecovery] = useState<ApproachChallengePauseAction | "blocked" | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const exitOwner = useRef<{ sessionId: string; assertCurrent: () => void } | null>(null);
  const permitRouteExit = useRef(false);
  const pendingRouteAction = useRef<NavigationAction | null>(null);
  const setupReadGeneration = useRef(0);
  const busyRef = useRef(false);
  const preferencesLoadedRef = useRef(false);
  const entryKindRef = useRef<"pending" | "history" | "session" | "setup" | "conflict">("pending");

  usePreventRemove(!permitRouteExit.current && model?.kind === "session", ({ data }) => {
    if (permitRouteExit.current) { navigation.dispatch(data.action); return; }
    if (busyRef.current || recoveryAction || endRecovery || pauseRecovery) return;
    pendingRouteAction.current = data.action;
    requestLeaveSession();
  });

  const readStage = useCallback(async () => {
    const stage = await getApproachChallengeStageProjection();
    if (stage.kind !== "ready") throw new Error(stage.reason);
    setSelectedOption(readSelectedOption(stage.interaction.model));
    setModel({ kind: "session", stage });
  }, []);

  const loadSetup = useCallback(async (selectionSettings: Settings = settingsRef.current) => {
    const generation = ++setupReadGeneration.current;
    const assertProfile = captureProfileReadFence();
    const currentAccess = account.readCurrentPremiumAccess();
    const access = currentAccess === "allowed" ? "premium" : currentAccess === "denied" ? "free" : "unknown";
    const selection = selectCurrentApproachChallengeProblems({ completion: { kind: "unknown" }, access, settings: selectionSettings });
    assertProfile();
    if ("kind" in selection) throw new Error(selection.reason);
    if (generation === setupReadGeneration.current && entryKindRef.current === "setup") setModel({ kind: "setup", selection });
  }, [account.readCurrentPremiumAccess]);

  useEffect(() => {
    if (!entryResolved || route.params?.sessionId || entryKindRef.current !== "setup" || !preferencesReady || settingsUnavailable || preferencesLoadedRef.current) return;
    preferencesLoadedRef.current = true;
    const saved = normalizeApproachChallengeSetupSettings(appSettings?.approachChallenge);
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

  const finish = async () => {
    if (model?.kind !== "session" || busyRef.current || exitOpen || endRecovery || pauseRecovery) return;
    const sessionId = model.stage.sessionId;
    const assertCurrent = captureProfileReadFence();
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await completeApproachChallengeSession(sessionId);
      assertCurrent();
      permitRouteExit.current = true;
      pendingRouteAction.current = null;
      navigation.replace(ROUTES.APPROACH_CHALLENGE, { sessionId });
    } catch {
      setRecoveryAction("check");
      setNotice(t("The saved answer state needs checking before continuing."));
    } finally { busyRef.current = false; setBusy(false); }
  };
  const submit = async () => {
    if (model?.kind !== "session" || !selectedOption || busyRef.current || exitOpen || endRecovery || pauseRecovery) return;
    const end = beginStartupSpan("practice_submit_handler");
    busyRef.current = true;
    setBusy(true); setNotice(null);
    try { const interaction = model.stage.interaction; await submitApproachChallengeStage({ type: interaction.interactionType, optionId: selectedOption }); setRecoveryAction(null); await readStage(); }
    catch (error) { setRecoveryAction("check"); setNotice(t("The saved answer state needs checking before continuing.")); }
    finally { busyRef.current = false; setBusy(false); end(); }
  };
  const advance = async () => {
    if (model?.kind !== "session" || busyRef.current || exitOpen || endRecovery || pauseRecovery) return;
    const end = beginStartupSpan("practice_advance_handler");
    busyRef.current = true;
    setBusy(true); setNotice(null);
    try {
      await advanceApproachChallengeStage();
      await readStage();
    } catch (error) { setRecoveryAction("check"); setNotice(t("The saved answer state needs checking before continuing.")); }
    finally { busyRef.current = false; setBusy(false); end(); }
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

  const endSession = async (action: ApproachChallengeEndAction, owner: { sessionId: string; assertCurrent: () => void }) => {
    if (busyRef.current || recoveryAction || pauseRecovery) return;
    busyRef.current = true;
    setExitOpen(false); setBusy(true); setNotice(null); setEndRecovery(action);
    exitOwner.current = owner;
    try {
      const result = await endApproachChallengeSession(owner.sessionId, action, owner.assertCurrent);
      owner.assertCurrent();
      if (result.kind === "ended") {
        permitRouteExit.current = true;
        pendingRouteAction.current = null;
        navigation.replace(ROUTES.APPROACH_CHALLENGE, { sessionId: result.session.id });
      } else {
        setEndRecovery(result.nextAction === "end" ? null : result.nextAction);
        setNotice(t("We couldn't end the session. Try again."));
      }
    } catch {
      setEndRecovery("blocked");
      setNotice(t("We couldn't end the session yet. Restore the session to continue."));
    } finally { busyRef.current = false; setBusy(false); }
  };
  function requestLeaveSession() {
    if (model?.kind !== "session" || busyRef.current || recoveryAction || endRecovery || pauseRecovery) return;
    exitOwner.current = { sessionId: model.stage.sessionId, assertCurrent: captureProfileReadFence() };
    setExitOpen(true);
  }
  const dismissExit = () => { if (busyRef.current) return; setExitOpen(false); pendingRouteAction.current = null; exitOwner.current = null; };
  const leaveRunner = () => {
    permitRouteExit.current = true;
    const action = pendingRouteAction.current;
    pendingRouteAction.current = null;
    if (action) navigation.dispatch(action);
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(ROUTES.PRACTICE_HUB);
  };
  const pauseSession = async (action: ApproachChallengePauseAction, owner: { sessionId: string; assertCurrent: () => void }) => {
    if (busyRef.current || recoveryAction || endRecovery) return;
    busyRef.current = true;
    setExitOpen(false); setBusy(true); setNotice(null); setPauseRecovery(action);
    try {
      const result = await pauseApproachChallengeSession(owner.sessionId, action, owner.assertCurrent);
      owner.assertCurrent();
      if (result.kind === "paused") leaveRunner();
      else {
        setPauseRecovery(result.nextAction);
        setNotice(t("The session could not be paused. It remains active; try leaving again."));
      }
    } catch {
      setPauseRecovery("blocked");
      setNotice(t("The session could not be paused. It remains active; try leaving again."));
    } finally { busyRef.current = false; setBusy(false); }
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
    const noFamilies = settings.selectedFamilyIds.length === 0;
    const selectionError = !noFamilies && selection.status === "unavailable" ? t(selectionReasonCopy(selection.reason)) : null;
    return <Screen backAction={{ destinationLabel: t("Practice"), onPress: () => navigation.navigate(ROUTES.PRACTICE_HUB) }} edges={["top", "bottom"]}
      footerVariant="sticky" footer={<View style={styles.setupFooter}>
        {selectionError ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={[styles.copy, styles.error]}>{selectionError}</Text> : null}
        <Button disabled={busy || noFamilies || (selection.status !== "ready" && selection.status !== "confirmation_required")} onPress={() => void start()}>{busy ? t("Starting…") : t("Start session")}</Button>
      </View>}>
      <ScreenHeader variant="practiceSetup" title={t("Approach Challenge")} description={t("Choose the number of problems, difficulty, and topic families for this session.")} />
      <View style={styles.setupSection}>
        <PracticeSetupSectionHeader title={t("Number of problems")} subtitle={t("Each problem has two steps: approach and complexity.")} />
        <PracticeSetupSegmentGroup accessibilityRole="radiogroup" accessibilityLabel={t("Number of problems")}>
          {APPROACH_CHALLENGE_BLUEPRINT.requestedProblemCounts.map((count) => <PracticeSetupSegment key={count}
            label={String(count)} meta={t("Problems")} accessibilityLabel={t("{{count}} problems", { count })}
            selected={settings.requestedProblemCount === count} disabled={busy}
            onPress={() => void persistSettings({ ...settings, requestedProblemCount: count })} />)}
        </PracticeSetupSegmentGroup>
      </View>
      <View style={styles.setupSection}>
        <PracticeSetupSectionHeader title={t("Difficulty")} subtitle={t("Choose one or more difficulty levels.")} />
        <PracticeSetupSegmentGroup accessibilityLabel={t("Difficulty")}>
          {APPROACH_CHALLENGE_BLUEPRINT.supportedDifficulties.map((difficulty) => <PracticeSetupSegment key={difficulty} role="checkbox" labelWeight="500"
            label={t(difficulty[0]!.toUpperCase() + difficulty.slice(1))} selected={settings.difficulties.includes(difficulty)} disabled={busy}
            onPress={() => {
              const difficulties = settings.difficulties.includes(difficulty) ? settings.difficulties.filter((value) => value !== difficulty) : [...settings.difficulties, difficulty];
              if (difficulties.length) void persistSettings({ ...settings, difficulties });
            }} />)}
        </PracticeSetupSegmentGroup>
      </View>
      <View style={styles.setupSection}>
        <PracticeSetupSectionHeader title={t("Required topic families")} />
        <Text maxFontSizeMultiplier={2} style={styles.copy}>{settings.selectedFamilyIds.length
          ? t("Selected topic families: {{families}}", { families: selectedFamilySummary(settings.selectedFamilyIds, t) })
          : t("No families selected")}</Text>
        {noFamilies ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={[styles.copy, styles.error]}>{t("Select at least 1 family.")}</Text> : null}
        <Button accessibilityState={{ expanded: familyPickerExpanded }} disabled={busy}
          onPress={() => setFamilyPickerExpanded((expanded) => !expanded)} variant="secondary"
        >{t(familyPickerExpanded ? "Collapse topic families" : "Expand topic families")}</Button>
        {familyPickerExpanded ? <>
          <View style={styles.row}>
            <Button variant="ghost" disabled={busy || settings.selectedFamilyIds.length === ALL_APPROACH_CHALLENGE_FAMILY_IDS.length}
              onPress={() => void persistSettings({ ...settings, selectedFamilyIds: ALL_APPROACH_CHALLENGE_FAMILY_IDS })}>{t("Select all")}</Button>
            <Button variant="ghost" disabled={busy || noFamilies}
              onPress={() => void persistSettings({ ...settings, selectedFamilyIds: [] })}>{t("Unselect all")}</Button>
          </View>
          {algorithmTaxonomyStructure.patternFamilies.map((family) => {
            const selected = settings.selectedFamilyIds.includes(family.id);
            const label = familyLabel(family.id);
            return <AnswerOption key={family.id} letter={selected ? "✓" : "○"} text={t(label)} accessibilityRole="checkbox" accessibilityLabel={t(label)}
              state={selected ? "selected" : "default"} disabled={busy} onPress={() => {
                const ids = selected ? settings.selectedFamilyIds.filter((id) => id !== family.id) : [...settings.selectedFamilyIds, family.id];
                void persistSettings({ ...settings, selectedFamilyIds: ids });
              }} />;
          })}
        </> : null}
      </View>
      {selection.status === "confirmation_required" ? <Text maxFontSizeMultiplier={2} style={styles.copy}>{t("The available pool is shorter than requested. Confirm to start with this shorter session.")}</Text> : null}
      {shortening ? <Card><Text style={styles.copy}>{t("Start with {{count}} available problems?", { count: selection.actualProblemCount })}</Text><View style={styles.row}><Button onPress={() => { setShortening(false); void start(true); }}>{t("Confirm shorter session")}</Button><Button variant="secondary" onPress={() => setShortening(false)}>{t("Cancel")}</Button></View></Card> : null}
      {notice ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={[styles.copy, styles.error]}>{notice}</Text> : null}
    </Screen>;
  }
  const preferencesWarning = settingsUnavailable ? <InfoBlock tone="warning" title={t("Approach Challenge settings unavailable")} body={t("Your saved settings could not be read. Try again after restoring local storage.")} /> : null;
  if (model.kind === "session") {
    const stage = model.stage;
    const options = readOptions(stage.interaction.model);
    const finalComplexity = stage.accepted && stage.stage === "complexity" && stage.problemIndex === stage.problemCount;
    const exitBlocked = Boolean(endRecovery || pauseRecovery);
    const blocked = endRecovery === "blocked" || pauseRecovery === "blocked";
    const phase: PracticeSurfacePhase = endRecovery ? busy ? "abandoning" : "abandonment_recovery_required"
      : recoveryAction || pauseRecovery ? "recovery_required" : busy ? "submitting_before_journal" : stage.accepted ? "feedback" : "unanswered";
    let primaryLabel: string;
    let primaryPress: () => void;
    if (blocked) {
      primaryLabel = "Back to practice";
      primaryPress = () => {
        pendingRouteAction.current = null;
        exitOwner.current = null;
        permitRouteExit.current = true;
        navigation.popTo(ROUTES.PRACTICE_HUB);
      };
    } else if (endRecovery) {
      primaryLabel = endRecovery === "retry_command" || endRecovery === "retry_checkpoint" ? "Try ending session again" : "Check session status";
      primaryPress = () => { if (exitOwner.current) void endSession(endRecovery, exitOwner.current); };
    } else if (pauseRecovery) {
      primaryLabel = pauseRecovery === "retry_checkpoint" ? "Try again" : "Check session status";
      primaryPress = () => { if (exitOwner.current) void pauseSession(pauseRecovery, exitOwner.current); };
    } else if (recoveryAction) {
      primaryLabel = "Check saved answer";
      primaryPress = () => { void recover(); };
    } else {
      primaryLabel = !stage.accepted ? "Submit answer" : finalComplexity ? "Finish session" : stage.stage === "approach" ? "Continue to complexity" : "Continue";
      primaryPress = () => { void (!stage.accepted ? submit() : finalComplexity ? finish() : advance()); };
    }
    return <Screen key={stage.occurrenceId} edges={["top", "bottom"]} footer={<>
      <ActionBar exit={{ kind: exitOpen ? "leave" : "none" }} phase={phase}
        allowLeave={!busy && !exitBlocked && !recoveryAction} onRequestLeave={requestLeaveSession}
        primaryAction={{ label: primaryLabel, enabled: !busy && (exitBlocked || Boolean(recoveryAction) || stage.accepted || Boolean(selectedOption)), loading: busy }}
        onPrimaryAction={primaryPress}
        onRetry={!exitBlocked && recoveryAction === "retry" ? () => { void retryExactSave(); } : undefined}
        retryLabel={!exitBlocked && recoveryAction === "retry" ? "Retry exact save" : undefined}
        runtimeIdentity={{ sessionId: stage.sessionId, itemId: stage.occurrenceId }} />
      {notice ? <DurabilityNotice notice={{ message: notice, tone: "error" }} /> : null}
    </>} footerVariant="session">
      <Text maxFontSizeMultiplier={2} style={styles.sessionContext}>{t("Problem {{current}} of {{total}} · Step {{step}}/2", { current: stage.problemIndex, total: stage.problemCount, step: stage.stage === "approach" ? 1 : 2 })}</Text>
      {preferencesWarning}
      {stage.stage === "complexity" && stage.methodReveal ? <Card><Text style={styles.label}>{t(stage.methodReveal.title)}</Text><Text style={styles.copy}>{t(stage.methodReveal.description)}</Text></Card> : null}
      <Text accessibilityRole="header" style={styles.label}>{t(stage.stage === "approach" ? "Choose an approach" : "Analyze the complexity")}</Text>
      <ApproachChallengeQuestion prompt={stage.prompt} constraints={stage.stage === "approach" ? NO_ADDITIONAL_CONSTRAINTS : stage.constraints} />
      {options.map((option, index) => {
        const selected = selectedOption === option.id;
        const correct = option.reviewState === "correct" || option.reviewState === "omitted_correct";
        const state = approachChallengeOptionState({ selected, accepted: stage.accepted, reviewState: option.reviewState, resultKind: stage.result?.kind ?? null });
        const resultLabel = selected && stage.result ? t(stage.result.kind === "correct" ? "Correct answer" : "Your answer: {{result}}", { result: t(resultTitle(stage.result.kind)) })
          : stage.accepted && correct ? t("Correct answer") : option.text;
        return <AnswerOption key={option.id} letter={String.fromCharCode(65 + index)} text={option.text} resultLabel={stage.accepted && (correct || selected) ? t(correct ? "Correct answer" : resultTitle(stage.result?.kind ?? "incorrect")) : undefined} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={stage.accepted ? `${option.text}. ${resultLabel}` : option.text} state={state} disabled={stage.accepted || busy || exitBlocked || exitOpen} onPress={() => { if (!busyRef.current && !exitBlocked && !exitOpen) setSelectedOption(option.id); }} testID={`acm6-option-${index}`} />;
      })}
      {stage.accepted ? <ApproachChallengeFeedback stage={stage} /> : null}
      {exitOpen ? <ExitModal sessionId={stage.sessionId} trackId={APPROACH_CHALLENGE_TRACK_ID}
        onDismiss={dismissExit}
        onLeave={() => { if (exitOwner.current) void pauseSession("pause", exitOwner.current); }}
        onAbandon={() => { if (exitOwner.current) void endSession("end", exitOwner.current); }} /> : null}
    </Screen>;
  }
  return (
    <Screen backAction={{ destinationLabel: t("Activity"), onPress: () => navigation.popTo(ROUTES.ACTIVITY) }} edges={["top", "bottom"]}>
      {preferencesWarning}
      <ApproachChallengeSummary key={model.detail.sessionId} detail={model.detail}
        onBack={() => navigation.popTo(ROUTES.ACTIVITY)}
        onReview={approachOccurrenceId => navigation.navigate(ROUTES.APPROACH_CHALLENGE_REVIEW, { sessionId: model.detail.sessionId, approachOccurrenceId })} />
    </Screen>
  );
}

function familyLabel(id: string): string { return id.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()); }
function selectedFamilySummary(ids: readonly string[], t: (key: string, options?: Record<string, unknown>) => string): string {
  const labels = ids.map(familyLabel).map((label) => t(label));
  const visible = labels.slice(0, 2).join(", ");
  return labels.length > 2 ? `${visible} ${t("and {{count}} more", { count: labels.length - 2 })}` : visible;
}
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
const createStyles = (colors: AppColors) => StyleSheet.create({ setupSection: { gap: spacing.sm }, setupFooter: { gap: spacing.sm }, sessionContext: { ...typography.navigationContext, color: colors.textPrimary }, copy: { ...typography.body, color: colors.textSecondary }, error: { ...typography.body, color: colors.danger }, label: { ...typography.bodyStrong, color: colors.textPrimary }, row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm } });
