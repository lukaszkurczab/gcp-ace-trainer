import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "../theme";

type CardVariant = "default" | "elevated" | "interactive" | "warning" | "success";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: CardVariant;
};

export function Card({ children, onPress, style, variant = "default" }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, styles[variant], styles.interactive, pressed ? styles.pressed : null, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg
  },
  default: {
    ...shadows.card
  },
  elevated: {
    ...shadows.elevated,
    backgroundColor: colors.light.surface
  },
  interactive: {
    borderColor: colors.light.borderStrong
  },
  warning: {
    backgroundColor: colors.light.warningSoft,
    borderColor: colors.light.warningSoft,
    ...shadows.none
  },
  success: {
    backgroundColor: colors.light.successSoft,
    borderColor: colors.light.successSoft,
    ...shadows.none
  },
  pressed: {
    opacity: 0.86
  }
});
