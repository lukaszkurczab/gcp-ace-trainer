import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { radius, spacing, typography } from "../theme";
import { ProgressBar } from "./ProgressBar";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

type MetricCardProps = {
  helper?: string;
  label: string;
  progress?: number;
  style?: ViewStyle;
  tone?: MetricTone;
  value: string | number;
};

export function MetricCard({ helper, label, progress, style, tone = "neutral", value }: MetricCardProps) {
  const styles = useThemedStyles(createStyles);
  const progressTone = tone === "neutral" ? "primary" : tone;

  return (
    <View style={[styles.card, styles[tone], style]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {typeof progress === "number" ? <ProgressBar progress={progress} tone={progressTone} /> : null}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    minHeight: 92,
    minWidth: "45%",
    padding: spacing.lg
  },
  neutral: {
    backgroundColor: palette.surface
  },
  primary: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primarySoft
  },
  success: {
    backgroundColor: palette.successSoft,
    borderColor: palette.successSoft
  },
  warning: {
    backgroundColor: palette.warningSoft,
    borderColor: palette.warningSoft
  },
  danger: {
    backgroundColor: palette.dangerSoft,
    borderColor: palette.dangerSoft
  },
  info: {
    backgroundColor: palette.infoSoft,
    borderColor: palette.infoSoft
  },
  value: {
    ...typography.heading,
    color: palette.textPrimary
  },
  label: {
    ...typography.caption,
    color: palette.textSecondary
  },
  helper: {
    ...typography.caption,
    color: palette.textMuted
  }
});
