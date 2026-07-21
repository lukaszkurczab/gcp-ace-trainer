import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "../../../components";
import { spacing, typography } from "../../../theme";
import type { SessionMetricPresentation } from "./sessionAccessibility";
import { useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";


type SessionShellProps = Readonly<{
  actionBar?: ReactNode;
  children: ReactNode;
  modeTestID?: string;
  modeLabel?: string;
  position?: SessionMetricPresentation;
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
  modeTestID,
  modeLabel,
  position,
  positionTestID,
  progress,
  progressTestID,
  rootTestID,
  timer,
  timerTestID,
}: SessionShellProps) {
  const styles = useThemedStyles(createStyles);
  const verifiedProgress = typeof progress === "number" && Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : null;

  return (
    <Screen edges={["top", "bottom"]} footer={actionBar ? <View style={styles.actionRegion}>{actionBar}</View> : undefined} style={styles.content}>
      <View style={styles.sessionRoot} testID={rootTestID}>
        <View style={styles.topBar}>
          <View accessible={Boolean(timer)} accessibilityElementsHidden={!timer} accessibilityLabel={timer?.accessibilityLabel} accessibilityRole={timer ? "timer" : undefined} importantForAccessibility={timer ? "yes" : "no-hide-descendants"} style={styles.topSlot} testID={timerTestID}>
            {timer ? <Text style={styles.topText}>{timer.label}</Text> : null}
          </View>
          <View style={styles.modeSlot}>
            {modeLabel ? <Text style={styles.modeText} testID={modeTestID}>{modeLabel}</Text> : null}
          </View>
          <View accessible={Boolean(position)} accessibilityElementsHidden={!position} accessibilityLabel={position?.accessibilityLabel} importantForAccessibility={position ? "yes" : "no-hide-descendants"} style={[styles.topSlot, styles.positionSlot]} testID={positionTestID}>
            {position ? <Text style={styles.topText}>{position.label}</Text> : null}
          </View>
        </View>
        <View accessible={verifiedProgress !== null} accessibilityElementsHidden={verifiedProgress === null} accessibilityLabel={verifiedProgress === null ? undefined : "Session progress"} accessibilityRole={verifiedProgress === null ? undefined : "progressbar"} accessibilityValue={verifiedProgress === null ? undefined : { max: 100, min: 0, now: Math.round(verifiedProgress * 100) }} importantForAccessibility={verifiedProgress === null ? "no-hide-descendants" : "yes"} style={styles.progressTrack} testID={progressTestID}>
          {verifiedProgress === null ? null : <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.progressFill, { width: `${verifiedProgress * 100}%` }]} />}
        </View>
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
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  modeSlot: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  modeText: {
    ...typography.caption,
    color: palette.textSecondary,
    textAlign: "center",
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
  sessionRoot: {
    gap: spacing.xxl,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  topSlot: {
    flexShrink: 1,
    justifyContent: "center",
    minWidth: 72,
  },
  topText: {
    ...typography.caption,
    color: palette.textSecondary,
  },
});
