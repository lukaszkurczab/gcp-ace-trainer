import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "../../../components";
import { spacing, typography } from "../../../theme";
import type { SessionMetricPresentation } from "./sessionAccessibility";
import { useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";

const SESSION_ACTION_FOOTER_CLEARANCE = (48 * 2) + spacing.sm + (spacing.lg * 2);

type SessionShellProps = Readonly<{
  actionBar?: ReactNode;
  children: ReactNode;
  layout?: "practice" | "simulation" | "simulationSaved";
  modeTestID?: string;
  modeLabel?: string;
  onPositionPress?: () => void;
  position?: SessionMetricPresentation;
  positionAccessibilityLabel?: string;
  positionTestID?: string;
  progress?: number;
  progressTestID?: string;
  rootTestID?: string;
  timer?: SessionMetricPresentation;
  timerTestID?: string;
}>;

/**
 * Pure session geometry shared by Algorithms Practice and Interview
 * Simulation. Its semantic values are intentionally supplied by an
 * application projection; before verification the slots stay reserved but
 * unlabelled.
 */
export function SessionShell({
  actionBar,
  children,
  layout = "practice",
  modeTestID,
  modeLabel,
  onPositionPress,
  position,
  positionAccessibilityLabel,
  positionTestID,
  progress,
  progressTestID,
  rootTestID,
  timer,
  timerTestID,
}: SessionShellProps) {
  const styles = useThemedStyles(createStyles);
  const isSimulationLayout = layout === "simulation" || layout === "simulationSaved";
  const isSavedSimulationLayout = layout === "simulationSaved";
  const verifiedProgress = typeof progress === "number" && Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : null;

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={actionBar ? <View style={styles.actionRegion}>{actionBar}</View> : undefined}
      footerVariant={layout === "practice" ? "session" : "simulation"}
      header={(
        <>
          <View style={[styles.topBar, isSimulationLayout ? styles.topBarSimulation : null, isSavedSimulationLayout ? styles.topBarSavedSimulation : null]}>
            <View accessible={Boolean(timer)} accessibilityElementsHidden={!timer} accessibilityLabel={timer?.accessibilityLabel} accessibilityRole={timer ? "timer" : undefined} importantForAccessibility={timer ? "yes" : "no-hide-descendants"} style={[styles.topSlot, isSimulationLayout ? styles.topSlotSimulation : null]} testID={timerTestID}>
              {timer ? <Text maxFontSizeMultiplier={2} style={[styles.topText, isSavedSimulationLayout ? styles.topTextSavedSimulation : null]}>{timer.label}</Text> : null}
            </View>
            <View style={[styles.modeSlot, isSimulationLayout ? styles.modeSlotSimulation : null]}>
              {modeLabel ? <Text maxFontSizeMultiplier={2} style={[styles.modeText, isSimulationLayout ? styles.modeTextSimulation : null, isSavedSimulationLayout ? styles.modeTextSavedSimulation : null]} testID={modeTestID}>{modeLabel}</Text> : null}
            </View>
            <PositionSlot isSavedSimulationLayout={isSavedSimulationLayout} isSimulationLayout={isSimulationLayout} onPress={onPositionPress} position={position} positionAccessibilityLabel={positionAccessibilityLabel} positionTestID={positionTestID} styles={styles} />
          </View>
          <View accessible={verifiedProgress !== null} accessibilityElementsHidden={verifiedProgress === null} accessibilityLabel={verifiedProgress === null ? undefined : "Session progress"} accessibilityRole={verifiedProgress === null ? undefined : "progressbar"} accessibilityValue={verifiedProgress === null ? undefined : { max: 100, min: 0, now: Math.round(verifiedProgress * 100) }} importantForAccessibility={verifiedProgress === null ? "no-hide-descendants" : "yes"} style={[styles.progressTrack, isSimulationLayout ? styles.progressTrackSimulation : null]} testID={progressTestID}>
            {verifiedProgress === null ? null : <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.progressFill, { width: `${verifiedProgress * 100}%` }]} />}
          </View>
        </>
      )}
      style={[styles.content, isSimulationLayout ? styles.contentSimulation : null]}
    >
      <View style={[styles.sessionContent, isSimulationLayout ? styles.simulationContent : null, isSavedSimulationLayout ? styles.simulationContentSaved : null]} testID={rootTestID}>
        {children}
      </View>
    </Screen>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  actionRegion: {
    minHeight: 80,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    // A two-button action footer occupies this space below the scroll viewport.
    // Keep the final feedback control scrollable clear of that fixed region.
    paddingBottom: SESSION_ACTION_FOOTER_CLEARANCE,
    paddingTop: spacing.xl,
  },
  contentSimulation: {
    paddingBottom: spacing.lg,
  },
  modeSlot: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  modeSlotSimulation: {
    alignItems: "center",
  },
  modeText: {
    ...typography.caption,
    color: palette.textSecondary,
    textAlign: "center",
  },
  modeTextSimulation: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  modeTextSavedSimulation: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  positionSlot: {
    alignItems: "flex-end",
  },
  progressFill: {
    backgroundColor: palette.primary,
    height: 4,
  },
  progressTrack: {
    backgroundColor: palette.surface,
    height: 4,
    marginHorizontal: -spacing.xl,
    overflow: "hidden",
  },
  progressTrackSimulation: {
    backgroundColor: palette.surfaceInput,
  },
  sessionContent: {
    gap: spacing.md,
  },
  simulationContent: {
    paddingBottom: spacing.lg,
  },
  simulationContentSaved: {
    gap: spacing.lg,
  },
  topBarSimulation: {
    minHeight: 16,
    paddingVertical: 0,
  },
  topBarSavedSimulation: {
    minHeight: 48,
    paddingVertical: spacing.lg,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 16,
    paddingHorizontal: spacing.xl,
    paddingVertical: 0,
  },
  topSlot: {
    flexShrink: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  topText: {
    ...typography.caption,
    color: palette.textSecondary,
  },
  topTextSavedSimulation: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  topSlotSimulation: {
    minWidth: 0,
  },
});

function PositionSlot({ isSavedSimulationLayout, isSimulationLayout, onPress, position, positionAccessibilityLabel, positionTestID, styles }: Readonly<{
  isSavedSimulationLayout: boolean;
  isSimulationLayout: boolean;
  onPress?: () => void;
  position?: SessionMetricPresentation;
  positionAccessibilityLabel?: string;
  positionTestID?: string;
  styles: ReturnType<typeof createStyles>;
}>) {
  const style = [styles.topSlot, styles.positionSlot, isSimulationLayout ? styles.topSlotSimulation : null];
  const content = position ? <Text maxFontSizeMultiplier={2} style={[styles.topText, isSavedSimulationLayout ? styles.topTextSavedSimulation : null]}>{position.label}</Text> : null;
  if (onPress && position) {
    return <Pressable accessibilityLabel={positionAccessibilityLabel ?? position.accessibilityLabel} accessibilityRole="button" onPress={onPress} style={style} testID={positionTestID}>{content}</Pressable>;
  }
  return <View accessible={Boolean(position)} accessibilityElementsHidden={!position} accessibilityLabel={position?.accessibilityLabel} importantForAccessibility={position ? "yes" : "no-hide-descendants"} style={style} testID={positionTestID}>{content}</View>;
}
