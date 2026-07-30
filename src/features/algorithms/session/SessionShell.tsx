import type { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Screen } from "../../../components";
import { spacing, typography } from "../../../theme";
import type { SessionMetricPresentation } from "./sessionAccessibility";
import { useThemedStyles } from "../../../preferences";
import type { AppColors } from "../../../theme";

const SESSION_ACTION_FOOTER_CLEARANCE = (48 * 2) + spacing.sm + (spacing.lg * 2);

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
  const { fontScale } = useWindowDimensions();
  const usesLargeTextLayout = fontScale >= 1.3;
  const verifiedProgress = typeof progress === "number" && Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : null;

  return (
    <Screen edges={["top", "bottom"]} footer={actionBar ? <View style={styles.actionRegion}>{actionBar}</View> : undefined} style={styles.content}>
      <View style={styles.sessionRoot} testID={rootTestID}>
        <View style={[styles.topBar, usesLargeTextLayout ? styles.topBarLargeText : null]}>
          <View accessible={Boolean(timer)} accessibilityElementsHidden={!timer} accessibilityLabel={timer?.accessibilityLabel} accessibilityRole={timer ? "timer" : undefined} importantForAccessibility={timer ? "yes" : "no-hide-descendants"} style={[styles.topSlot, usesLargeTextLayout ? styles.topSlotLargeText : null]} testID={timerTestID}>
            {timer ? <Text maxFontSizeMultiplier={2} style={styles.topText}>{timer.label}</Text> : null}
          </View>
          <View style={[styles.modeSlot, usesLargeTextLayout ? styles.modeSlotLargeText : null]}>
            {modeLabel ? <Text maxFontSizeMultiplier={2} style={styles.modeText} testID={modeTestID}>{modeLabel}</Text> : null}
          </View>
          <View accessible={Boolean(position)} accessibilityElementsHidden={!position} accessibilityLabel={position?.accessibilityLabel} importantForAccessibility={position ? "yes" : "no-hide-descendants"} style={[styles.topSlot, styles.positionSlot, usesLargeTextLayout ? styles.topSlotLargeText : null]} testID={positionTestID}>
            {position ? <Text maxFontSizeMultiplier={2} style={styles.topText}>{position.label}</Text> : null}
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
    // A two-button action footer occupies this space below the scroll viewport.
    // Keep the final feedback control scrollable clear of that fixed region.
    paddingBottom: SESSION_ACTION_FOOTER_CLEARANCE,
    paddingTop: spacing.lg,
  },
  modeSlot: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  modeSlotLargeText: {
    flex: 0,
    width: "100%",
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
  topBarLargeText: {
    flexDirection: "column",
    gap: spacing.sm,
  },
  topSlot: {
    flexShrink: 1,
    justifyContent: "center",
    minWidth: 72,
  },
  topSlotLargeText: {
    alignItems: "center",
    minWidth: 0,
    width: "100%",
  },
  topText: {
    ...typography.caption,
    color: palette.textSecondary,
  },
});
