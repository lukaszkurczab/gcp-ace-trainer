import { StyleSheet, View } from "react-native";

import { colors, radius } from "../theme";

type ProgressTone = "primary" | "success" | "warning" | "danger" | "info";

type ProgressBarProps = {
  progress: number;
  tone?: ProgressTone;
};

export function ProgressBar({ progress, tone = "primary" }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View accessibilityRole="progressbar" style={styles.track}>
      <View style={[styles.fill, styles[tone], { width: `${clampedProgress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.light.elevatedSurface,
    borderRadius: radius.pill,
    height: 8,
    overflow: "hidden",
    width: "100%"
  },
  fill: {
    borderRadius: radius.pill,
    height: "100%"
  },
  primary: {
    backgroundColor: colors.light.primary
  },
  success: {
    backgroundColor: colors.light.success
  },
  warning: {
    backgroundColor: colors.light.warning
  },
  danger: {
    backgroundColor: colors.light.danger
  },
  info: {
    backgroundColor: colors.light.info
  }
});
