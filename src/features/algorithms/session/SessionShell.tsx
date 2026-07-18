import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "../../../components";
import { colors, spacing, typography } from "../../../theme";

type SessionShellProps = Readonly<{
  actionBar?: ReactNode;
  children: ReactNode;
  modeLabel?: string;
  positionLabel?: string;
  progress?: number;
  timerLabel?: string;
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
  positionLabel,
  progress,
  timerLabel,
}: SessionShellProps) {
  const verifiedProgress = typeof progress === "number" && Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : null;

  return (
    <Screen edges={["top", "bottom"]} footer={actionBar ? <View style={styles.actionRegion}>{actionBar}</View> : undefined} style={styles.content}>
      <View style={styles.topBar}>
        <View accessibilityElementsHidden={!timerLabel} accessibilityLabel={timerLabel ? `Active time remaining ${timerLabel}` : undefined} importantForAccessibility={timerLabel ? "auto" : "no-hide-descendants"} style={styles.topSlot}>
          {timerLabel ? <Text style={styles.topText}>{timerLabel}</Text> : null}
        </View>
        <View style={styles.modeSlot}>
          {modeLabel ? <Text numberOfLines={1} style={styles.modeText}>{modeLabel}</Text> : null}
        </View>
        <View accessibilityElementsHidden={!positionLabel} importantForAccessibility={positionLabel ? "auto" : "no-hide-descendants"} style={[styles.topSlot, styles.positionSlot]}>
          {positionLabel ? <Text style={styles.topText}>{positionLabel}</Text> : null}
        </View>
      </View>
      <View accessibilityElementsHidden={verifiedProgress === null} importantForAccessibility={verifiedProgress === null ? "no-hide-descendants" : "auto"} style={styles.progressTrack}>
        {verifiedProgress === null ? null : <View accessibilityRole="progressbar" accessibilityValue={{ max: 100, min: 0, now: Math.round(verifiedProgress * 100) }} style={[styles.progressFill, { width: `${verifiedProgress * 100}%` }]} />}
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
    height: 56,
  },
  topSlot: {
    justifyContent: "center",
    minWidth: 72,
  },
  topText: {
    ...typography.caption,
    color: colors.dark.textSecondary,
  },
});
