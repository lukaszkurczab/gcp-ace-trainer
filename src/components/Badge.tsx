import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.label, tone === "neutral" ? styles.neutralLabel : styles.inverseLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  neutral: {
    backgroundColor: colors.light.surfaceMuted
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
  label: {
    ...typography.caption
  },
  neutralLabel: {
    color: colors.light.text
  },
  inverseLabel: {
    color: colors.light.surface
  }
});
