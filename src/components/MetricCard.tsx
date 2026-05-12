import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../theme";
import { ProgressBar } from "./ProgressBar";

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    minHeight: 92,
    minWidth: "45%",
    padding: spacing.lg
  },
  neutral: {
    backgroundColor: colors.light.surface
  },
  primary: {
    backgroundColor: colors.light.primarySoft,
    borderColor: colors.light.primarySoft
  },
  success: {
    backgroundColor: colors.light.successSoft,
    borderColor: colors.light.successSoft
  },
  warning: {
    backgroundColor: colors.light.warningSoft,
    borderColor: colors.light.warningSoft
  },
  danger: {
    backgroundColor: colors.light.dangerSoft,
    borderColor: colors.light.dangerSoft
  },
  info: {
    backgroundColor: colors.light.infoSoft,
    borderColor: colors.light.infoSoft
  },
  value: {
    ...typography.heading,
    color: colors.light.textPrimary
  },
  label: {
    ...typography.caption,
    color: colors.light.textSecondary
  },
  helper: {
    ...typography.caption,
    color: colors.light.textMuted
  }
});
