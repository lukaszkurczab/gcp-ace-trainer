import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  variant?: ButtonVariant;
};

export function Button({ children, disabled = false, onPress, style, variant = "primary" }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <Text style={[styles.label, variant === "secondary" ? styles.secondaryLabel : null, disabled ? styles.disabledLabel : null]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primary: {
    backgroundColor: colors.light.primary
  },
  secondary: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderWidth: 1
  },
  pressed: {
    opacity: 0.82
  },
  disabled: {
    backgroundColor: colors.light.surfaceMuted
  },
  label: {
    ...typography.bodyStrong,
    color: colors.light.surface,
    textAlign: "center"
  },
  secondaryLabel: {
    color: colors.light.text
  },
  disabledLabel: {
    color: colors.light.textMuted
  }
});
