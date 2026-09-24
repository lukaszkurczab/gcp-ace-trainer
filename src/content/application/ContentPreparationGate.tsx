import { useEffect, useRef, useState, type ReactNode } from "react";
import { Linking, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, LoadingState, Screen } from "../../components";
import { abandonUnavailableActiveTrainingSession, bootstrapApplication } from "../../application/bootstrap";
import { clearDevelopmentBootstrapDiagnostic, describeOperationalFailure, recordDevelopmentBootstrapDiagnostic } from "../../application/operationalDiagnostics";
import { composeTrainingLifecycleUseCases } from "../../application/bootstrap";
import { getForegroundSessionTimerFacade } from "../../application/trainingLifecycle";
import { handleRuntimeAuditabilityUrl } from "../../application/runtimeAuditability/developmentResetCommand";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { useAppPreferences } from "../../preferences";

export type ContentPreparationPhase =
  | "opening-storage"
  | "recovering-learning-state"
  | "verifying-content"
  | "resuming-session";

const PREPARATION_PHASE_COPY: Readonly<Record<ContentPreparationPhase, string>> = {
  "opening-storage": "Opening local learning data…",
  "recovering-learning-state": "Checking saved learning state…",
  "verifying-content": "Verifying installed learning content…",
  "resuming-session": "Restoring your active session…",
};

function preparationTimeoutReason(phase: ContentPreparationPhase): string {
  const description = PREPARATION_PHASE_COPY[phase].slice(0, -1);
  return `Content preparation timed out while ${description.charAt(0).toLowerCase()}${description.slice(1)}. Retry to validate the installed content.`;
}

const CONTENT_PREPARATION_TIMEOUT_MS = 15_000;

export type ContentPreparationState =
  | { kind: "loading"; phase: ContentPreparationPhase }
  | { kind: "ready" }
  | { kind: "content_identity_unavailable"; phase: ContentPreparationPhase; sessionIds: readonly string[]; error?: string }
  | { kind: "blocking"; phase: ContentPreparationPhase; reason: string };

export function ContentBootstrapLoadingSkeleton({ phase }: Readonly<{ phase: ContentPreparationPhase }>) {
  const { t } = useTranslation("common");
  const title = t("Preparing content…");
  const phaseCopy = t(PREPARATION_PHASE_COPY[phase]);

  return <LoadingState description={phaseCopy} descriptionTestID="content-bootstrap-phase" showLogo testID="content-bootstrap-loading-skeleton" title={title} />;
}

