import { useEffect, useRef, useState, type ReactNode } from "react";
import { Linking, View } from "react-native";
import { EmptyState, LoadingState, Screen } from "../../components";
import { bootstrapApplication } from "../../application/bootstrap";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { composeTrainingLifecycleUseCases } from "../../application/bootstrap";
import { getForegroundSessionTimerFacade } from "../../application/trainingLifecycle";
import { handleRuntimeAuditabilityUrl } from "../../application/runtimeAuditability/developmentResetCommand";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";

const CONTENT_PREPARATION_TIMEOUT_MS = 15_000;

export type ContentPreparationState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "blocking"; reason: string };

export function ContentPreparationGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentPreparationState>({ kind: "loading" });
  const [bootstrapRevision, setBootstrapRevision] = useState(0);
  const [auditResetReady, setAuditResetReady] = useState(false);
  const [auditCommandListenerReady, setAuditCommandListenerReady] = useState(false);
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
    lifecycleReady.current = false;

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
        reason: "Content preparation timed out. Retry to validate the installed content.",
      });
    }, CONTENT_PREPARATION_TIMEOUT_MS);

    void (async () => {
      const initialUrl = __DEV__ && !initialUrlHandled.current ? await Linking.getInitialURL() : null;
      initialUrlHandled.current = true;
      return bootstrapApplication(
        () => contentPackageRuntimeOwner.verifyBundledPackages(),
        async () => {
          if (!lifecycle) throw new Error("Training lifecycle composition was not installed.");
          const session = await lifecycle.resumeActiveSession();
          if (session.configurationSnapshot.timer === "countdownForeground" || session.configurationSnapshot.timer === "elapsedForeground") {
            await getForegroundSessionTimerFacade().restoreForResume(session);
          }
        },
        async () => {
          lifecycle = composeTrainingLifecycleUseCases();
          lifecycleReady.current = true;
          const queuedUrl = pendingRuntimeAuditabilityUrl.current;
          pendingRuntimeAuditabilityUrl.current = null;
          const handling = await handleRuntimeAuditabilityUrl(queuedUrl ?? initialUrl);
          if (handling.kind === "reset_learning_state") auditResetAwaitingBootstrap.current = true;
        },
      );
    })().then((result) => {
      complete(result.kind === "ready" ? { kind: "ready" } : { kind: "blocking", reason: result.reason });
    }).catch((error) => {
      complete({ kind: "blocking", reason: describeOperationalFailure(error, "Application bootstrap failed.") });
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
        setState({ kind: "loading" });
        setBootstrapRevision((revision) => revision + 1);
      } catch (error) {
        if (live) setState({ kind: "blocking", reason: describeOperationalFailure(error, "Development reset failed.") });
      } finally {
        resetInFlight.current = false;
      }
    };
    const subscription = Linking.addEventListener("url", ({ url }) => { void apply(url); });
    setAuditCommandListenerReady(true);
    return () => { live = false; subscription.remove(); };
  }, [state.kind]);

  const body = state.kind === "ready"
    ? <View style={{ flex: 1 }} testID={auditResetReady ? runtimeSelectors.content.readyAfterAuditReset() : runtimeSelectors.content.ready()}>{children}</View>
    : state.kind === "loading"
      ? <Screen edges={["top", "bottom"]} scroll={false}><LoadingState title="Preparing content…" variant="startup" /></Screen>
      : <Screen><EmptyState actionLabel="Retry" description={state.reason} onActionPress={() => { setState({ kind: "loading" }); setBootstrapRevision((revision) => revision + 1); }} title="Application unavailable" /></Screen>;
  return <View style={{ flex: 1 }} testID={auditCommandListenerReady ? runtimeSelectors.content.auditCommandListener() : undefined}>{body}</View>;
}
