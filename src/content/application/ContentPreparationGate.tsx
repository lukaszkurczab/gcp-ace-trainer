import { useEffect, useRef, useState, type ReactNode } from "react";
import { Linking, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { EmptyState, Screen, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { PatternlyMark } from "../../components/PatternlyMark";
import { bootstrapApplication } from "../../application/bootstrap";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { composeTrainingLifecycleUseCases } from "../../application/bootstrap";
import { getForegroundSessionTimerFacade } from "../../application/trainingLifecycle";
import { handleRuntimeAuditabilityUrl } from "../../application/runtimeAuditability/developmentResetCommand";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";

const CONTENT_PREPARATION_TIMEOUT_MS = 15_000;

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

export type ContentPreparationState =
  | { kind: "loading"; phase: ContentPreparationPhase }
  | { kind: "ready" }
  | { kind: "blocking"; phase: ContentPreparationPhase; reason: string };

export function ContentBootstrapLoadingSkeleton({ phase }: Readonly<{ phase: ContentPreparationPhase }>) {
  const styles = useThemedStyles(createStyles);
  const { colorMode } = useAppPreferences();
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const motion = useSkeletonGlassMotion();
  const title = t("Preparing content…");
  const phaseCopy = t(PREPARATION_PHASE_COPY[phase]);

  return (
    <>
      <StatusBar style={colorMode === "dark" ? "light" : "dark"} />
      <View
        accessibilityLabel={`${title}. ${phaseCopy}`}
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityState={{ busy: true }}
        accessible
        style={styles.bootstrapLoading}
        testID="content-bootstrap-loading-skeleton"
      >
        <View accessible={false} style={styles.bootstrapBrand}>
          <PatternlyMark decorative size={104} treatment={colorMode === "dark" ? "white" : "mint"} />
          <Text maxFontSizeMultiplier={2} style={styles.bootstrapName}>{"Patternly"}</Text>
        </View>
        <View style={styles.bootstrapStatus}>
          <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.bootstrapShapes}>
            <SkeletonShape motion={motion} style={[styles.bootstrapProgressTrack, { height: Math.max(5, 6 * textScale) }]} />
            <View style={styles.bootstrapCardRow}>
              {[0, 1].map((card) => (
                <View key={card} style={[styles.bootstrapCard, { minHeight: 78 * textScale }]}>
                  <SkeletonShape motion={motion} style={styles.bootstrapCardLine} />
                  <SkeletonShape motion={motion} style={[styles.bootstrapCardLineShort, { height: 12 * textScale }]} />
                </View>
              ))}
            </View>
          </View>
          <View accessible={false} style={styles.bootstrapCopy}>
            <Text maxFontSizeMultiplier={2} style={styles.bootstrapTitle}>{title}</Text>
            <Text maxFontSizeMultiplier={2} style={styles.bootstrapPhase} testID="content-bootstrap-phase">{phaseCopy}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

export function ContentPreparationGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentPreparationState>({ kind: "loading", phase: "opening-storage" });
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
      );
    })().then((result) => {
      complete(result.kind === "ready" ? { kind: "ready" } : { kind: "blocking", phase: currentPhase, reason: result.reason });
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

  const body = state.kind === "ready"
    ? <View style={{ flex: 1 }} testID={auditResetReady ? runtimeSelectors.content.readyAfterAuditReset() : runtimeSelectors.content.ready()}>{children}</View>
    : state.kind === "loading"
      ? <View style={{ flex: 1 }} testID={runtimeSelectors.content.preparing(state.phase)}><Screen edges={["top", "bottom"]}><ContentBootstrapLoadingSkeleton phase={state.phase} /></Screen></View>
      : <View style={{ flex: 1 }} testID={runtimeSelectors.content.unavailable()}><Screen><EmptyState actionLabel="Retry" description={state.reason} onActionPress={() => { setState({ kind: "loading", phase: "opening-storage" }); setBootstrapRevision((revision) => revision + 1); }} title="Application unavailable" /></Screen></View>;
  return <View style={{ flex: 1 }} testID={auditCommandListenerReady ? runtimeSelectors.content.auditCommandListener() : undefined}>{body}</View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  bootstrapLoading: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    width: "100%",
  },
  bootstrapBrand: {
    alignItems: "center",
    gap: spacing.xl,
  },
  bootstrapName: {
    ...typography.display,
    color: palette.textPrimary,
    letterSpacing: -0.8,
  },
  bootstrapStatus: {
    alignSelf: "stretch",
    gap: spacing.xl,
    marginTop: spacing.xxxl,
    maxWidth: 453,
    minWidth: 0,
    width: "100%",
  },
  bootstrapShapes: {
    gap: spacing.md,
    width: "100%",
  },
  bootstrapProgressTrack: {
    backgroundColor: palette.progress.loadingTrack,
    borderColor: palette.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    width: "100%",
  },
  bootstrapCardRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  bootstrapCard: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  bootstrapCardLine: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    height: 16,
    width: "80%",
  },
  bootstrapCardLineShort: {
    backgroundColor: palette.progress.loadingTrack,
    borderRadius: radius.sm,
    width: "54%",
  },
  bootstrapCopy: {
    alignItems: "flex-start",
    gap: spacing.sm,
    minWidth: 0,
    width: "100%",
  },
  bootstrapTitle: {
    ...typography.processingTitle,
    color: palette.textPrimary,
    flexShrink: 1,
  },
  bootstrapPhase: {
    ...typography.processingDescription,
    color: palette.textSecondary,
    flexShrink: 1,
  },
});
