import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "../theme";

type CardVariant = "default" | "elevated" | "interactive" | "tonal" | "warning" | "success";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  variant?: CardVariant;
};

export function Card({ children, onPress, style, testID, variant = "default" }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, styles[variant], styles.interactive, pressed ? styles.pressed : null, style]}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.card, styles[variant], style]} testID={testID}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.border,
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
    backgroundColor: colors.dark.surface
  },
  interactive: {
    borderColor: colors.dark.borderStrong
  },
  tonal: {
    ...shadows.elevated,
    backgroundColor: colors.dark.elevatedSurface,
    borderColor: colors.dark.borderStrong
  },
  warning: {
    backgroundColor: colors.dark.warningSoft,
    borderColor: colors.dark.warningSoft,
    ...shadows.none
  },
  success: {
    backgroundColor: colors.dark.successSoft,
    borderColor: colors.dark.successSoft,
    ...shadows.none
  },
  pressed: {
    opacity: 0.86
  }
});