export function ContentPreparationGate({ children }: { children: ReactNode }) {
  const { colors } = useAppPreferences();
  const { t } = useTranslation("common");
  const [state, setState] = useState<ContentPreparationState>({ kind: "loading", phase: "opening-storage" });
  const [bootstrapRevision, setBootstrapRevision] = useState(0);
  const [auditResetReady, setAuditResetReady] = useState(false);
  const [auditCommandListenerReady, setAuditCommandListenerReady] = useState(false);
  const [confirmUnavailableActiveAbandon, setConfirmUnavailableActiveAbandon] = useState(false);
  const [abandoningUnavailableActive, setAbandoningUnavailableActive] = useState(false);
  const initialUrlHandled = useRef(false);
  const resetInFlight = useRef(false);
  const lifecycleReady = useRef(false);
  const pendingRuntimeAuditabilityUrl = useRef<string | null>(null);
  const auditResetAwaitingBootstrap = useRef(false);

  useEffect(() => {
    let live = true;
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let lifecycle: ReturnType<typeof composeTrainingLifecycleUseCases> | null = null;
    let currentPhase: ContentPreparationPhase = "opening-storage";
    lifecycleReady.current = false;

    const setPhase = (phase: ContentPreparationPhase) => {
      currentPhase = phase;
      if (live && !settled) setState({ kind: "loading", phase });
    };

    const complete = (nextState: ContentPreparationState) => {
      if (!live || settled) return;
      settled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      setState(nextState);
      if (nextState.kind === "ready" && auditResetAwaitingBootstrap.current) {
        auditResetAwaitingBootstrap.current = false;
        setAuditResetReady(true);
      }
    };

    timeoutId = setTimeout(() => {
      complete({
        kind: "blocking",
        phase: currentPhase,
        reason: preparationTimeoutReason(currentPhase),
      });
    }, CONTENT_PREPARATION_TIMEOUT_MS);

    void (async () => {
      if (__DEV__) clearDevelopmentBootstrapDiagnostic();
      const initialUrl = __DEV__ && !initialUrlHandled.current ? await Linking.getInitialURL() : null;
      initialUrlHandled.current = true;
      return bootstrapApplication(
        () => {
          setPhase("verifying-content");
          return contentPackageRuntimeOwner.verifyBundledPackages();
        },
        async () => {
          setPhase("resuming-session");
          if (!lifecycle) throw new Error("Training lifecycle composition was not installed.");
          const session = await lifecycle.resumeActiveSession();
          if (session.configurationSnapshot.timer === "countdownForeground" || session.configurationSnapshot.timer === "elapsedForeground") {
            await getForegroundSessionTimerFacade().restoreForResume(session);
          }
        },
        async () => {
          setPhase("recovering-learning-state");
          lifecycle = composeTrainingLifecycleUseCases();
          lifecycleReady.current = true;
          const queuedUrl = pendingRuntimeAuditabilityUrl.current;
          pendingRuntimeAuditabilityUrl.current = null;
          const handling = await handleRuntimeAuditabilityUrl(queuedUrl ?? initialUrl);
          if (handling.kind === "reset_learning_state") auditResetAwaitingBootstrap.current = true;
        },
        __DEV__ ? { diagnosticObserver: recordDevelopmentBootstrapDiagnostic } : undefined,
      );
    })().then((result) => {
      if (result.kind === "ready") {
        if (__DEV__) clearDevelopmentBootstrapDiagnostic();
        complete({ kind: "ready" });
        return;
      }
      if (result.kind === "content_identity_unavailable") {
        complete({ kind: "content_identity_unavailable", phase: currentPhase, sessionIds: result.sessionIds });
        return;
      }
      complete({ kind: "blocking", phase: currentPhase, reason: result.reason });
    }).catch((error) => {
      complete({ kind: "blocking", phase: currentPhase, reason: describeOperationalFailure(error, "Application bootstrap failed.") });
    });
    return () => {
      live = false;
      settled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [bootstrapRevision]);

  useEffect(() => {
    // A reset must also be available after bootstrap has reported a blocking
    // persisted-state error; otherwise the development recovery command cannot
    // restore the very state that prevents the app from becoming ready.
    if (!__DEV__) return;
    let live = true;
    const apply = async (url: string | null) => {
      if (!live) return;
      if (state.kind === "loading" || !lifecycleReady.current) {
        pendingRuntimeAuditabilityUrl.current = url;
        return;
      }
      if (resetInFlight.current) return;
      resetInFlight.current = true;
      setAuditResetReady(false);
      try {
        const result = await handleRuntimeAuditabilityUrl(url);
        if (!live || result.kind !== "reset_learning_state") return;
        auditResetAwaitingBootstrap.current = true;
        setState({ kind: "loading", phase: "opening-storage" });
        setBootstrapRevision((revision) => revision + 1);
      } catch (error) {
        if (live) setState({ kind: "blocking", phase: "opening-storage", reason: describeOperationalFailure(error, "Development reset failed.") });
      } finally {
        resetInFlight.current = false;
      }
    };
    const subscription = Linking.addEventListener("url", ({ url }) => { void apply(url); });
    setAuditCommandListenerReady(true);
    return () => { live = false; subscription.remove(); };
  }, [state.kind]);

  const retry = () => {
    setConfirmUnavailableActiveAbandon(false);
    setState({ kind: "loading", phase: "opening-storage" });
    setBootstrapRevision((revision) => revision + 1);
  };
  const abandonUnavailableActive = async () => {
    if (state.kind !== "content_identity_unavailable" || abandoningUnavailableActive) return;
    setAbandoningUnavailableActive(true);
    try {
      for (const sessionId of state.sessionIds) await abandonUnavailableActiveTrainingSession(sessionId);
      retry();
    } catch (error) {
      setState({
        error: describeOperationalFailure(error, "The unavailable session could not be abandoned."),
        kind: "content_identity_unavailable",
        phase: "opening-storage",
        sessionIds: state.sessionIds,
      });
    } finally {
      setAbandoningUnavailableActive(false);
    }
  };
  const body = state.kind === "ready"
    ? <View style={{ flex: 1 }} testID={auditResetReady ? runtimeSelectors.content.readyAfterAuditReset() : runtimeSelectors.content.ready()}>{children}</View>
    : state.kind === "loading"
      ? <View style={{ flex: 1 }} testID={runtimeSelectors.content.preparing(state.phase)}><Screen edges={["top", "bottom"]}><ContentBootstrapLoadingSkeleton phase={state.phase} /></Screen></View>
      : state.kind === "content_identity_unavailable"
        ? <View style={{ flex: 1 }} testID={runtimeSelectors.content.unavailableActive()}><Screen>
            <EmptyState
              description={state.error ?? t("An active session uses content that is no longer available. Abandon it to keep its saved facts and start a new session.")}
              title={t("Active session needs attention")}
            />
            {confirmUnavailableActiveAbandon
              ? <View style={{ gap: 12 }}>
                  <Button onPress={() => setConfirmUnavailableActiveAbandon(false)} testID={runtimeSelectors.content.unavailableActiveCancel()} variant="secondary">{t("Cancel")}</Button>
                  <Button loading={abandoningUnavailableActive} onPress={() => { void abandonUnavailableActive(); }} testID={runtimeSelectors.content.unavailableActiveConfirm()} variant="destructive">{t("Abandon unavailable session")}</Button>
                </View>
              : <Button onPress={() => setConfirmUnavailableActiveAbandon(true)} testID={runtimeSelectors.content.unavailableActiveAbandon()} variant="destructive">{t("Abandon unavailable session")}</Button>}
            {!confirmUnavailableActiveAbandon ? <Button onPress={retry} testID={runtimeSelectors.content.unavailableActiveRetry()} variant="secondary">{t("Try again")}</Button> : null}
          </Screen></View>
      : <View style={{ flex: 1 }} testID={runtimeSelectors.content.unavailable()}><Screen><EmptyState actionLabel={t("Try again")} description={state.reason} onActionPress={retry} title={t("Application unavailable")} /></Screen></View>;
  return <View style={{ backgroundColor: colors.background, flex: 1 }} testID={auditCommandListenerReady ? runtimeSelectors.content.auditCommandListener() : undefined}>{body}</View>;
}
