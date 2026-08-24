import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, typography } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type BadgeTone = "neutral" | "primary" | "ready" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text maxFontSizeMultiplier={2} style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  neutral: {
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.border
  },
  primary: {
    backgroundColor: palette.infoSoft,
    borderColor: palette.infoSoft
  },
  ready: {
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
  label: {
    ...typography.caption
  },
  neutralLabel: {
    color: palette.textSecondary
  },
  primaryLabel: {
    color: palette.info
  },
  readyLabel: {
    color: palette.primary
  },
  successLabel: {
    color: palette.success
  },
  warningLabel: {
    color: palette.warning
  },
  dangerLabel: {
    color: palette.danger
  },
  infoLabel: {
    color: palette.info
  }
});
