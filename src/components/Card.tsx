import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";

import { radius, shadows, spacing } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type CardVariant = "default" | "elevated" | "interactive" | "tonal" | "warning" | "success";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  variant?: CardVariant;
};

export function Card({ children, onPress, style, testID, variant = "default" }: CardProps) {
  const styles = useThemedStyles(createStyles);
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

  return <View collapsable={testID ? false : undefined} style={[styles.card, styles[variant], style]} testID={testID}>{children}</View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
    backgroundColor: palette.surface
  },
  interactive: {
    borderColor: palette.borderStrong
  },
  tonal: {
    ...shadows.elevated,
    backgroundColor: palette.elevatedSurface,
    borderColor: palette.borderStrong
  },
  warning: {
    backgroundColor: palette.warningSoft,
    borderColor: palette.warningSoft,
    ...shadows.none
  },
  success: {
    backgroundColor: palette.successSoft,
    borderColor: palette.successSoft,
    ...shadows.none
  },
  pressed: {
    opacity: 0.86
  }
});
