import { StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "../../../../components";
import { colors, spacing, typography } from "../../../../theme";
import type { SimulationTimerTone } from "../model";

type SimulationTopBarProps = {
  itemProgressLabel: string;
  progress: number;
  remainingTimeLabel: string;
  timerTone?: SimulationTimerTone;
};

export function SimulationTopBar({
  itemProgressLabel,
  progress,
  remainingTimeLabel,
  timerTone = "normal",
}: SimulationTopBarProps) {
  const isCritical = timerTone === "critical";
  const isWarning = timerTone === "warning";
  const timerAccessibilityLabel = timerTone === "paused"
    ? `Timer paused. ${remainingTimeLabel} remaining.`
    : `${remainingTimeLabel} remaining.`;

  return (
    <View accessibilityRole="summary" style={styles.container}>
      <View style={styles.metaRow}>
        <Text accessibilityLabel={timerAccessibilityLabel} style={[styles.timer, isWarning ? styles.warningTimer : null, isCritical ? styles.criticalTimer : null]}>
          {remainingTimeLabel}
        </Text>
        <Text style={styles.progressLabel}>{itemProgressLabel}</Text>
      </View>
      <ProgressBar progress={progress} tone={isCritical ? "danger" : isWarning ? "warning" : "primary"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  metaRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  timer: { ...typography.bodyStrong, color: colors.dark.success },
  warningTimer: { color: colors.dark.warning },
  criticalTimer: { color: colors.dark.danger },
  progressLabel: { ...typography.caption, color: colors.dark.textSecondary, textTransform: "uppercase" },
});
