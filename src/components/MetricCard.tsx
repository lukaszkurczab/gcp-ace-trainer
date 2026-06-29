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
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    minHeight: 92,
    minWidth: "45%",
    padding: spacing.lg
  },
  neutral: {
    backgroundColor: colors.dark.surface
  },
  primary: {
    backgroundColor: colors.dark.primarySoft,
    borderColor: colors.dark.primarySoft
  },
  success: {
    backgroundColor: colors.dark.successSoft,
    borderColor: colors.dark.successSoft
  },
  warning: {
    backgroundColor: colors.dark.warningSoft,
    borderColor: colors.dark.warningSoft
  },
  danger: {
    backgroundColor: colors.dark.dangerSoft,
    borderColor: colors.dark.dangerSoft
  },
  info: {
    backgroundColor: colors.dark.infoSoft,
    borderColor: colors.dark.infoSoft
  },
  value: {
    ...typography.heading,
    color: colors.dark.textPrimary
  },
  label: {
    ...typography.caption,
    color: colors.dark.textSecondary
  },
  helper: {
    ...typography.caption,
    color: colors.dark.textMuted
  }
});
