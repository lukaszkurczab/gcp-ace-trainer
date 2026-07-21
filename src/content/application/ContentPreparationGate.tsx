import { useEffect, useRef, useState, type ReactNode } from "react";
import { Linking, Text, View } from "react-native";
import { EmptyState, Screen } from "../../components";
import { bootstrapApplication } from "../../application/bootstrap";
import { composeTrainingLifecycleUseCases } from "../../application/bootstrap";
import { getAlgorithmsSimulationTimerFacade } from "../../application/algorithms";
import { handleRuntimeAuditabilityUrl } from "../../application/runtimeAuditability/developmentResetCommand";
import { validateBundledContent } from "./validateBundledContent";

export type ContentPreparationState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "blocking"; reason: string };

export function ContentPreparationGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentPreparationState>({ kind: "loading" });
  const [bootstrapRevision, setBootstrapRevision] = useState(0);
  const initialUrlHandled = useRef(false);
  const resetInFlight = useRef(false);

  useEffect(() => {
    let live = true;
    let lifecycle: ReturnType<typeof composeTrainingLifecycleUseCases> | null = null;
    void (async () => {
      const initialUrl = __DEV__ ? await Linking.getInitialURL() : null;
      initialUrlHandled.current = true;
      return bootstrapApplication(
        validateBundledContent,
        async () => {
          if (!lifecycle) throw new Error("Training lifecycle composition was not installed.");
          const session = await lifecycle.resumeActiveSession();
          if (session.trackId === "algorithms" && session.configurationSnapshot.timer === "countdownForeground") {
            await getAlgorithmsSimulationTimerFacade().restoreForResume(session);
          }
        },
        async () => {
          lifecycle = composeTrainingLifecycleUseCases();
          await handleRuntimeAuditabilityUrl(initialUrl);
        },
      );
    })().then((result) => {
      if (!live) return;
      setState(result.kind === "ready" ? { kind: "ready" } : { kind: "blocking", reason: result.reason });
    });
    return () => { live = false; };
  }, [bootstrapRevision]);

  useEffect(() => {
    // A reset must also be available after bootstrap has reported a blocking
    // persisted-state error; otherwise the development recovery command cannot
    // restore the very state that prevents the app from becoming ready.
    if (!__DEV__ || state.kind === "loading") return;
    let live = true;
    const apply = async (url: string | null) => {
      if (resetInFlight.current || !live) return;
      resetInFlight.current = true;
      try {
        const result = await handleRuntimeAuditabilityUrl(url);
        if (!live || result.kind !== "reset_learning_state") return;
        setState({ kind: "loading" });
        setBootstrapRevision((revision) => revision + 1);
      } catch (error) {
        if (live) setState({ kind: "blocking", reason: error instanceof Error ? error.message : "Development reset failed." });
      } finally {
        resetInFlight.current = false;
      }
    };
    const subscription = Linking.addEventListener("url", ({ url }) => { void apply(url); });
    return () => { live = false; subscription.remove(); };
  }, [state.kind]);

  if (state.kind === "ready") return <>{children}</>;
  if (state.kind === "loading") return <Screen><View><Text>Preparing content…</Text></View></Screen>;
  return <Screen><EmptyState title="Application unavailable" description={state.reason} /></Screen>;
}
