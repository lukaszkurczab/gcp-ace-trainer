import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "../theme";

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...shadows.card,
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg
  }
});
