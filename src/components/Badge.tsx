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
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.border
  },
  primary: {
    backgroundColor: colors.dark.infoSoft,
    borderColor: colors.dark.infoSoft
  },
  ready: {
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
  label: {
    ...typography.caption
  },
  neutralLabel: {
    color: colors.dark.textSecondary
  },
  primaryLabel: {
    color: colors.dark.info
  },
  readyLabel: {
    color: colors.dark.primary
  },
  successLabel: {
    color: colors.dark.success
  },
  warningLabel: {
    color: colors.dark.warning
  },
  dangerLabel: {
    color: colors.dark.danger
  },
  infoLabel: {
    color: colors.dark.info
  }
});
