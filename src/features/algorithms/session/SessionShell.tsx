import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "../../../components";
import { colors, spacing, typography } from "../../../theme";
import type { SessionMetricPresentation } from "./sessionAccessibility";

type SessionShellProps = Readonly<{
  actionBar?: ReactNode;
  children: ReactNode;
  modeLabel?: string;
  position?: SessionMetricPresentation;
  progress?: number;
  timer?: SessionMetricPresentation;
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
  modeLabel,
  position,
  progress,
  timer,
}: SessionShellProps) {
  const verifiedProgress = typeof progress === "number" && Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : null;

  return (
    <Screen edges={["top", "bottom"]} footer={actionBar ? <View style={styles.actionRegion}>{actionBar}</View> : undefined} style={styles.content}>
      <View style={styles.topBar}>
        <View accessible={Boolean(timer)} accessibilityElementsHidden={!timer} accessibilityLabel={timer?.accessibilityLabel} accessibilityRole={timer ? "timer" : undefined} importantForAccessibility={timer ? "yes" : "no-hide-descendants"} style={styles.topSlot}>
          {timer ? <Text style={styles.topText}>{timer.label}</Text> : null}
        </View>
        <View style={styles.modeSlot}>
          {modeLabel ? <Text style={styles.modeText}>{modeLabel}</Text> : null}
        </View>
        <View accessible={Boolean(position)} accessibilityElementsHidden={!position} accessibilityLabel={position?.accessibilityLabel} importantForAccessibility={position ? "yes" : "no-hide-descendants"} style={[styles.topSlot, styles.positionSlot]}>
          {position ? <Text style={styles.topText}>{position.label}</Text> : null}
        </View>
      </View>
      <View accessible={verifiedProgress !== null} accessibilityElementsHidden={verifiedProgress === null} accessibilityLabel={verifiedProgress === null ? undefined : "Session progress"} accessibilityRole={verifiedProgress === null ? undefined : "progressbar"} accessibilityValue={verifiedProgress === null ? undefined : { max: 100, min: 0, now: Math.round(verifiedProgress * 100) }} importantForAccessibility={verifiedProgress === null ? "no-hide-descendants" : "yes"} style={styles.progressTrack}>
        {verifiedProgress === null ? null : <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.progressFill, { width: `${verifiedProgress * 100}%` }]} />}
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  positionSlot: {
    alignItems: "flex-end",
  },
  progressFill: {
    backgroundColor: colors.dark.primary,
    height: 4,
  },
  progressTrack: {
    backgroundColor: colors.dark.surface,
    height: 4,
    marginHorizontal: -spacing.xl,
    overflow: "hidden",
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
    color: colors.dark.textSecondary,
  },
});
