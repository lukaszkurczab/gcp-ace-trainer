import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type BadgeTone = "neutral" | "primary" | "ready" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  neutral: {
    backgroundColor: colors.light.elevatedSurface,
    borderColor: colors.light.border
  },
  primary: {
    backgroundColor: colors.light.infoSoft,
    borderColor: colors.light.infoSoft
  },
  ready: {
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
  label: {
    ...typography.caption
  },
  neutralLabel: {
    color: colors.light.textSecondary
  },
  primaryLabel: {
    color: colors.light.info
  },
  readyLabel: {
    color: colors.light.primary
  },
  successLabel: {
    color: colors.light.success
  },
  warningLabel: {
    color: colors.light.warning
  },
  dangerLabel: {
    color: colors.light.danger
  },
  infoLabel: {
    color: colors.light.info
  }
});
