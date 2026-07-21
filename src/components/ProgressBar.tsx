import { StyleSheet, View } from "react-native";

import { radius } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type ProgressTone = "primary" | "success" | "warning" | "danger" | "info";

type ProgressBarProps = {
  progress: number;
  tone?: ProgressTone;
};

export function ProgressBar({ progress, tone = "primary" }: ProgressBarProps) {
  const styles = useThemedStyles(createStyles);
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View accessibilityRole="progressbar" style={styles.track}>
      <View style={[styles.fill, styles[tone], { width: `${clampedProgress * 100}%` }]} />
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  track: {
    backgroundColor: palette.elevatedSurface,
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
    backgroundColor: palette.primary
  },
  success: {
    backgroundColor: palette.success
  },
  warning: {
    backgroundColor: palette.warning
  },
  danger: {
    backgroundColor: palette.danger
  },
  info: {
    backgroundColor: palette.info
  }
});
